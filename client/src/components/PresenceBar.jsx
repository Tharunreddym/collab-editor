import styles from './PresenceBar.module.css';

export default function PresenceBar({ members, currentUserId }) {
  if (!members.length) return null;
  return (
    <div className={styles.bar}>
      {members.map((m, i) => (
        <div
          key={m.userId}
          className={styles.avatar}
          style={{
            background: m.color,
            borderColor: m.userId === currentUserId ? 'rgba(255,255,255,0.3)' : 'var(--bg)',
            animationDelay: `${i * 0.05}s`,
            zIndex: members.length - i,
          }}
        >
          {m.username[0].toUpperCase()}
          <span className={styles.tooltip}>{m.username}{m.userId === currentUserId ? ' (you)' : ''}</span>
        </div>
      ))}
    </div>
  );
}
