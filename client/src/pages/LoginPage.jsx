import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import GhostCompanion from '../components/GhostCompanion';
import styles from './Auth.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [formActive, setFormActive] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authError, setAuthError]     = useState(false);

  function handleInput(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setFormActive(true);
    setTimeout(() => setFormActive(false), 50);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setAuthError(false);
    setLoading(true);
    try {
      const { token, user } = await api.auth.login(form);
      setAuthSuccess(true);
      setTimeout(() => { login(token, user); navigate('/'); }, 1200);
    } catch (err) {
      setError(err.message);
      setAuthError(true);
      setTimeout(() => setAuthError(false), 100);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>⌨</div>
          <span className={styles.logoText}>collab</span>
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your workspace</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email</label>
            <input type="email" value={form.email} onChange={e => handleInput('email', e.target.value)} placeholder="you@example.com" required autoFocus />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <input type="password" value={form.password} onChange={e => handleInput('password', e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} disabled={loading}>{loading ? 'Signing in…' : 'Sign in →'}</button>
        </form>
        <div className={styles.divider}><span>or</span></div>
        <p className={styles.footer}>No account? <Link to="/register">Create one</Link></p>
        <div className={styles.hint}>Demo: <strong>demo@example.com</strong> / <strong>password123</strong></div>
      </div>

      <GhostCompanion
        page="login"
        formActive={formActive}
        authSuccess={authSuccess}
        authError={authError}
      />
    </div>
  );
}
