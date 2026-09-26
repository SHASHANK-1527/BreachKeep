import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'

const PASSWORD_RULES = [
  { id: 'len', label: '8-20 characters long', test: (v) => v.length >= 8 && v.length <= 20 },
  { id: 'upper', label: 'At least 1 uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'num', label: 'At least 1 number', test: (v) => /[0-9]/.test(v) },
  { id: 'sym', label: 'At least 1 special character', test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
  { id: 'nospace', label: 'No spaces allowed', test: (v) => v.length > 0 && !/\s/.test(v) },
]

function Icon({ name, size = 16, color = '#334155' }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  }
  const paths = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    eye: <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M1 1l22 22" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /></>,
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
    pencil: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  }
  return <svg {...p}>{paths[name]}</svg>
}

export default function Account() {
  const { user, setUser, logout } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('account')

  const [name, setName] = useState(user?.username || '')
  const [editing, setEditing] = useState(null)
  const [avatar, setAvatar] = useState(user?.avatar || null)
  const fileRef = useRef(null)
  const [toast, setToast] = useState(null)

  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState({ cur: false, next: false, confirm: false })
  const [secMsg, setSecMsg] = useState(null)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const rules = useMemo(() => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(next) })), [next])
  const pwReady = cur.length > 0 && next.length > 0 && confirm.length > 0 && rules.every((r) => r.ok) && next === confirm

  const accountDirty = name !== (user?.username || '') || avatar !== (user?.avatar || null)
  const securityDirty = cur.length > 0 || next.length > 0 || confirm.length > 0
  const dirty = accountDirty || securityDirty

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const flash = (text, kind = 'ok') => setToast({ text, kind })

  const saveAccount = async () => {
    if (name !== (user?.username || '')) {
      try {
        const res = await api.post('/auth/update-username', { username: name })
        setUser(res.user)
        flash('Display name updated')
      } catch (e) {
        flash(e.data?.error || 'Could not update name', 'err')
        return
      }
    }
    if (avatar !== (user?.avatar || null)) {
      try {
        const res = await api.post('/auth/update-avatar', { avatar })
        setUser(res.user)
        flash('Avatar updated')
      } catch (e) {
        flash(e.data?.error || 'Could not update avatar', 'err')
        return
      }
    }
    flash('All changes saved')
  }

  const resetAll = () => {
    setName(user?.username || '')
    setAvatar(user?.avatar || null)
    setEditing(null)
    setCur('')
    setNext('')
    setConfirm('')
    setSecMsg(null)
  }

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 512) return flash('Image too large (max 512KB)', 'err')
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result)
      flash('Avatar ready — save to apply')
    }
    reader.readAsDataURL(file)
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setSecMsg(null)
    if (!rules.every((r) => r.ok)) return setSecMsg({ t: 'Password does not meet all rules', k: 'err' })
    if (next !== confirm) return setSecMsg({ t: 'New passwords do not match', k: 'err' })
    setBusy(true)
    try {
      await api.post('/auth/update-password', { currentPassword: cur, newPassword: next })
      setCur('')
      setNext('')
      setConfirm('')
      setSecMsg({ t: 'Password updated successfully', k: 'ok' })
    } catch (err) {
      setSecMsg({ t: err.data?.error || 'Could not update password', k: 'err' })
    } finally {
      setBusy(false)
    }
  }

  const sendReset = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail })
      setSecMsg({ t: 'If that email has an account, a reset link has been sent.', k: 'ok' })
      setForgotOpen(false)
      setForgotEmail('')
    } catch (err) {
      setSecMsg({ t: err.data?.error || 'Request failed', k: 'err' })
    } finally {
      setBusy(false)
    }
  }

  const doLogout = async () => {
    await logout()
    sessionStorage.removeItem('bk_has_access')
    nav('/')
  }

  const doDelete = async () => {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return
    try {
      await api.post('/auth/delete-account')
      sessionStorage.removeItem('bk_has_access')
      nav('/')
    } catch (e) {
      flash(e.data?.error || 'Delete failed', 'err')
    }
  }

  return (
    <div
      className="bk-code-page"
      style={{
        minHeight: '100vh',
        width: '100%',
        padding: '85px 1rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {/* Central Glassmorphic Card (Page 1 Specification) */}
      <div
        className="bk-code-modal"
        style={{
          width: 'min(92vw, 560px)',
          maxWidth: '560px',
          padding: '2.5rem 2.2rem 2.2rem',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        {/* Header & Underline */}
        <div style={{ textAlign: 'center' }}>
          <h1 className="bk-code-heading">{tab === 'account' ? 'My Account' : 'Security'}</h1>
          <div className="bk-code-underline" />
        </div>

        {/* Tab switcher styled with Page 1 glass/pill aesthetic */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1.8rem',
            background: 'rgba(15, 22, 38, 0.12)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('account')}
            style={{
              flex: 1,
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              border: tab === 'account' ? '1px solid rgba(0, 0, 0, 0.35)' : '1px solid transparent',
              background: tab === 'account' ? '#dedfe3' : 'transparent',
              color: '#0f172a',
              fontWeight: tab === 'account' ? 600 : 500,
              fontSize: '0.9rem',
              fontFamily: 'var(--font-inter)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.18s ease',
              boxShadow: tab === 'account' ? '0 2px 5px rgba(0, 0, 0, 0.12)' : 'none',
            }}
          >
            <Icon name="user" size={15} color="#0f172a" />
            My Account
          </button>
          <button
            type="button"
            onClick={() => setTab('security')}
            style={{
              flex: 1,
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              border: tab === 'security' ? '1px solid rgba(0, 0, 0, 0.35)' : '1px solid transparent',
              background: tab === 'security' ? '#dedfe3' : 'transparent',
              color: '#0f172a',
              fontWeight: tab === 'security' ? 600 : 500,
              fontSize: '0.9rem',
              fontFamily: 'var(--font-inter)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.18s ease',
              boxShadow: tab === 'security' ? '0 2px 5px rgba(0, 0, 0, 0.12)' : 'none',
            }}
          >
            <Icon name="shield" size={15} color="#0f172a" />
            Security
          </button>
        </div>

        {tab === 'account' ? (
          <>
            {/* Avatar section */}
            <div style={{ marginBottom: '1.8rem', paddingBottom: '1.4rem', borderBottom: '1px solid rgba(15, 22, 38, 0.12)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem' }}>
                Avatar
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  title="Click to change picture"
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    background: '#d8dde3',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(7, 18, 38, 0.15)',
                  }}
                >
                  {avatar ? (
                    <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f1626' }}>
                      {(user?.username || '?')[0]?.toUpperCase()}
                    </span>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(15, 22, 38, 0.65)',
                      opacity: 0,
                      transition: 'opacity 160ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    <Icon name="camera" size={22} color="#ffffff" />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    className="bk-code-btn"
                    style={{ padding: '0.45rem 1.2rem', fontSize: '0.88rem' }}
                    onClick={() => fileRef.current?.click()}
                  >
                    Change picture
                  </button>
                  <p style={{ color: '#475569', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>PNG or JPG, max 512KB.</p>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} style={{ display: 'none' }} />
                </div>
              </div>
            </div>

            {/* Account details */}
            <div style={{ marginBottom: '1.8rem', paddingBottom: '1.4rem', borderBottom: '1px solid rgba(15, 22, 38, 0.12)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem' }}>
                Account Details
              </div>

              {/* Display Name */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Display Name
                </div>
                {editing === 'name' ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      autoFocus
                      className="bk-code-input"
                      style={{ marginBottom: 0, padding: '0.65rem 0.9rem', fontSize: '0.95rem' }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveAccount()
                          setEditing(null)
                        }
                        if (e.key === 'Escape') {
                          setName(user?.username || '')
                          setEditing(null)
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="bk-code-btn"
                      style={{ padding: '0.65rem 1.1rem', fontSize: '0.88rem', background: '#22c55e', color: '#fff', borderColor: '#16a34a' }}
                      onClick={() => {
                        saveAccount()
                        setEditing(null)
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="bk-code-btn"
                      style={{ padding: '0.65rem 0.9rem', fontSize: '0.88rem' }}
                      onClick={() => {
                        setName(user?.username || '')
                        setEditing(null)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#d8dde3',
                      padding: '0.7rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <span style={{ fontSize: '0.98rem', fontWeight: 600, color: '#0f172a' }}>{name}</span>
                    <button
                      type="button"
                      className="bk-code-btn"
                      style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => setEditing('name')}
                    >
                      <Icon name="pencil" size={12} color="#0f172a" />
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Email
                </div>
                <div
                  style={{
                    background: 'rgba(216, 221, 227, 0.65)',
                    padding: '0.7rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    color: '#475569',
                    fontSize: '0.92rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {user?.email || 'No email attached'}
                </div>
                <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '0.3rem 0 0' }}>
                  Email changes are disabled in this build.
                </p>
              </div>

              {/* House */}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Assigned House
                </div>
                <div
                  style={{
                    background: 'rgba(216, 221, 227, 0.65)',
                    padding: '0.7rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    letterSpacing: '0.04em',
                  }}
                >
                  {user?.house ? user.house.toUpperCase() : 'UNSORTED'}
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem' }}>
                Account Actions
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="bk-code-btn"
                  style={{ padding: '0.55rem 1.4rem' }}
                  onClick={doLogout}
                >
                  Log Out
                </button>
                <button
                  type="button"
                  onClick={doDelete}
                  style={{
                    background: '#fee2e2',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    borderRadius: '8px',
                    padding: '0.55rem 1.4rem',
                    color: '#dc2626',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Security tab: Password change */}
            <form onSubmit={savePassword}>
              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    Current Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShow({ ...show, cur: !show.cur })}
                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Icon name={show.cur ? 'eyeOff' : 'eye'} size={14} color="#475569" />
                    {show.cur ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  className="bk-code-input"
                  type={show.cur ? 'text' : 'password'}
                  value={cur}
                  onChange={(e) => setCur(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    New Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShow({ ...show, next: !show.next })}
                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Icon name={show.next ? 'eyeOff' : 'eye'} size={14} color="#475569" />
                    {show.next ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  className="bk-code-input"
                  type={show.next ? 'text' : 'password'}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ marginBottom: '0.5rem' }}
                />

                {next.length > 0 && (
                  <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(216, 221, 227, 0.65)', borderRadius: '10px', marginBottom: '0.5rem' }}>
                    {rules.map((r) => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: r.ok ? '#15803d' : '#64748b', padding: '2px 0' }}>
                        <span style={{ width: 14, height: 14, display: 'grid', placeItems: 'center', borderRadius: '50%', background: r.ok ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.15)' }}>
                          <Icon name={r.ok ? 'check' : 'x'} size={9} color={r.ok ? '#16a34a' : '#ef4444'} />
                        </span>
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    Confirm New Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShow({ ...show, confirm: !show.confirm })}
                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Icon name={show.confirm ? 'eyeOff' : 'eye'} size={14} color="#475569" />
                    {show.confirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  className="bk-code-input"
                  type={show.confirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ marginBottom: 0 }}
                />
                {confirm.length > 0 && next !== confirm && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: 500 }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              {secMsg && (
                <div
                  className={secMsg.k === 'err' ? 'bk-code-error' : ''}
                  style={
                    secMsg.k === 'ok'
                      ? {
                          color: '#15803d',
                          background: 'rgba(220, 252, 231, 0.85)',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          borderRadius: '8px',
                          padding: '0.5rem 0.8rem',
                          fontSize: '0.88rem',
                          marginBottom: '1rem',
                        }
                      : {}
                  }
                >
                  {secMsg.t}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="bk-code-btn"
                  disabled={!pwReady || busy}
                  style={{ minWidth: 150 }}
                >
                  {busy ? 'Updating…' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotOpen(!forgotOpen)}
                  style={{ background: 'none', border: 'none', color: '#0f172a', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'var(--font-inter)' }}
                >
                  Forgot password?
                </button>
              </div>
            </form>

            {/* Forgot password inline form */}
            {forgotOpen && (
              <form onSubmit={sendReset} style={{ marginTop: '1.4rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(15, 22, 38, 0.12)' }}>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.6rem' }}>
                  Enter your email and we'll send a reset link:
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <input
                    className="bk-code-input"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ marginBottom: 0 }}
                  />
                  <button
                    type="submit"
                    className="bk-code-btn"
                    disabled={busy || !forgotEmail}
                    style={{ padding: '0.6rem 1.4rem', whiteSpace: 'nowrap' }}
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            border: `1.5px solid ${toast.kind === 'err' ? '#ef4444' : '#22c55e'}`,
            color: toast.kind === 'err' ? '#dc2626' : '#15803d',
            padding: '0.65rem 1.4rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 500,
            boxShadow: '0 12px 30px rgba(7, 18, 38, 0.25)',
            animation: 'bk-fadeIn 0.25s ease both',
          }}
        >
          {toast.text}
        </div>
      )}

      {/* Floating Unsaved Changes Bar */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 24,
          transform: dirty ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(140%)',
          transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 90,
          width: 'min(90vw, 520px)',
          background: 'rgba(222, 230, 240, 0.95)',
          backdropFilter: 'blur(14px)',
          border: '1.5px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '16px',
          padding: '0.8rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 16px 40px rgba(7, 18, 38, 0.35)',
        }}
      >
        <span style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 600 }}>
          Unsaved changes!
        </span>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            className="bk-code-btn"
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            onClick={resetAll}
          >
            Reset
          </button>
          {tab === 'account' ? (
            <button
              type="button"
              className="bk-code-btn"
              style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', background: '#22c55e', color: '#fff', borderColor: '#16a34a' }}
              onClick={saveAccount}
              disabled={!accountDirty}
            >
              Save Changes
            </button>
          ) : (
            <button
              type="button"
              className="bk-code-btn"
              style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', background: '#22c55e', color: '#fff', borderColor: '#16a34a' }}
              onClick={savePassword}
              disabled={!pwReady}
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
