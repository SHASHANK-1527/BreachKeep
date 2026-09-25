import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'

const STYLE = {
  container: { minHeight: '100vh', background: '#0a0403', color: '#e9d9d1', padding: '2rem', fontFamily: 'system-ui, sans-serif' },
  card: { maxWidth: '500px', margin: '0 auto', background: '#160806', border: '1px solid rgba(255,122,0,0.22)', borderRadius: '8px', padding: '2rem' },
  title: { fontFamily: "'Cinzel Decorative', serif", color: '#ff5a1f', fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' },
  label: { display: 'block', marginBottom: '1rem', color: '#ffdca8', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.75rem', background: '#0a0403', border: '1px solid rgba(255,122,0,0.22)', color: '#ffdca8', borderRadius: '4px', fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box' },
  btnPrimary: { width: '100%', padding: '0.75rem', background: '#ff5a1f', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' },
  btnGhost: { width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid rgba(255,122,0,0.3)', borderRadius: '4px', color: '#ff5a1f', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' },
  msg: { marginTop: '1rem', fontSize: '0.85rem', textAlign: 'center' },
  section: { marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,122,0,0.15)' },
  divider: { margin: '1.5rem 0', borderTop: '1px solid rgba(255,122,0,0.15)' },
}

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder, 
  show, 
  setShow, 
  required = false 
}) => (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
    <input
      style={{ ...STYLE.input, flex: 1, paddingRight: '40px' }}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
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
)

export default function Account() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState(user?.username || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const saveName = async () => {
    try {
      const { user: u } = await api.post('/auth/update-username', { username })
      setUser(u)
      setMsg({ text: 'Username saved', type: 'success' })
    } catch (e) {
      setMsg({ text: e.data?.error || 'Failed', type: 'error' })
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) return setMsg({ text: 'Passwords do not match', type: 'error' })
    try {
      await api.post('/auth/update-password', { currentPassword, newPassword })
      setMsg({ text: 'Password updated successfully', type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      setMsg({ text: e.data?.error || 'Failed to change password', type: 'error' })
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div style={STYLE.container}>
      <div style={STYLE.card}>
        <h1 style={STYLE.title}>Account Settings</h1>

        <div style={{ marginBottom: '1rem', color: '#ffdca8', fontSize: '0.9rem' }}>
          <strong>Logged in as:</strong> {user?.username} · {user?.house || 'unsorted'}
        </div>
        <div style={{ marginBottom: '1rem', color: 'rgba(233,217,209,0.6)', fontSize: '0.85rem' }}>
          Email: {user?.email}
        </div>

        <div style={STYLE.divider} />

        <label style={STYLE.label}>Username</label>
        <input
          style={STYLE.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="New username"
        />
        <button style={STYLE.btnPrimary} onClick={saveName}>Save Username</button>

        <div style={STYLE.divider} />

        <label style={STYLE.label}>Change Password</label>
        <form onSubmit={changePassword}>
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Current password"
            show={showCurrentPassword}
            setShow={setShowCurrentPassword}
            required
          />
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            placeholder="New password (8+ chars, number, symbol, letter)"
            show={showNewPassword}
            setShow={setShowNewPassword}
            required
          />
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
            show={showConfirmPassword}
            setShow={setShowConfirmPassword}
            required
          />
          <button type="submit" style={STYLE.btnPrimary}>Update Password</button>
        </form>

        <div style={STYLE.divider} />

        <button style={STYLE.btnGhost} onClick={handleLogout}>Log out</button>

        {msg && (
          <div style={{ ...STYLE.msg, color: msg.type === 'success' ? '#ffdca8' : '#ff5a1f' }}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  )
}