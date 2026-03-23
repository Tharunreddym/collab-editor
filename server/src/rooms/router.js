const router = require('express').Router();
const { getDB } = require('../db/client');
const { requireAuth } = require('../auth/middleware');

// GET /api/rooms — list rooms user is a member of + public rooms
router.get('/', requireAuth, async (req, res) => {
  const db = getDB();
  const { rows } = await db.query(
    `SELECT r.id, r.name, r.language, r.is_public, r.created_at,
            u.username AS owner,
            rm.role
     FROM rooms r
     JOIN users u ON u.id = r.owner_id
     LEFT JOIN room_members rm ON rm.room_id = r.id AND rm.user_id = $1
     WHERE r.is_public = TRUE OR rm.user_id = $1
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );
  res.json({ rooms: rows });
});

// POST /api/rooms — create a room
router.post('/', requireAuth, async (req, res) => {
  const { name, language = 'javascript', is_public = false } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const db = getDB();
  try {
    const { rows: [room] } = await db.query(
      `INSERT INTO rooms (name, owner_id, language, is_public) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, req.user.id, language, is_public]
    );
    await db.query(
      `INSERT INTO room_members (room_id, user_id, role) VALUES ($1,$2,'owner')`,
      [room.id, req.user.id]
    );
    await db.query(
      `INSERT INTO sessions (room_id, snapshot, revision) VALUES ($1, '', 0)`,
      [room.id]
    );
    res.status(201).json({ room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/rooms/:id — get room + latest snapshot
router.get('/:id', requireAuth, async (req, res) => {
  const db = getDB();
  const { rows: [room] } = await db.query(
    `SELECT r.*, u.username AS owner
     FROM rooms r JOIN users u ON u.id = r.owner_id
     WHERE r.id = $1`,
    [req.params.id]
  );
  if (!room) return res.status(404).json({ error: 'Room not found' });

  // Check access
  if (!room.is_public) {
    const { rows: [member] } = await db.query(
      `SELECT role FROM room_members WHERE room_id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );
    if (!member) return res.status(403).json({ error: 'Access denied' });
    room.role = member.role;
  }

  const { rows: [session] } = await db.query(
    `SELECT snapshot, revision FROM sessions WHERE room_id=$1 ORDER BY saved_at DESC LIMIT 1`,
    [req.params.id]
  );
  res.json({ room, session: session || { snapshot: '', revision: 0 } });
});

// POST /api/rooms/:id/invite — add a member
router.post('/:id/invite', requireAuth, async (req, res) => {
  const { username, role = 'editor' } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  const db = getDB();
  // Only owner can invite
  const { rows: [member] } = await db.query(
    `SELECT role FROM room_members WHERE room_id=$1 AND user_id=$2`,
    [req.params.id, req.user.id]
  );
  if (!member || member.role !== 'owner') return res.status(403).json({ error: 'Only owner can invite' });

  const { rows: [invitee] } = await db.query(`SELECT id FROM users WHERE username=$1`, [username]);
  if (!invitee) return res.status(404).json({ error: 'User not found' });

  await db.query(
    `INSERT INTO room_members (room_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [req.params.id, invitee.id, role]
  );
  res.json({ ok: true });
});

module.exports = router;
