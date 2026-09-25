import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import { GateProvider } from './GateContext.jsx'
import Enter from '../pages/Enter.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Onboarding from '../pages/Onboarding.jsx'
import Dungeon from '../pages/Dungeon.jsx'
import Account from '../pages/Account.jsx'
import ResetPassword from '../pages/ResetPassword.jsx'
import AdminPanel from '../pages/admin/AdminPanel.jsx'
import IntroductionModule from '../features/introduction-module/IntroductionModule.jsx'

import { useState, useEffect, useRef } from 'react'
import { api } from './api.js'

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/keep-warden-7f3a9c'

function RequireSession({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="bk-loading">Loading…</div>
  if (!user) return <Navigate to="/enter" replace state={{ from: loc }} />
  return children
}

function Header({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const initial = (user.username || '?')[0].toUpperCase()

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 56,
      background: '#0a0403',
      borderBottom: '1px solid rgba(255,122,0,0.22)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      zIndex: 100,
      color: '#e9d9d1',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontWeight: 600, color: '#ffdca8' }}>
        {user.username} · {user.house || 'unsorted'}
      </div>

      <div style={{ position: 'relative' }} ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'transparent', border: '1px solid rgba(255,122,0,0.22)',
            borderRadius: '999px', padding: '0.2rem 0.7rem 0.2rem 0.2rem',
            cursor: 'pointer', color: '#ffdca8', fontFamily: 'inherit', fontSize: '0.85rem',
          }}
        >
          <span style={{
            width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
            background: 'rgba(255,122,0,0.18)', display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
          }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initial}
          </span>
          <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.username}
          </span>
          <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>▾</span>
        </button>

        {open && (
          <div
            role="menu"
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 210,
              background: '#160806', border: '1px solid rgba(255,122,0,0.22)',
              borderRadius: 10, padding: '0.35rem', boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
              animation: 'none',
            }}
          >
            <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 600, color: '#ffdca8', fontSize: '0.9rem' }}>{user.username}</div>
              <div style={{ color: 'rgba(233,217,209,0.55)', fontSize: '0.75rem', marginTop: 2, wordBreak: 'break-all' }}>{user.email}</div>
              <div style={{ marginTop: 6, display: 'inline-block', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5a1f', border: '1px solid rgba(255,122,0,0.3)', borderRadius: 999, padding: '2px 8px' }}>
                {user.house || 'unsorted'}
              </div>
            </div>

            <Link
              to="/account"
              onClick={() => setOpen(false)}
              role="menuitem"
              style={{ display: 'block', padding: '0.5rem 0.65rem', borderRadius: 6, color: '#e9d9d1', fontSize: '0.87rem', textDecoration: 'none' }}
            >
              Account Settings
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              role="menuitem"
              style={{ display: 'block', padding: '0.5rem 0.65rem', borderRadius: 6, color: '#e9d9d1', fontSize: '0.87rem', textDecoration: 'none' }}
            >
              Dashboard
            </Link>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.35rem 0' }} />

            <button
              onClick={() => { setOpen(false); onLogout() }}
              role="menuitem"
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.65rem', borderRadius: 6, background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.87rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

function AppRoutes() {
  const { user, loading, logout } = useAuth()
  const loc = useLocation()
  const [accessCode, setAccessCode] = useState('')
  const [accessError, setAccessError] = useState('')
  const [hasAccess, setHasAccess] = useState(() => sessionStorage.getItem('bk_has_access') === 'true')

  const handleAccessSubmit = async (e) => {
    e.preventDefault()
    setAccessError('')
    try {
      const data = await api.post('/auth/verify-access-code', { code: accessCode })
      // The admin landing code answers with { redirect }, not { ok, next }.
      if (data?.redirect) {
        window.location.href = data.redirect
        return
      }
      if (data?.ok) {
        setHasAccess(true)
        sessionStorage.setItem('bk_has_access', 'true')
        window.location.href = data.next || '/enter'
        return
      }
      setAccessError('Access Denied')
    } catch (e2) {
      setAccessError(e2.data?.error || 'Invalid access code')
    }
  }

  // The hidden admin path is reached straight from the admin landing code, so it
  // has no student gate cookie and no session. It must not be swallowed by the
  // access-code gate below, and it does its own password auth internally.
  if (loc.pathname === ADMIN_PATH) {
    return (
      <Routes>
        <Route path={ADMIN_PATH} element={<AdminPanel />} />
        <Route path="*" element={<Navigate to={ADMIN_PATH} replace />} />
      </Routes>
    )
  }

  // Show landing only if NOT logged in AND no gate access
  if (!loading && !user && !hasAccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0403', color: '#e9d9d1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
          <form onSubmit={handleAccessSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="text" placeholder="Access Code" value={accessCode} onChange={e => setAccessCode(e.target.value)} style={{ background: '#160806', border: '1px solid rgba(255,122,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '4px', color: '#ffdca8', fontSize: '0.85rem', outline: 'none' }} />
            <button type="submit" style={{ background: '#ff5a1f', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Enter</button>
          </form>
          {accessError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', textAlign: 'right' }}>{accessError}</p>}
        </div>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ fontFamily: "'Cinzel Decorative', serif", color: '#ff5a1f', fontSize: '2.5rem', marginBottom: '1rem', letterSpacing: '0.1em' }}>BreachKeep</h1>
          <p style={{ color: '#e9d9d1', opacity: 0.8, fontSize: '1.1rem', lineHeight: '1.6' }}>Enter the access code in top right corner to access the website and proceed further</p>
        </div>
      </div>
    )
  }

  // If loading, show spinner
  if (loading) {
    return <div className="bk-loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0403', color: '#ff5a1f' }}>Loading…</div>
  }

  // User is logged in OR has gate access - show full app with header
  return (
    <>
      <Header user={user} onLogout={logout} />
      <main style={{ paddingTop: '56px', minHeight: '100vh' }}>
        <Routes>
          <Route path={ADMIN_PATH} element={<AdminPanel />} />
          <Route
            path="/enter"
            element={user ? <Navigate to="/dashboard" replace /> : <Enter />}
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<RequireSession><Onboarding /></RequireSession>} />
          <Route path="/dashboard" element={<RequireSession><Dashboard /></RequireSession>} />
          <Route path="/dashboard/introduction/*" element={<RequireSession><IntroductionModule /></RequireSession>} />
          <Route path="/dungeons/:dungeonId/*" element={<RequireSession><Dungeon /></RequireSession>} />
          <Route path="/account" element={<RequireSession><Account /></RequireSession>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <GateProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </GateProvider>
  )
}