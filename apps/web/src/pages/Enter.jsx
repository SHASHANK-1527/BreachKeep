import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'

export default function Enter() {
  const nav = useNavigate()
  const { setUser } = useAuth()

  // Page-2 -> Page-3 portal warp (the only place the video plays)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isFlashActive, setIsFlashActive] = useState(false)
  const videoRef = useRef(null)
  const [pendingUser, setPendingUser] = useState(null)

  // Secondary credential form states (retaining backend capability)
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
  const passwordRules = [
    { label: 'At least 8 characters', test: (v) => v.length >= 8 },
    { label: 'At least one number', test: (v) => /[0-9]/.test(v) },
    { label: 'At least one symbol', test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
    { label: 'At least one letter', test: (v) => /[a-zA-Z]/.test(v) },
  ]
  const [passwordStatus, setPasswordStatus] = useState(passwordRules.map(r => ({...r, ok: false})))

  const handlePasswordChange = (val) => {
    setForm({ ...form, password: val })
    if (tab === 'signup') {
      setPasswordStatus(passwordRules.map(r => ({...r, ok: r.test(val)})))
    } else {
      setPasswordStatus([])
    }
  }

  // Page-2 -> Page-3 transition: modal fades, portal vortex fills the
  // screen, white flash, then crossfade into the onboarding scene.
  // NOTE: the session user must NOT be set before the warp — the /enter
  // route guard redirects the moment a user exists, which would unmount
  // this page and cut the video. Session + navigation happen at the end.
  const executePortalTransition = (authUser, targetPath) => {
    // Without a user there is no session cookie, so the 5-second warp would end
    // on a guarded route that immediately bounces back here. That is what made
    // a correct password look like "login does nothing".
    if (!authUser) {
      setErr('Signed in, but the session did not come back. Please try again.')
      return
    }
    setIsTransitioning(true)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }

    // portal.mp4 is 5.0s long. Let the entire video play out fully:
    // Flash triggers near the culmination of the warp (~4.6s)
    setTimeout(() => setIsFlashActive(true), 4600)
    // Seamless crossfade into the destination when the video completes (~5.0s)
    setTimeout(() => {
      try {
        if (authUser) setUser(authUser)
      } catch {}
      nav(targetPath || (authUser?.house ? '/dashboard' : '/onboarding'))
    }, 5000)
  }

  // api.post() resolves to the response BODY. The old code read `res.data.*`,
  // an axios-ism that is always undefined here — so `requiresSessionCode` never
  // fired, the daily-code step never appeared, and the page warped onward with
  // no user. This is the single place that reads an auth response now.
  const handleAuthResponse = (res, targetPath) => {
    if (res?.requiresSessionCode) {
      if (res.email) setForm((f) => ({ ...f, email: res.email }))
      // The code panel lives inside the credentials section, so it has to be
      // open — otherwise a Google sign-in that needs today's code would set the
      // stage and then render nothing at all.
      setShowCreds(true)
      setStage('session')
      setMsg(res.message || 'We emailed you today\u2019s session code. Check your inbox.')
      return
    }
    executePortalTransition(res?.user, targetPath)
  }

  const describeError = (e) => {
    if (e?.status === 0) return 'Could not reach the Keep. Check your connection and try again.'
    if (e?.data?.error === 'gate_required')
      return 'Your access code has expired. Go back and enter today\u2019s code again.'
    return e?.data?.error || e?.message || 'Something went wrong'
  }

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErr('')
      try {
        const res = await api.post('/auth/google', {
          accessToken: tokenResponse.access_token,
        })
        handleAuthResponse(res)
      } catch (e) {
        setIsTransitioning(false)
        setIsFlashActive(false)
        setErr(describeError(e))
      }
    },
    onError: (error) => {
      console.error('Google Sign In Error:', error)
      setErr('Google sign in was cancelled or failed')
    },
  })

  const doLogin = async () => {
    setErr(''); setBusy(true)
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password })
      handleAuthResponse(res)
    } catch (e) {
      setErr(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  const doSignup = async () => {
    setErr(''); setBusy(true)
    try {
      const res = await api.post('/auth/signup', form)
      if (res?.user) {
        handleAuthResponse(res, '/onboarding')
      } else {
        setShowCreds(true)
        setStage('verify')
      }
    } catch (e) {
      setErr(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  const doSession = async () => {
    setErr(''); setBusy(true)
    try {
      const res = await api.post('/auth/verify-session', {
        email: form.email,
        sessionCode: sessionCode.trim().toUpperCase(),
      })
      handleAuthResponse(res)
    } catch (e) {
      setErr(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  const doVerify = async () => {
    setErr(''); setBusy(true)
    try {
      const res = await api.post('/auth/verify', { email: form.email, code: vcode.trim() })
      handleAuthResponse(res, '/onboarding')
    } catch (e) {
      setErr(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  const doForgot = async () => {
    setErr(''); setMsg(''); setBusy(true)
    try {
      await api.post('/auth/forgot-password', { email: form.email })
      setMsg('If that email has an account, a reset link has been sent.')
    } catch (e) {
      setMsg(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  const doResendDaily = async () => {
    setErr(''); setMsg(''); setBusy(true)
    try {
      await api.post('/access/resend-daily', { email: form.email })
      setMsg('If that email has an account, today\u2019s code is on its way.')
    } catch (e) {
      setErr(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bk-signin-page">
      {/* Page-2 -> Page-3 Portal Video Transition (the only one in the app) */}
      <div
        className={`bk-portal-transition-layer ${isTransitioning ? 'active' : ''}`}
        style={{ display: isTransitioning ? 'flex' : 'none' }}
      >
        <video
          ref={videoRef}
          className="bk-portal-video"
          playsInline
          muted
          preload="auto"
          src="/assets/portal.mp4"
        />
      </div>

      {/* Screen-filling Portal Flash Overlay */}
      <div className={`bk-portal-flash-overlay ${isFlashActive ? 'active' : ''}`} />

      {/* Page 2 Specification: Central Modal Container */}
      <div className={`bk-signin-modal ${isTransitioning ? 'bk-fading' : ''}`}>
        <h1 className="bk-signin-heading">Sign In</h1>
        <div className="bk-signin-underline" />

        {err && <div className="bk-code-error" style={{ marginBottom: '1.2rem' }}>{err}</div>}

        {/* Primary Action Button: Pill-shaped with Google Logo */}
        <button
          type="button"
          className="bk-google-btn"
          onClick={() => loginWithGoogle()}
        >
          <svg className="bk-google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue With Google</span>
        </button>

        {/* Secondary option to preserve existing password/session backend logic */}
        <div>
          <button
            type="button"
            className="bk-creds-toggle"
            onClick={() => { if (stage === 'form') setShowCreds(!showCreds) }}
            disabled={stage !== 'form'}
          >
            {stage !== 'form'
              ? 'Finish the step below to continue'
              : showCreds ? 'Hide credentials form' : 'Or use email / password'}
          </button>
        </div>

        {showCreds && (
          <div style={{ marginTop: '1.4rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.2rem', textAlign: 'left' }}>
            {stage === 'session' ? (
              <>
                <p style={{ color: '#fff', fontSize: '0.88rem', margin: '0 0 4px' }}>
                  Enter today&rsquo;s session code:
                </p>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', margin: '0 0 10px' }}>
                  Sent to {form.email || 'your email'} &middot; valid until midnight IST
                </p>
                {msg && <div style={{ color: '#38bdf8', fontSize: '0.82rem', marginBottom: 8 }}>{msg}</div>}
                <input
                  className="bk-code-input"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !busy) doSession() }}
                  placeholder="8-character code"
                  autoFocus
                  autoComplete="one-time-code"
                  maxLength={12}
                />
                <button className="bk-code-btn" style={{ width: '100%' }} onClick={doSession} disabled={busy}>
                  {busy ? 'Verifying\u2026' : 'Verify Session'}
                </button>
                <button
                  type="button"
                  className="bk-creds-toggle"
                  style={{ display: 'block', margin: '8px auto 0' }}
                  onClick={doResendDaily}
                  disabled={busy}
                >
                  Didn&rsquo;t get it? Resend today&rsquo;s code
                </button>
                <button
                  type="button"
                  className="bk-creds-toggle"
                  style={{ display: 'block', margin: '4px auto 0' }}
                  onClick={() => { setStage('form'); setSessionCode(''); setMsg(''); setErr('') }}
                >
                  Back to sign in
                </button>
              </>
            ) : stage === 'verify' ? (
              <>
                <p style={{ color: '#fff', fontSize: '0.88rem', margin: '0 0 4px' }}>
                  Enter your verification code:
                </p>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', margin: '0 0 10px' }}>
                  Sent to {form.email || 'your email'} &middot; expires in 10 minutes
                </p>
                {msg && <div style={{ color: '#38bdf8', fontSize: '0.82rem', marginBottom: 8 }}>{msg}</div>}
                <input
                  className="bk-code-input"
                  value={vcode}
                  onChange={(e) => setVcode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !busy) doVerify() }}
                  placeholder="6-character code"
                  autoFocus
                  autoComplete="one-time-code"
                />
                <button className="bk-code-btn" style={{ width: '100%' }} onClick={doVerify} disabled={busy}>
                  {busy ? 'Verifying\u2026' : 'Verify'}
                </button>
                <button
                  type="button"
                  className="bk-creds-toggle"
                  style={{ display: 'block', margin: '8px auto 0' }}
                  onClick={() => { setStage('form'); setVcode(''); setMsg(''); setErr('') }}
                >
                  Back to sign in
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
                <button className="bk-code-btn" style={{ width: '100%' }} onClick={doForgot} disabled={busy}>
                  {busy ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  className="bk-creds-toggle"
                  style={{ display: 'block', margin: '8px auto 0' }}
                  onClick={() => setStage('form')}
                >
                  Back to Login
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setTab('login')}
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
                    onClick={() => setTab('signup')}
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
                <div style={{ position: 'relative' }}>
                  <input
                    className="bk-code-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={form.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !busy) (tab === 'login' ? doLogin : doSignup)()
                  }}
                />
                {tab === 'signup' && form.password.length > 0 && (
                  <div style={{ marginTop: '8px', textAlign: 'left' }}>
                    {passwordStatus.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: r.ok ? '#22c55e' : '#ff5a1f', marginBottom: '2px' }}>
                        <span>{r.ok ? '✅' : '❌'}</span>
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
                <button

                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button
                  type="button"
                  className="bk-code-btn"
                  style={{ width: '100%' }}
                  onClick={tab === 'login' ? doLogin : doSignup}
                  disabled={busy}
                >
                  {busy ? 'Working\u2026' : tab === 'login' ? 'Log in' : 'Create account'}
                </button>
                {tab === 'login' && (
                  <button
                    type="button"
                    className="bk-creds-toggle"
                    style={{ display: 'block', margin: '8px auto 0' }}
                    onClick={() => setStage('forgot')}
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