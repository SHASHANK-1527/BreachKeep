import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'

const T = {
  bg: '#0a0403',
  panel: '#160806',
  panel2: '#1c0d09',
  border: 'rgba(255,122,0,0.22)',
  borderSoft: 'rgba(255,122,0,0.12)',
  text: '#e9d9d1',
  dim: 'rgba(233,217,209,0.55)',
  accent: '#ff5a1f',
  cream: '#ffdca8',
  green: '#22c55e',
  red: '#ef4444',
  gold: '#e0a800',
}

const s = {
  shell: { minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex' },
  side: {
    width: 220, flexShrink: 0, background: T.panel, borderRight: `1px solid ${T.borderSoft}`,
    padding: '1.25rem 0.75rem', position: 'sticky', top: 0, height: '100vh',
  },
  sideTitle: { fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.dim, padding: '0 0.75rem', marginBottom: '0.5rem', fontWeight: 700 },
  tab: {
    display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.55rem 0.75rem',
    background: 'transparent', border: 'none', color: T.text, textAlign: 'left', cursor: 'pointer',
    borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, marginBottom: 2, transition: 'all 160ms ease',
  },
  tabActive: { background: 'rgba(255,122,0,0.12)', color: T.accent },
  main: { flex: 1, padding: '2rem 2.25rem 7rem', maxWidth: 760, minWidth: 0 },
  h1: { fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.25rem', color: T.text },
  sub: { color: T.dim, fontSize: '0.88rem', margin: '0 0 1.75rem' },
  card: { background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' },
  cardTitle: { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.accent, fontWeight: 700, marginBottom: '1rem' },
  row: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' },
  rowFirst: { borderTop: 'none' },
  rowLabel: { flex: 1, minWidth: 0 },
  rowLabelKey: { fontSize: '0.72rem', color: T.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  rowLabelVal: { fontSize: '0.95rem', color: T.cream, marginTop: 2, wordBreak: 'break-all' },
  input: {
    width: '100%', padding: '0.6rem 0.7rem', background: T.bg, border: `1px solid ${T.border}`,
    color: T.cream, borderRadius: 8, fontFamily: 'inherit', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box',
  },
  btn: {
    padding: '0.5rem 0.95rem', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.85rem', fontFamily: 'inherit', transition: 'filter 150ms ease',
  },
  btnGhost: { background: 'transparent', border: `1px solid ${T.border}`, color: T.accent },
  btnGreen: { background: T.green, color: '#fff' },
  btnRed: { background: T.red, color: '#fff' },
  link: { background: 'none', border: 'none', color: T.accent, cursor: 'pointer', fontSize: '0.85rem', padding: 0, textDecoration: 'underline' },
  bar: {
    position: 'fixed', left: 220, right: 0, bottom: 0, background: T.panel2,
    borderTop: `1px solid ${T.accent}`, padding: '0.85rem 1.5rem', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', gap: '1rem', zIndex: 60,
    transform: 'translateY(0)', transition: 'transform 220ms cubic-bezier(0.2,0.8,0.3,1)',
    boxShadow: '0 -8px 24px rgba(0,0,0,0.45)',
  },
  barHidden: { transform: 'translateY(110%)' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', padding: '2px 0' },
}

const PASSWORD_RULES = [
  { id: 'len', label: '8-20 characters long', test: (v) => v.length >= 8 && v.length <= 20 },
  { id: 'upper', label: 'At least 1 uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'num', label: 'At least 1 number', test: (v) => /[0-9]/.test(v) },
  { id: 'sym', label: 'At least 1 special character', test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
  { id: 'nospace', label: 'No spaces allowed', test: (v) => v.length > 0 && !/\s/.test(v) },
]

function Icon({ name, size = 16, color = T.dim }) {
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

function Field({ label, value, editable, onStartEdit, onChange, onSave, onCancel, type = 'text', readOnly }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  if (editable) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
        <input
          autoFocus value={draft} type={type} disabled={readOnly}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(draft); if (e.key === 'Escape') onCancel() }}
          style={s.input}
        />
        <button style={{ ...s.btn, ...s.btnGreen }} onClick={() => onSave(draft)}>Save</button>
        <button style={{ ...s.btn, ...s.btnGhost }} onClick={onCancel}>Cancel</button>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
      <div style={{ ...s.rowLabelVal, flex: 1, minWidth: 0, color: readOnly ? T.dim : T.cream }}>{value}</div>
      {!readOnly && (
        <button style={{ ...s.btn, ...s.btnGhost, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} onClick={onStartEdit}>
          <Icon name="pencil" size={13} color={T.accent} /> Edit
        </button>
      )}
    </div>
  )
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

  // ---- My Account actions ----
  const saveAccount = async () => {
    if (name !== (user?.username || '')) {
      try {
        const res = await api.post('/auth/update-username', { username: name })
        setUser(res.user)
        flash('Display name updated')
      } catch (e) { flash(e.data?.error || 'Could not update name', 'err'); return }
    }
    if (avatar !== (user?.avatar || null)) {
      try {
        const res = await api.post('/auth/update-avatar', { avatar })
        setUser(res.user)
        flash('Avatar updated')
      } catch (e) { flash(e.data?.error || 'Could not update avatar', 'err'); return }
    }
    flash('All changes saved')
  }

  const resetAll = () => {
    setName(user?.username || '')
    setAvatar(user?.avatar || null)
    setEditing(null)
    setCur(''); setNext(''); setConfirm('')
    setSecMsg(null)
  }

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 512) return flash('Image too large (max 512KB)', 'err')
    const reader = new FileReader()
    reader.onload = () => { setAvatar(reader.result); flash('Avatar ready — save to apply') }
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
      setCur(''); setNext(''); setConfirm('')
      setSecMsg({ t: 'Password updated successfully', k: 'ok' })
    } catch (err) {
      setSecMsg({ t: err.data?.error || 'Could not update password', k: 'err' })
    } finally { setBusy(false) }
  }

  const sendReset = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail })
      setSecMsg({ t: 'If that email has an account, a reset link has been sent.', k: 'ok' })
      setForgotOpen(false); setForgotEmail('')
    } catch (err) {
      setSecMsg({ t: err.data?.error || 'Request failed', k: 'err' })
    } finally { setBusy(false) }
  }

  const doLogout = async () => { await logout(); sessionStorage.removeItem('bk_has_access'); nav('/') }
  const doDelete = async () => {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return
    try {
      await api.post('/auth/delete-account')
      sessionStorage.removeItem('bk_has_access')
      nav('/')
    } catch (e) { flash(e.data?.error || 'Delete failed', 'err') }
  }

  const PasswordField = ({ label, value, setValue, vis, setVis, placeholder, autoComplete }) => (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.72rem', color: T.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</span>
        <button type="button" style={{ ...s.btn, background: 'none', border: 'none', color: T.dim, padding: 2 }} onClick={() => setVis(!vis)} aria-label={vis ? 'Hide' : 'Show'}>
          <Icon name={vis ? 'eyeOff' : 'eye'} size={16} color={vis ? T.accent : T.dim} />
        </button>
      </div>
      <input
        style={s.input} type={vis ? 'text' : 'password'} value={value} placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )

  return (
    <div style={s.shell}>
      <aside style={s.side}>
        <div style={s.sideTitle}>Settings</div>
        <button style={{ ...s.tab, ...(tab === 'account' ? s.tabActive : {}) }} onClick={() => setTab('account')}>
          <Icon name="user" size={16} color={tab === 'account' ? T.accent : T.dim} /> My Account
        </button>
        <button style={{ ...s.tab, ...(tab === 'security' ? s.tabActive : {}) }} onClick={() => setTab('security')}>
          <Icon name="shield" size={16} color={tab === 'security' ? T.accent : T.dim} /> Security
        </button>
      </aside>

      <main style={s.main}>
        {tab === 'account' ? (
          <>
            <h1 style={s.h1}>My Account</h1>
            <p style={s.sub}>Manage your profile and account details.</p>

            <section style={s.card}>
              <div style={s.cardTitle}>Avatar</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', position: 'relative',
                    background: T.panel2, border: `1px solid ${T.border}`, display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}
                >
                  {avatar
                    ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.8rem', fontWeight: 700, color: T.accent }}>{(user?.username || '?')[0]?.toUpperCase()}</span>}
                  <div
                    style={{
                      position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                      background: 'rgba(10,4,3,0.82)', opacity: 0, transition: 'opacity 160ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    <Icon name="camera" size={22} color={T.accent} />
                  </div>
                </div>
                <div>
                  <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => fileRef.current?.click()}>Change picture</button>
                  <p style={{ color: T.dim, fontSize: '0.75rem', margin: '0.5rem 0 0' }}>PNG or JPG, max 512KB.</p>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} style={{ display: 'none' }} />
                </div>
              </div>
            </section>

            <section style={s.card}>
              <div style={s.cardTitle}>Account Details</div>
              <div style={{ ...s.row, ...s.rowFirst }}>
                <div style={s.rowLabel}>
                  <div style={s.rowLabelKey}>Display Name</div>
                  <Field
                    label="Display Name" value={name} editable={editing === 'name'}
                    onStartEdit={() => setEditing('name')} onCancel={() => { setName(user?.username || ''); setEditing(null) }}
                    onSave={(v) => { setName(v); setEditing(null) }}
                  />
                </div>
              </div>
              <div style={s.row}>
                <div style={s.rowLabel}>
                  <div style={s.rowLabelKey}>Email</div>
                  <Field label="Email" value={user?.email || ''} readOnly />
                  <p style={{ color: T.dim, fontSize: '0.72rem', margin: '0.35rem 0 0' }}>Email changes require re-verification and are disabled in this build.</p>
                </div>
              </div>
            </section>

            <section style={s.card}>
              <div style={s.cardTitle}>Account Actions</div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button style={{ ...s.btn, ...s.btnGhost }} onClick={doLogout}>Log Out</button>
                <button style={{ ...s.btn, ...s.btnRed }} onClick={doDelete}>Delete Account</button>
              </div>
            </section>
          </>
        ) : (
          <>
            <h1 style={s.h1}>Security</h1>
            <p style={s.sub}>Change your password and keep your account safe.</p>

            <section style={s.card}>
              <div style={s.cardTitle}>Change Password</div>
              <form onSubmit={savePassword}>
                <PasswordField label="Current Password" value={cur} setValue={setCur} vis={show.cur} setVis={(v) => setShow({ ...show, cur: v })} placeholder="••••••••" autoComplete="current-password" />
                <PasswordField label="New Password" value={next} setValue={setNext} vis={show.next} setVis={(v) => setShow({ ...show, next: v })} placeholder="••••••••" autoComplete="new-password" />

                {next.length > 0 && (
                  <div style={{ margin: '-0.4rem 0 0.9rem' }}>
                    {rules.map((r) => (
                      <div key={r.id} style={{ ...s.checkRow, color: r.ok ? T.green : T.dim }}>
                        <span style={{ width: 14, height: 14, display: 'grid', placeItems: 'center', borderRadius: '50%', background: r.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)' }}>
                          <Icon name={r.ok ? 'check' : 'x'} size={9} color={r.ok ? T.green : T.red} />
                        </span>
                        <span style={{ textDecoration: r.ok ? 'none' : 'none', opacity: r.ok ? 1 : 0.75 }}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <PasswordField label="Confirm New Password" value={confirm} setValue={setConfirm} vis={show.confirm} setVis={(v) => setShow({ ...show, confirm: v })} placeholder="••••••••" autoComplete="new-password" />

                {confirm.length > 0 && next !== confirm && (
                  <div style={{ ...s.checkRow, color: T.red, marginTop: '-0.4rem', marginBottom: '0.9rem' }}>
                    <span style={{ width: 14, height: 14, display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'rgba(239,68,68,0.12)' }}>
                      <Icon name="x" size={9} color={T.red} />
                    </span>
                    <span>Passwords do not match</span>
                  </div>
                )}

                {secMsg && (
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.9rem', color: secMsg.k === 'ok' ? T.green : T.red }}>{secMsg.t}</div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button type="submit" disabled={!pwReady || busy} style={{ ...s.btn, ...s.btnGreen, opacity: pwReady ? 1 : 0.45, cursor: pwReady ? 'pointer' : 'not-allowed' }}>
                    {busy ? 'Updating…' : 'Update Password'}
                  </button>
                  <button type="button" style={s.link} onClick={() => setForgotOpen((v) => !v)}>Forgot password?</button>
                </div>
              </form>

              {forgotOpen && (
                <form onSubmit={sendReset} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${T.borderSoft}` }}>
                  <div style={{ fontSize: '0.8rem', color: T.dim, marginBottom: '0.6rem' }}>
                    Enter your email and we'll send a reset link valid for 1 hour.
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input style={s.input} type="email" value={forgotEmail} placeholder="you@example.com" onChange={(e) => setForgotEmail(e.target.value)} />
                    <button type="submit" disabled={busy || !forgotEmail} style={{ ...s.btn, ...s.btnGhost }}>Send link</button>
                  </div>
                </form>
              )}
            </section>
          </>
        )}
      </main>

      {toast && (
        <div
          style={{
            position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 80,
            background: T.panel2, border: `1px solid ${toast.kind === 'err' ? T.red : T.green}`, color: toast.kind === 'err' ? T.red : T.cream,
            padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.85rem', boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
          }}
        >
          {toast.text}
        </div>
      )}

      <div style={{ ...s.bar, ...(dirty ? {} : s.barHidden) }}>
        <span style={{ fontSize: '0.9rem', color: T.gold, fontWeight: 600 }}>Careful — you have unsaved changes!</span>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button style={{ ...s.btn, ...s.btnGhost }} onClick={resetAll}>Reset</button>
          {tab === 'account' ? (
            <button style={{ ...s.btn, ...s.btnGreen }} onClick={saveAccount} disabled={!accountDirty}>Save Changes</button>
          ) : (
            <button style={{ ...s.btn, ...s.btnGreen }} onClick={savePassword} disabled={!pwReady}>Save Changes</button>
          )}
        </div>
      </div>
    </div>
  )
}
