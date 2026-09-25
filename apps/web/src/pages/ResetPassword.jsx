import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../app/api.js'

const STYLE = {
  container: { minHeight: '100vh', background: '#0a0403', color: '#e9d9d1', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' },
  card: { width: 'min(400px, 90vw)', background: '#160806', border: '1px solid rgba(255,122,0,0.22)', borderRadius: '8px', padding: '2rem' },
  title: { fontFamily: "'Cinzel Decorative', serif", color: '#ff5a1f', fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' },
  subtitle: { color: '#ff5a1f', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' },
  input: { width: '100%', padding: '0.75rem', background: '#0a0403', border: '1px solid rgba(255,122,0,0.22)', color: '#ffdca8', borderRadius: '4px', fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '1rem' },
  btnPrimary: { width: '100%', padding: '0.75rem', background: '#ff5a1f', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' },
  msg: { marginTop: '1rem', fontSize: '0.85rem', textAlign: 'center' },
  link: { color: '#ff5a1f', textDecoration: 'underline', cursor: 'pointer' },
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (!token) {
    return (
      <div style={STYLE.container}>
        <div style={STYLE.card}>
          <h2 style={STYLE.title}>Invalid Reset Link</h2>
          <p style={STYLE.subtitle}>This password reset link is invalid or has expired.</p>
          <button style={STYLE.btnPrimary} onClick={() => navigate('/enter')}>Go to Login</button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) return setMsg({ text: 'Passwords do not match', type: 'error' })
    setBusy(true)
    setMsg('')
    try {
      await api.post('/auth/reset-password', { token, newPassword: password })
      setMsg({ text: 'Password reset successful. Redirecting to login...', type: 'success' })
      setTimeout(() => navigate('/enter'), 2000)
    } catch (e) {
      setMsg({ text: e.data?.error || 'Failed to reset password', type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={STYLE.container}>
      <div style={STYLE.card}>
        <h2 style={STYLE.title}>Reset Password</h2>
        <p style={STYLE.subtitle}>Enter your new password below</p>

        <form onSubmit={handleSubmit}>
          <input
            style={STYLE.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (8+ chars, number, symbol, letter)"
            required
          />
          <input
            style={STYLE.input}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
          <button style={STYLE.btnPrimary} type="submit" disabled={busy}>
            {busy ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        {msg && (
          <div style={{ ...STYLE.msg, color: msg.type === 'success' ? '#ffdca8' : '#ff5a1f' }}>
            {msg.text}
          </div>
        )}

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <span style={STYLE.link} onClick={() => navigate('/enter')}>Back to Login</span>
        </div>
      </div>
    </div>
  )
}