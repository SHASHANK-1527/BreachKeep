import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'
import ParticleField from '../sanctum/ParticleField.jsx'

const PASSWORD_RULES = [
  { id: 'len', label: '8-20 characters long', test: (v) => v.length >= 8 && v.length <= 20 },
  { id: 'upper', label: 'At least 1 uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'num', label: 'At least 1 number', test: (v) => /[0-9]/.test(v) },
  { id: 'sym', label: 'At least 1 special character', test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
  { id: 'nospace', label: 'No spaces allowed', test: (v) => v.length > 0 && !/\s/.test(v) },
]

function CheckIcon({ ok }) {
  return (
    <span style={{
      width: 14, height: 14, flexShrink: 0, display: 'grid', placeItems: 'center',
      borderRadius: '50%', background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={ok ? '#22c55e' : '#ef4444'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {ok ? <polyline points="20 6 9 17 4 12" /> : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
      </svg>
    </span>
  )
}

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder, 
  show, 
  setShow, 
  required = false,
  withRules = false 
}) => (
  <div>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        className="sn-input"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ flex: 1, paddingRight: '40px' }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          position: 'absolute',
          right: '8px',
          background: 'none',
          border: 'none',
          color: '#ff5a1f',
          cursor: 'pointer',
          fontSize: '0.85rem',
          padding: '4px 8px',
        }}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
    {withRules && value.length > 0 && (
      <div style={{ margin: '0.45rem 0 0.15rem' }}>
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(value)
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', padding: '2px 0', color: ok ? '#22c55e' : 'rgba(233,217,209,0.55)' }}>
              <CheckIcon ok={ok} />
              <span>{r.label}</span>
            </div>
          )
        })}
      </div>
    )}
  </div>
)

// The gate cookie's mode decides whether this is signup (register) or login (session).
// We don't know the mode in JS (httpOnly), so we try login first; if the server says
// the gate is register-only it 404s and we fall back to the signup form. Simpler:
// we show both, and the server enforces which one the current gate allows.
export default function Enter() {
  const nav = useNavigate()
  const { setUser, refresh } = useAuth()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [stage, setStage] = useState('form') // 'form' | 'verify' | 'session' | 'forgot'
  const [vcode, setVcode] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const onGoogle = async (cred) => {
    setErr('')
    try {
      const data = await api.post('/auth/google', { idToken: cred.credential })
      if (data?.requiresSessionCode) {
        setForm((p) => ({ ...p, email: data.email || form.email }))
        setStage('session')
      } else {
        setUser(data.user)
        nav(data.user?.house ? '/dashboard' : '/onboarding')
      }
    } catch (e) {
      setErr(e.data?.error || 'Google sign-in failed')
    }
  }

  const doLogin = async () => {
    setErr(''); setBusy(true)
    try {
      const data = await api.post('/auth/login', { email: form.email, password: form.password })
      if (data?.requiresSessionCode) {
        setStage('session')
      } else {
        setUser(data.user)
        nav(data.user?.house ? '/dashboard' : '/onboarding')
      }
    } catch (e) { setErr(e.data?.error || 'Login failed') } finally { setBusy(false) }
  }

  const doSignup = async () => {
    setErr(''); setBusy(true)
    try {
      await api.post('/auth/signup', form)
      setStage('verify')
    } catch (e) { setErr(e.data?.error || 'Signup failed') } finally { setBusy(false) }
  }

  const doSession = async () => {
    setErr(''); setBusy(true)
    try {
      const data = await api.post('/auth/verify-session', { email: form.email, sessionCode })
      setUser(data.user)
      nav(data.user?.house ? '/dashboard' : '/onboarding')
    } catch (e) { setErr(e.data?.error || 'Session verification failed') } finally { setBusy(false) }
  }

  const doVerify = async () => {
    setErr(''); setBusy(true)
    try {
      const { user } = await api.post('/auth/verify', { email: form.email, code: vcode })
      setUser(user)
      nav('/onboarding')
    } catch (e) { setErr(e.data?.error || 'Verification failed') } finally { setBusy(false) }
  }

  const doForgot = async () => {
    setErr(''); setMsg(''); setBusy(true)
    try {
      await api.post('/auth/forgot-password', { email: form.email })
      setMsg('If that email has an account, a reset link has been sent.')
    } catch (e) {
      setMsg(e.data?.error || 'Failed to send reset link')
    } finally { setBusy(false) }
  }

  return (
    <div className="sn-enter">
      <ParticleField mode="portal" />
      <div className="sn-auth-card">
        <h1 className="sn-title">BreachKeep</h1>
        {stage === 'session' ? (
          <>
            <p className="sn-sub">Enter the daily session code sent to {form.email}.</p>
            <input className="sn-code-input" value={sessionCode} onChange={(e) => setSessionCode(e.target.value)} placeholder="6-digit session code" maxLength={8} />
            {err && <div className="sn-error">{err}</div>}
            <button className="sn-enter-btn" onClick={doSession} disabled={busy}>Verify Session</button>
          </>
        ) : stage === 'verify' ? (
          <>
            <p className="sn-sub">Enter the 6-digit code sent to {form.email}.</p>
            <input className="sn-code-input" value={vcode} onChange={(e) => setVcode(e.target.value)} placeholder="______" />
            {err && <div className="sn-error">{err}</div>}
            <button className="sn-enter-btn" onClick={doVerify} disabled={busy}>Verify</button>
          </>
        ) : stage === 'forgot' ? (
          <>
            <p className="sn-sub">Enter your email to receive a password reset link.</p>
            <input className="sn-input" placeholder="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {msg && <div className={`sn-error ${msg.startsWith('If') ? 'sn-success' : ''}`}>{msg}</div>}
            <button className="sn-enter-btn" onClick={doForgot} disabled={busy}>
              {busy ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="sn-or">or</div>
            <button className="sn-ghost-btn" onClick={() => setStage('form')}>Back to Login</button>
          </>
        ) : (
          <>
            <div className="sn-tabs">
              <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setStage('form'); }}>Returning</button>
              <button className={tab === 'signup' ? 'active' : ''} onClick={() => { setTab('signup'); setStage('form'); }}>First time</button>
            </div>
            {tab === 'signup' && (
              <input className="sn-input" placeholder="username" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            )}
            <input className="sn-input" placeholder="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <PasswordInput
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="password"
              show={showPassword}
              setShow={setShowPassword}
              required
              withRules={tab === 'signup'}
            />
            {err && <div className="sn-error">{err}</div>}
            <button className="sn-enter-btn" onClick={tab === 'login' ? doLogin : doSignup} disabled={busy}>
              {tab === 'login' ? 'Log in' : 'Create account'}
            </button>
            {tab === 'login' && (
              <button className="sn-ghost-btn" style={{ marginTop: '0.5rem' }} onClick={() => setStage('forgot')}>
                Forgot password?
              </button>
            )}
            <div className="sn-or">or</div>
            <div className="sn-google">
              {tab === 'signup' ? (
                <GoogleLogin 
                  onSuccess={onGoogle} 
                  onError={() => setErr('Google sign-up failed')} 
                  render={(renderProps) => (
                    <button 
                      type="button"
                      onClick={renderProps.onClick}
                      disabled={renderProps.disabled || busy}
                      className="sn-enter-btn"
                      style={{ background: '#4285f4', color: '#fff', border: 'none' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  )}
                />
              ) : (
                <GoogleLogin 
                  onSuccess={onGoogle} 
                  onError={() => setErr('Google sign-in failed')} 
                  render={(renderProps) => (
                    <button 
                      type="button"
                      onClick={renderProps.onClick}
                      disabled={renderProps.disabled || busy}
                      className="sn-enter-btn"
                      style={{ background: '#4285f4', color: '#fff', border: 'none' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  )}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}