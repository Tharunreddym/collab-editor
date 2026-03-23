import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import styles from './Dashboard.module.css';

const LANGUAGES = ['javascript','typescript','python','rust','html','css'];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [newRoom, setNewRoom]   = useState({ name: '', language: 'javascript', is_public: false });

  useEffect(() => {
    api.rooms.list()
      .then(({ rooms }) => setRooms(rooms))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const { room } = await api.rooms.create(newRoom);
      navigate(`/room/${room.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>⌨</div>
          <span className={styles.logoText}>collab</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.username}>@{user?.username}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.topRow}>
          <div className={styles.headingGroup}>
            <p className={styles.headingEyebrow}>Your workspace</p>
            <h1 className={styles.heading}>Rooms</h1>
          </div>
          <button className={styles.newBtn} onClick={() => setShowNew(v => !v)}>
            {showNew ? '✕ Cancel' : '+ New Room'}
          </button>
        </div>

        {showNew && (
          <form className={styles.newForm} onSubmit={handleCreate}>
            <input
              placeholder="Room name…"
              value={newRoom.name}
              onChange={e => setNewRoom(f => ({...f, name: e.target.value}))}
              required autoFocus
            />
            <select value={newRoom.language} onChange={e => setNewRoom(f => ({...f, language: e.target.value}))}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={newRoom.is_public} onChange={e => setNewRoom(f => ({...f, is_public: e.target.checked}))} />
              Public
            </label>
            <button className={styles.createBtn} type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create room →'}
            </button>
          </form>
        )}

        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⌛</div>
            <p className={styles.emptyText}>Loading rooms…</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⌨</div>
            <p className={styles.emptyText}>No rooms yet</p>
            <p className={styles.emptyHint}>Create one above to start collaborating</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {rooms.map(room => (
              <button key={room.id} className={styles.roomCard} onClick={() => navigate(`/room/${room.id}`)}>
                <div className={styles.roomTop}>
                  <span className={styles.roomName}>{room.name}</span>
                  {room.is_public && <span className={styles.badge}>public</span>}
                </div>
                {room.role && <span className={styles.role}>{room.role}</span>}
                <div className={styles.roomMeta}>
                  <span className={styles.lang}>{room.language}</span>
                  <span className={styles.owner}>by {room.owner}</span>
                </div>
                <span className={styles.roomArrow}>→</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
