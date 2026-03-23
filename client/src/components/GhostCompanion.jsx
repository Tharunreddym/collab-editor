import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GhostCompanion.module.css';

const MESSAGES = {
  idle:         ["Still here with you...", "Hey there 👻", "Ready when you are!", "Take your time..."],
  typing:       ["Ooh you're on fire! 🔥", "Keep going!", "Love the energy!", "Yes yes YES!", "Amazing flow!", "You're crushing it!"],
  success:      ["LETS GOOO!! 🎉", "PERFECT!! 🥳", "YOU DID IT!!", "MASTERPIECE!", "FLAWLESS!!", "100/100!! ✨"],
  error:        ["Hey, it's okay 💙", "Bugs make us stronger!", "Every error is progress", "You've got this!", "One more try 💪", "I believe in you!"],
  saved:        ["Safe and sound 💾", "Saved! Nice work ✨", "Your code is safe!"],
  timer:        ["30min of pure focus!", "Stretch break? 🧘", "Hydration check! 💧", "You're on a roll!"],
  login:        ["Welcome back! 👋", "Missed you!", "Let's build something!", "Ready to code?"],
  register:     ["Welcome aboard! 🎉", "So glad you're here!", "Let's gooo!!", "New coder unlocked! ✨"],
  formTyping:   ["Filling in forms...", "Almost there!", "You got this!", "Nearly ready!"],
  loginPage:    ["Sign in to start coding!", "Your code misses you 👻", "Let's get building!", "One click away..."],
  registerPage: ["Join the fun!", "Welcome to collab!", "Create your account!", "Let's gooo 🚀"],
};

const STATES = {
  idle:       { label: 'idle' },
  typing:     { label: 'typing' },
  success:    { label: 'success' },
  error:      { label: 'error' },
  saved:      { label: 'saved' },
  timer:      { label: 'reminder' },
  login:      { label: 'welcome' },
  register:   { label: 'woohoo' },
  formTyping: { label: 'watching' },
  loginPage:  { label: 'waiting' },
  registerPage:{ label: 'excited' },
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function GhostCompanion({
  // editor triggers
  lastSaved, hasError, hasSuccess, isTyping,
  // auth page triggers
  page,           // 'login' | 'register' | null
  formActive,     // true when user is typing in form
  authSuccess,    // true on successful login/register
  authError,      // true on failed login/register
}) {
  const [state, setState]         = useState(() => page ? page + 'Page' : 'idle');
  const [message, setMessage]     = useState(() => pick(MESSAGES[page ? page + 'Page' : 'idle']));
  const [visible, setVisible]     = useState(true);
  const [overlay, setOverlay]     = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [eyes, setEyes]           = useState('normal');
  const [bounce, setBounce]       = useState(false);
  const idleTimer    = useRef(null);
  const timerMinute  = useRef(0);
  const codingTimer  = useRef(null);

  const triggerState = useCallback((s, showOverlay = false) => {
    setState(s);
    setMessage(pick(MESSAGES[s] || MESSAGES.idle));
    setVisible(true);
    setBounce(true);
    setTimeout(() => setBounce(false), 600);
    if (showOverlay) {
      setOverlay(true);
      setTimeout(() => setOverlay(false), 2800);
    }
    if (['success','register','login'].includes(s)) setEyes('happy');
    else if (['error','authError'].includes(s))     setEyes('wide');
    else if (s === 'formTyping')                    setEyes('normal');
    else                                            setEyes('normal');
  }, []);

  // ── Auth page triggers ──
  useEffect(() => {
    if (page) {
      triggerState(page + 'Page', false);
    }
  }, [page]);

  useEffect(() => { if (formActive)   triggerState('formTyping', false); }, [formActive]);
  useEffect(() => { if (authSuccess)  triggerState(page === 'register' ? 'register' : 'login', true); }, [authSuccess]);
  useEffect(() => { if (authError)    triggerState('error', true); }, [authError]);

  // ── Editor triggers ──
  useEffect(() => { if (hasSuccess) triggerState('success', true); }, [hasSuccess]);
  useEffect(() => { if (hasError)   triggerState('error',   true); }, [hasError]);
  useEffect(() => { if (lastSaved)  triggerState('saved',   false); }, [lastSaved]);

  useEffect(() => {
    if (!isTyping) return;
    clearTimeout(idleTimer.current);
    if (state === 'idle') triggerState('typing', false);
    idleTimer.current = setTimeout(() => {
      setState('idle'); setMessage(pick(MESSAGES.idle)); setEyes('normal');
    }, 3000);
  }, [isTyping]);

  // 30-min coding timer (only in editor)
  useEffect(() => {
    if (page) return;
    codingTimer.current = setInterval(() => {
      timerMinute.current += 1;
      if (timerMinute.current % 30 === 0) triggerState('timer', false);
    }, 60_000);
    return () => clearInterval(codingTimer.current);
  }, [page]);

  // Eye blink
  useEffect(() => {
    const blink = setInterval(() => {
      if (eyes === 'normal') {
        setEyes('blink');
        setTimeout(() => setEyes('normal'), 140);
      }
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blink);
  }, [eyes]);

  if (minimized) return (
    <button className={styles.pill} onClick={() => setMinimized(false)} title="Show companion">👻</button>
  );

  const isSuccess = ['success','login','register'].includes(state);
  const isErr     = state === 'error';

  return (
    <>
      {overlay && (
        <div className={`${styles.overlay} ${isSuccess ? styles.overlaySuccess : styles.overlayError}`}>
          <div className={styles.overlayGhost}>
            <GhostSVG eyes={isSuccess ? 'happy' : 'wide'} state={state} big />
          </div>
          <p className={styles.overlayMsg}>{message}</p>
          {isSuccess && <Confetti />}
        </div>
      )}

      <div className={`${styles.companion} ${bounce ? styles.bounce : ''}`}>
        <button className={styles.minimize} onClick={() => setMinimized(true)} title="Hide">−</button>
        <div className={`${styles.bubble} ${visible ? styles.bubbleVisible : ''}`}>
          <span className={styles.bubbleText}>{message}</span>
        </div>
        <div className={`${styles.ghost} ${styles[state] || ''}`}>
          <GhostSVG eyes={eyes} state={state} />
        </div>
        <p className={styles.stateLabel}>{STATES[state]?.label || 'idle'}</p>
      </div>
    </>
  );
}

function GhostSVG({ eyes, state, big }) {
  const size = big ? 140 : 80;
  const bodyColor =
    ['success','login','register'].includes(state) ? '#a3e635' :
    state === 'error'    ? '#93c5fd' :
    state === 'formTyping' ? '#fde68a' :
    '#e2e8f0';
  const shadowColor =
    ['success','login','register'].includes(state) ? '#65a30d' :
    state === 'error'    ? '#3b82f6' :
    state === 'formTyping' ? '#f59e0b' :
    '#94a3b8';

  return (
    <svg width={size} height={size} viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 45 C10 22 20 10 40 10 C60 10 70 22 70 45 L70 75 C70 75 62 68 55 75 C48 82 42 68 40 75 C38 82 32 82 25 75 C18 68 10 75 10 75 Z"
        fill={bodyColor}
      />
      <path d="M25 60 C25 60 30 65 40 65 C50 65 55 60 55 60" stroke={shadowColor} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      <EyesSVG type={eyes} state={state} />
      {(eyes === 'happy') && <>
        <circle cx="24" cy="48" r="5" fill="#fda4af" opacity="0.5" />
        <circle cx="56" cy="48" r="5" fill="#fda4af" opacity="0.5" />
      </>}
    </svg>
  );
}

function EyesSVG({ type }) {
  if (type === 'blink') return (
    <>
      <line x1="26" y1="40" x2="34" y2="40" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="40" x2="54" y2="40" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
    </>
  );
  if (type === 'happy') return (
    <>
      <path d="M26 42 Q30 36 34 42" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M46 42 Q50 36 54 42" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </>
  );
  if (type === 'wide') return (
    <>
      <circle cx="30" cy="40" r="6" fill="#1e293b" />
      <circle cx="50" cy="40" r="6" fill="#1e293b" />
      <circle cx="32" cy="38" r="1.5" fill="white" />
      <circle cx="52" cy="38" r="1.5" fill="white" />
    </>
  );
  return (
    <>
      <circle cx="30" cy="40" r="5" fill="#1e293b" />
      <circle cx="50" cy="40" r="5" fill="#1e293b" />
      <circle cx="31.5" cy="38.5" r="1.5" fill="white" />
      <circle cx="51.5" cy="38.5" r="1.5" fill="white" />
    </>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${4 + Math.random() * 92}%`,
    delay: `${Math.random() * 0.6}s`,
    color: ['#fbbf24','#34d399','#60a5fa','#f472b6','#a78bfa','#fb923c'][i % 6],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));
  return (
    <div className={styles.confettiWrap}>
      {pieces.map(p => (
        <div key={p.id} className={styles.confettiPiece} style={{
          left: p.left, animationDelay: p.delay,
          width: p.size, height: p.size,
          background: p.color,
          transform: `rotate(${p.rotate}deg)`,
        }} />
      ))}
    </div>
  );
}
