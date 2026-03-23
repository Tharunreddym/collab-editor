import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import { useCollabSocket } from '../hooks/useCollabSocket';
import PresenceBar from '../components/PresenceBar';
import StatusBar from '../components/StatusBar';
import InviteModal from '../components/InviteModal';
import GhostCompanion from '../components/GhostCompanion';
import styles from './Editor.module.css';

const LANG_MAP = {
  javascript: javascript({ jsx: true }),
  typescript: javascript({ typescript: true }),
  python: python(),
  rust: rust(),
  html: html(),
  css: css(),
};

export default function EditorPage() {
  const { id: roomId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom]         = useState(null);
  const [doc, setDoc]           = useState('');
  const [members, setMembers]   = useState([]);
  const [saved, setSaved]       = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  // Ghost companion state
  const [runSuccess, setRunSuccess] = useState(false);
  const [runError, setRunError]     = useState(false);
  const [isTyping, setIsTyping]     = useState(false);
  const [lastSaved, setLastSaved]   = useState(null);
  const [runOutput, setRunOutput]   = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const typingTimer = useRef(null);

  const remoteUpdateRef = useRef(false);

  useEffect(() => {
    api.rooms.get(roomId)
      .then(({ room, session }) => { setRoom(room); setDoc(session.snapshot); })
      .catch(() => navigate('/'));
  }, [roomId]);

  const handleInit = useCallback(({ doc: d }) => {
    remoteUpdateRef.current = true;
    setDoc(d);
  }, []);

  const handleRemoteOp = useCallback(({ op }) => {
    if (!op) return;
    remoteUpdateRef.current = true;
    setDoc(prev => {
      if (op.type === 'insert') return prev.slice(0, op.pos) + op.chars + prev.slice(op.pos);
      if (op.type === 'delete') return prev.slice(0, op.pos) + prev.slice(op.pos + op.count);
      return prev;
    });
  }, []);

  const { status, sendOp, requestSave } = useCollabSocket({
    roomId, token,
    onInit: handleInit,
    onRemoteOp: handleRemoteOp,
    onPresence: useCallback(m => setMembers(m), []),
    onCursor: useCallback(() => {}, []),
  });

  const handleChange = useCallback((value, viewUpdate) => {
    if (remoteUpdateRef.current) { remoteUpdateRef.current = false; return; }
    // Signal typing to ghost
    setIsTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), 1500);
    for (const tr of viewUpdate.transactions) {
      if (!tr.docChanged) continue;
      tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
        const str = inserted.toString();
        if (toA > fromA) sendOp({ type: 'delete', pos: fromA, count: toA - fromA });
        if (str.length > 0) sendOp({ type: 'insert', pos: fromA, chars: str });
      });
    }
    setDoc(value);
  }, [sendOp]);

  function handleSave() {
    requestSave();
    setSaved(true);
    setLastSaved(Date.now()); // triggers ghost
    setTimeout(() => setSaved(false), 2500);
  }

  // Run button — executes JS in a sandboxed iframe and reports success/error
  function handleRun() {
    setRunSuccess(false);
    setRunError(false);
    setRunOutput(null);

    const logs = [];
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    win.console = {
      log:   (...a) => logs.push(a.map(String).join(' ')),
      error: (...a) => logs.push('ERROR: ' + a.map(String).join(' ')),
      warn:  (...a) => logs.push('WARN: ' + a.map(String).join(' ')),
    };

    try {
      win.eval(doc);
      setRunOutput(logs.length ? logs.join('\n') : '✓ Ran with no output');
      setShowOutput(true);
      setRunSuccess(true);
      setTimeout(() => setRunSuccess(false), 100);
    } catch (err) {
      setRunOutput('✗ ' + err.message);
      setShowOutput(true);
      setRunError(true);
      setTimeout(() => setRunError(false), 100);
    } finally {
      document.body.removeChild(iframe);
    }
  }

  useEffect(() => {
    const onKey = e => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!room) return (
    <div className={styles.loading}>
      <div className={styles.loadingDot} />
      <div className={styles.loadingDot} />
      <div className={styles.loadingDot} />
    </div>
  );

  const isJS = ['javascript', 'typescript'].includes(room.language);

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <div className={styles.divider} />
        <div className={styles.roomInfo}>
          <span className={styles.roomName}>{room.name}</span>
          <span className={styles.langBadge}>{room.language}</span>
        </div>
        <div className={styles.topbarRight}>
          <PresenceBar members={members} currentUserId={user?.id} />
          {isJS && (
            <button className={styles.runBtn} onClick={handleRun} title="Run code (JS only)">
              ▶ Run
            </button>
          )}
          <button className={styles.inviteBtn} onClick={() => setShowInvite(true)}>Invite</button>
          <button className={styles.saveBtn} onClick={handleSave}>{saved ? '✓ Saved' : 'Save'}</button>
        </div>
      </header>

      <div className={styles.editorWrap}>
        <CodeMirror
          value={doc}
          height="100%"
          theme={oneDark}
          extensions={[LANG_MAP[room.language] || LANG_MAP.javascript]}
          onChange={handleChange}
          basicSetup={{ tabSize: 2, lineNumbers: true, foldGutter: true, autocompletion: true }}
          style={{ height: '100%', fontSize: 14 }}
        />
      </div>

      {/* Output panel */}
      {showOutput && runOutput && (
        <div className={`${styles.outputPanel} ${runOutput.startsWith('✗') ? styles.outputError : styles.outputSuccess}`}>
          <div className={styles.outputHeader}>
            <span className={styles.outputTitle}>Output</span>
            <button className={styles.outputClose} onClick={() => setShowOutput(false)}>✕</button>
          </div>
          <pre className={styles.outputContent}>{runOutput}</pre>
        </div>
      )}

      <StatusBar status={status} members={members} saved={saved} />

      {/* Ghost companion */}
      <GhostCompanion
        hasSuccess={runSuccess}
        hasError={runError}
        isTyping={isTyping}
        lastSaved={lastSaved}
      />

      {showInvite && <InviteModal roomId={roomId} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
