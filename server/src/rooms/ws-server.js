const { WebSocketServer, WebSocket } = require('ws');
const { URL } = require('url');
const { verifyWsToken } = require('../auth/middleware');
const { getRedis } = require('../redis/client');
const { getDB } = require('../db/client');
const { transformAgainstHistory } = require('../ot/engine');

// roomId -> Set<ws>
const rooms = new Map();

const ROOM_KEY    = id => `room:${id}:doc`;
const OPS_KEY     = id => `room:${id}:ops`;
const MEMBERS_KEY = id => `room:${id}:members`;
const SAVE_INTERVAL_MS = 30_000; // persist snapshot every 30s

function broadcast(roomId, message, exclude = null) {
  const clients = rooms.get(roomId);
  if (!clients) return;
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function broadcastPresence(roomId) {
  const clients = rooms.get(roomId);
  if (!clients) return;
  const members = [...clients].map(c => ({ userId: c.userId, username: c.username, color: c.color }));
  broadcast(roomId, { type: 'presence', members });
}

const COLORS = ['#58a6ff','#3fb950','#f78166','#d2a8ff','#e3b341','#79c0ff'];
let colorIdx = 0;

function initWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    // Auth
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    const roomId = url.searchParams.get('room');

    const user = verifyWsToken(token);
    if (!user || !roomId) { ws.close(4001, 'Unauthorized'); return; }

    // Access check
    const db = getDB();
    const redis = getRedis();
    const { rows: [room] } = await db.query(`SELECT id, is_public FROM rooms WHERE id=$1`, [roomId]);
    if (!room) { ws.close(4004, 'Room not found'); return; }

    if (!room.is_public) {
      const { rows: [member] } = await db.query(
        `SELECT role FROM room_members WHERE room_id=$1 AND user_id=$2`,
        [roomId, user.id]
      );
      if (!member) { ws.close(4003, 'Forbidden'); return; }
      ws.role = member.role;
    } else {
      ws.role = 'editor';
    }

    ws.userId   = user.id;
    ws.username = user.username;
    ws.roomId   = roomId;
    ws.color    = COLORS[colorIdx++ % COLORS.length];
    ws.isAlive  = true;

    // Add to room
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(ws);

    // Load current state from Redis (or Postgres fallback)
    let doc = await redis.get(ROOM_KEY(roomId));
    let revision = 0;
    if (doc === null) {
      const { rows: [session] } = await db.query(
        `SELECT snapshot, revision FROM sessions WHERE room_id=$1 ORDER BY saved_at DESC LIMIT 1`,
        [roomId]
      );
      doc = session?.snapshot ?? '';
      revision = session?.revision ?? 0;
      await redis.set(ROOM_KEY(roomId), doc);
      await redis.set(`room:${roomId}:rev`, String(revision));
    } else {
      const rev = await redis.get(`room:${roomId}:rev`);
      revision = rev ? parseInt(rev, 10) : 0;
    }

    // Send initial state to the joining client
    ws.send(JSON.stringify({ type: 'init', doc, revision, color: ws.color }));

    // Announce presence
    await redis.hSet(MEMBERS_KEY(roomId), user.id, user.username);
    broadcastPresence(roomId);

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async raw => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      switch (msg.type) {
        case 'op': {
          if (ws.role === 'viewer') return;

          const { op, clientRev } = msg;
          const currentDoc = (await redis.get(ROOM_KEY(roomId))) ?? '';
          const currentRev = parseInt((await redis.get(`room:${roomId}:rev`)) ?? '0', 10);

          // Fetch ops since clientRev
          const rawOps = await redis.lRange(OPS_KEY(roomId), clientRev, -1);
          const serverOps = rawOps.map(o => JSON.parse(o));

          const { transformedOp, newDoc } = transformAgainstHistory(op, serverOps, currentDoc);

          // Persist new state
          await redis.set(ROOM_KEY(roomId), newDoc);
          const newRev = currentRev + 1;
          await redis.set(`room:${roomId}:rev`, String(newRev));
          if (transformedOp) {
            await redis.rPush(OPS_KEY(roomId), JSON.stringify(transformedOp));
          }

          // Acknowledge to sender
          ws.send(JSON.stringify({ type: 'ack', revision: newRev }));

          // Broadcast to others
          broadcast(roomId, { type: 'op', op: transformedOp, revision: newRev, userId: ws.userId }, ws);
          break;
        }

        case 'cursor': {
          broadcast(roomId, {
            type: 'cursor',
            userId: ws.userId,
            username: ws.username,
            color: ws.color,
            position: msg.position,
          }, ws);
          break;
        }

        case 'save': {
          await persistSnapshot(roomId, redis, db);
          ws.send(JSON.stringify({ type: 'saved' }));
          break;
        }
      }
    });

    ws.on('close', async () => {
      rooms.get(roomId)?.delete(ws);
      if (rooms.get(roomId)?.size === 0) {
        rooms.delete(roomId);
        // Final persist on last member leaving
        await persistSnapshot(roomId, redis, db).catch(() => {});
      }
      await redis.hDel(MEMBERS_KEY(roomId), user.id);
      broadcastPresence(roomId);
    });
  });

  // Heartbeat
  const heartbeat = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  // Periodic auto-save
  const autoSave = setInterval(async () => {
    const redis = getRedis();
    const db = getDB();
    for (const [roomId] of rooms) {
      await persistSnapshot(roomId, redis, db).catch(console.error);
    }
  }, SAVE_INTERVAL_MS);

  wss.on('close', () => { clearInterval(heartbeat); clearInterval(autoSave); });

  console.log('✅ WebSocket server ready');
}

async function persistSnapshot(roomId, redis, db) {
  const doc = await redis.get(ROOM_KEY(roomId));
  const rev = await redis.get(`room:${roomId}:rev`);
  if (doc === null) return;
  await db.query(
    `INSERT INTO sessions (room_id, snapshot, revision) VALUES ($1,$2,$3)`,
    [roomId, doc, parseInt(rev ?? '0', 10)]
  );
  // Trim ops log to last 500 to avoid unbounded growth
  await redis.lTrim(OPS_KEY(roomId), -500, -1);
}

module.exports = { initWebSocket };
