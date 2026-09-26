import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'

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
  withRules = false,
  className = 'sn-input',
}) => (
  <div>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        className={className}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ flex: 1, paddingRight: '56px' }}
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
          // The sign-in modal sits over a bright portal glow, so these rows
          // carry a dark halo to stay readable against it.
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', padding: '2px 0', color: ok ? '#4ade80' : 'rgba(240,230,225,0.92)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
              <CheckIcon ok={ok} />
              <span>{r.label}</span>
            </div>
          )
        })}
      </div>
    )}
  </div>
)

// The gate cookie's mode decides whether this is signup (register) or login
// (session). We don't know the mode in JS (httpOnly), so we show both and let
// the server enforce which one the current gate allows.
//
// Page 2 design: "Continue with Google" is the primary action and the email /
// password form lives behind a secondary toggle. Google auth goes through the
// real <GoogleLogin> component because the backend verifies its idToken; that
// component renders Google's own iframe button, so it is themed through
// Google's props rather than replaced with custom markup.
export default function Enter() {
  const nav = useNavigate()
  const { setUser } = useAuth()
  const [showCreds, setShowCreds] = useState(false)
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [stage, setStage] = useState('form') // 'form' | 'verify' | 'session' | 'forgot'
  const [vcode, setVcode] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onGoogle = async (cred) => {
    setErr('')
    try {
      const data = await api.post('/auth/google', { idToken: cred.credential })
      if (data?.requiresSessionCode) {
        // The daily session code is collected in the credentials panel, so open
        // it — otherwise the prompt would be hidden behind the toggle.
        setForm((p) => ({ ...p, email: data.email || p.email }))
        setShowCreds(true)
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
    <div className="bk-signin-page">
      <div className="bk-signin-modal">
        <h1 className="bk-signin-heading">Sign In</h1>
        <div className="bk-signin-underline" />

        {err && <div className="bk-code-error" style={{ marginBottom: '1.2rem' }}>{err}</div>}

        {/* Primary action: Google's own button, themed to match the pill design */}
        <div className="bk-google-slot">
          <GoogleLogin
            onSuccess={onGoogle}
            onError={() => setErr('Google sign-in failed')}
            theme="outline"
            shape="pill"
            size="large"
            text="continue_with"
            width="300"
            logo_alignment="center"
          />
        </div>

        {/* Secondary option: the email / password, verification and session flows */}
        <div>
          <button
            type="button"
            className="bk-creds-toggle"
            onClick={() => setShowCreds(!showCreds)}
          >
            {showCreds ? 'Hide credentials form' : 'Or use email / password'}
          </button>
        </div>

        {showCreds && (
          <div style={{ marginTop: '1.4rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.2rem', textAlign: 'left' }}>
            {stage === 'session' ? (
              <>
                <p style={{ color: '#fff', fontSize: '0.88rem', margin: '0 0 8px' }}>
                  Enter the daily session code sent to {form.email || 'your email'}:
                </p>
                <input
                  className="bk-code-input"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={8}
                />
                <button type="button" className="bk-code-btn" style={{ width: '100%' }} onClick={doSession} disabled={busy}>
                  {busy ? 'Verifying…' : 'Verify Session'}
                </button>
              </>
            ) : stage === 'verify' ? (
              <>
                <p style={{ color: '#fff', fontSize: '0.88rem', margin: '0 0 8px' }}>
                  Enter the 6-digit code sent to {form.email}:
                </p>
                <input
                  className="bk-code-input"
                  value={vcode}
                  onChange={(e) => setVcode(e.target.value)}
                  placeholder="______"
                />
                <button type="button" className="bk-code-btn" style={{ width: '100%' }} onClick={doVerify} disabled={busy}>
                  {busy ? 'Verifying…' : 'Verify'}
                </button>
              </>
            ) : stage === 'forgot' ? (
              <>
                <input
                  className="bk-code-input"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {msg && <div style={{ color: '#38bdf8', fontSize: '0.85rem', marginBottom: '8px' }}>{msg}</div>}
                <button type="button" className="bk-code-btn" style={{ width: '100%' }} onClick={doForgot} disabled={busy}>
                  {busy ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  className="bk-creds-toggle"
                  style={{ display: 'block', margin: '8px auto 0' }}
                  onClick={() => { setStage('form'); setMsg('') }}
                >
                  Back to Login
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setStage('form'); setErr('') }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: tab === 'login' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Returning
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab('signup'); setStage('form'); setErr('') }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: tab === 'signup' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    First time
                  </button>
                </div>

                {tab === 'signup' && (
                  <input
                    className="bk-code-input"
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                )}
                <input
                  className="bk-code-input"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <PasswordInput
                  className="bk-code-input"
                  value={form.password}
                  onChange={(v) => setForm({ ...form, password: v })}
                  placeholder="Password"
                  show={showPassword}
                  setShow={setShowPassword}
                  required
                  withRules={tab === 'signup'}
                />
                <button
                  type="button"
                  className="bk-code-btn"
                  style={{ width: '100%' }}
                  onClick={tab === 'login' ? doLogin : doSignup}
                  disabled={busy}
                >
                  {busy ? '…' : tab === 'login' ? 'Log in' : 'Create account'}
                </button>
                {tab === 'login' && (
                  <button
                    type="button"
                    className="bk-creds-toggle"
                    style={{ display: 'block', margin: '8px auto 0' }}
                    onClick={() => { setStage('forgot'); setErr('') }}
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
