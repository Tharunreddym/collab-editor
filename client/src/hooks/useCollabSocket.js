import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useCollabSocket
 * Connects to the WS server, handles OT acknowledgement,
 * and exposes sendOp / sendCursor for the editor to call.
 */
export function useCollabSocket({ roomId, token, onInit, onRemoteOp, onPresence, onCursor }) {
  const wsRef        = useRef(null);
  const [status, setStatus]   = useState('connecting'); // connecting | open | closed | error
  const pendingOps   = useRef([]); // ops sent but not yet ack'd
  const clientRevRef = useRef(0);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    if (!roomId || !token) return;

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host  = import.meta.env.VITE_WS_URL || `${proto}://${window.location.host}`;
    const url   = `${host}/ws?room=${roomId}&token=${token}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => setStatus('open');

    ws.onmessage = ({ data }) => {
      let msg;
      try { msg = JSON.parse(data); } catch { return; }

      switch (msg.type) {
        case 'init': {
          clientRevRef.current = msg.revision;
          onInit?.(msg);
          break;
        }
        case 'ack': {
          // Server confirmed our op — advance revision, drop from pending
          clientRevRef.current = msg.revision;
          pendingOps.current.shift();
          break;
        }
        case 'op': {
          clientRevRef.current = msg.revision;
          onRemoteOp?.(msg);
          break;
        }
        case 'presence': {
          onPresence?.(msg.members);
          break;
        }
        case 'cursor': {
          onCursor?.(msg);
          break;
        }
      }
    };

    ws.onclose = (e) => {
      setStatus('closed');
      if (e.code !== 4001 && e.code !== 4003) {
        // Reconnect with back-off (not auth errors)
        reconnectRef.current = setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => setStatus('error');
  }, [roomId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendOp = useCallback((op) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const msg = { type: 'op', op, clientRev: clientRevRef.current };
    pendingOps.current.push(msg);
    ws.send(JSON.stringify(msg));
  }, []);

  const sendCursor = useCallback((position) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'cursor', position }));
  }, []);

  const requestSave = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'save' }));
  }, []);

  return { status, sendOp, sendCursor, requestSave };
}
