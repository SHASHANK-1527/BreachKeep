import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'
import ParticleField from '../sanctum/ParticleField.jsx'

// The gate cookie's mode decides whether this is signup (register) or login (session).
// We don't know the mode in JS (httpOnly), so we try login first; if the server says
// the gate is register-only it 404s and we fall back to the signup form. Simpler:
// we show both, and the server enforces which one the current gate allows.
export default function Enter() {
  const nav = useNavigate()
  const { setUser, refresh } = useAuth()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [stage, setStage] = useState('form') // 'form' | 'verify' | 'session'
  const [vcode, setVcode] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const onGoogle = async (cred) => {
    setErr('')
    try {
      const { user } = await api.post('/auth/google', { idToken: cred.credential })
      setUser(user)
      nav(user.house ? '/dashboard' : '/onboarding')
    } catch (e) { setErr(e.data?.error || 'Google sign-in failed') }
  }

  const doLogin = async () => {
    setErr(''); setBusy(true)
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password })
      const data = res.data || {}
      if (data.requiresSessionCode) {
        setStage('session')
      } else {
        setUser(data.user || res.user)
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
      const res = await api.post('/auth/verify-session', { email: form.email, sessionCode })
      const data = res.data || {}
      setUser(data.user || res.user)
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
        ) : (
          <>
            <div className="sn-tabs">
              <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Returning</button>
              <button className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>First time</button>
            </div>
            {tab === 'signup' && (
              <input className="sn-input" placeholder="username" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            )}
            <input className="sn-input" placeholder="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="sn-input" type="password" placeholder="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {err && <div className="sn-error">{err}</div>}
            <button className="sn-enter-btn" onClick={tab === 'login' ? doLogin : doSignup} disabled={busy}>
              {tab === 'login' ? 'Log in' : 'Create account'}
            </button>
            <div className="sn-or">or</div>
            <div className="sn-google"><GoogleLogin onSuccess={onGoogle} onError={() => setErr('Google sign-in failed')} /></div>
          </>
        )}
      </div>
    </div>
  )
}
