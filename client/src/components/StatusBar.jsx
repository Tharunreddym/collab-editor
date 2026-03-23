import styles from './StatusBar.module.css';
const STATUS = {
    connecting: { label: 'Connecting', color: '#818cf8' },
    open:       { label: 'Live',       color: '#34d399' },
    closed:     { label: 'Disconnected', color: '#f87171' },
    error:      { label: 'Error',      color: '#f87171' },
};
export default function StatusBar({ status, members, saved }) {
    const s = STATUS[status] || STATUS.connecting;
    return (
        <div className={styles.bar}>
            <div className={styles.indicator}>
                <div className={`${styles.dot} ${status==='connecting'?styles.dotConnecting:''}`} style={{background:s.color}} />
                <span className={styles.label} style={{color:s.color}}>{s.label}</span>
            </div>
            <span className={styles.sep}>·</span>
            <span className={styles.info}>{members.length} online</span>
            {saved && <><span className={styles.sep}>·</span><span className={styles.saved}>Saved ✓</span></>}
            <span className={styles.hint}>⌘S to save</span>
        </div>
    );
}