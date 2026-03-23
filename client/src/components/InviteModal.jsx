import { useState } from 'react';
import { api } from '../lib/api';
import styles from './InviteModal.module.css';

export default function InviteModal({ roomId, onClose }) {
  const [username, setUsername] = useState('');
  const [role, setRole]         = useState('editor');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleInvite(e) {
    e.preventDefault();
    setLoading(true); setStatus('');
    try {
      await api.rooms.invite(roomId, { username, role });
      setStatus(`✓ ${username} added as ${role}`);
      setUsername('');
    } catch (err) {
      setStatus(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Invite collaborator</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleInvite} className={styles.form}>
          <label className={styles.label}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="their username…" required autoFocus />
          <label className={styles.label}>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="editor">Editor — can type</option>
            <option value="viewer">Viewer — read only</option>
          </select>
          {status && <p className={status.startsWith('✓') ? styles.ok : styles.err}>{status}</p>}
          <button className={styles.btn} disabled={loading}>{loading ? 'Inviting…' : 'Send invite →'}</button>
        </form>
      </div>
    </div>
  );
}
