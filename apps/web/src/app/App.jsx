import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import { GateProvider } from './GateContext.jsx'
import { CastleProvider } from './CastleContext.jsx'
import Enter from '../pages/Enter.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Onboarding from '../pages/Onboarding.jsx'
import Dungeon from '../pages/Dungeon.jsx'
import Account from '../pages/Account.jsx'
import ResetPassword from '../pages/ResetPassword.jsx'
import AdminPanel from '../pages/admin/AdminPanel.jsx'
import IntroductionModule from '../features/introduction-module/IntroductionModule.jsx'
import CodeEntryView from '../components/CodeEntryView.jsx'
import Maintenance from '../pages/Maintenance.jsx'
import TestPanel from '../components/TestPanel.jsx'
import PageTransition from '../components/PageTransition.jsx'
import useMaintenance from './useMaintenance.js'

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
  const loc = useLocation()
  const isAccount = loc.pathname === '/account'

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

  if (isAccount) {
    return (
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 58,
        background: 'rgba(165, 195, 225, 0.22)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1.5px solid rgba(255, 255, 255, 0.38)',
        boxShadow: '0 8px 30px rgba(7, 18, 38, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 100,
        color: '#0f172a',
        fontFamily: 'var(--font-inter)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/dashboard"
            className="bk-code-btn"
            style={{
              padding: '0.4rem 1.1rem',
              fontSize: '0.85rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 500,
            }}
          >
            ← Dashboard
          </Link>
          <span style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#0f1626',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-cinzel)',
          }}>
            {user.username} · {user.house ? user.house.toUpperCase() : 'UNSORTED'}
          </span>
        </div>

        <div style={{ position: 'relative' }} ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Account menu"
            className="bk-code-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.25rem 0.85rem 0.25rem 0.35rem',
              borderRadius: '999px',
              fontSize: '0.88rem',
            }}
          >
            <span style={{
              width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
              background: '#cbd5e1', display: 'grid', placeItems: 'center',
              fontWeight: 700, fontSize: '0.85rem', color: '#0f1626', flexShrink: 0,
            }}>
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initial}
            </span>
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.username}
            </span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▾</span>
          </button>

          {open && (
            <div
              role="menu"
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 220,
                background: 'rgba(225, 235, 245, 0.96)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255, 255, 255, 0.6)',
                borderRadius: 14, padding: '0.45rem',
                boxShadow: '0 16px 40px rgba(7, 18, 38, 0.3)',
                animation: 'none',
                color: '#0f172a',
              }}
            >
              <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(15, 22, 38, 0.1)' }}>
                <div style={{ fontWeight: 600, color: '#0f1626', fontSize: '0.92rem' }}>{user.username}</div>
                <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: 2, wordBreak: 'break-all' }}>{user.email}</div>
                <div style={{
                  marginTop: 6, display: 'inline-block', fontSize: '0.68rem', letterSpacing: '0.08em',
                  textTransform: 'uppercase', fontWeight: 600, color: '#0f1626',
                  background: 'rgba(15, 22, 38, 0.08)', border: '1px solid rgba(15, 22, 38, 0.15)',
                  borderRadius: 999, padding: '2px 8px',
                }}>
                  {user.house || 'unsorted'}
                </div>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                role="menuitem"
                style={{
                  display: 'block', padding: '0.55rem 0.75rem', borderRadius: 8,
                  color: '#0f172a', fontSize: '0.88rem', textDecoration: 'none', fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(15, 22, 38, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Dashboard
              </Link>
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                role="menuitem"
                style={{
                  display: 'block', padding: '0.55rem 0.75rem', borderRadius: 8,
                  color: '#0f172a', fontSize: '0.88rem', textDecoration: 'none', fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(15, 22, 38, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Account Settings
              </Link>

              <div style={{ height: 1, background: 'rgba(15, 22, 38, 0.1)', margin: '0.35rem 0' }} />

              <button
                onClick={() => { setOpen(false); onLogout() }}
                role="menuitem"
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.55rem 0.75rem', borderRadius: 8,
                  background: 'transparent', border: 'none', color: '#dc2626',
                  fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
    )
  }

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 56,
      background: 'rgba(8, 14, 28, 0.96)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      zIndex: 100,
      color: '#ffdca8',
      fontFamily: "var(--font-cinzel), 'Cinzel', serif",
      letterSpacing: '0.05em',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ fontWeight: 600, color: '#ffdca8', fontSize: '0.98rem', textShadow: '0 0 10px rgba(212,175,55,0.25)' }}>
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
            background: 'rgba(18, 28, 56, 0.65)', border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: '999px', padding: '0.2rem 0.75rem 0.2rem 0.25rem',
            cursor: 'pointer', color: '#ffdca8', fontFamily: 'inherit', fontSize: '0.85rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{
            width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
            background: 'rgba(212, 175, 55, 0.18)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, color: '#ffdca8',
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
  const [hasAccess, setHasAccess] = useState(() => sessionStorage.getItem('bk_has_access') === 'true')

  // The kill switch. Skipped on the admin route so the Warden can always get in
  // and turn the site back on.
  const isAdminRoute = loc.pathname === ADMIN_PATH
  const maint = useMaintenance(isAdminRoute)

  // The hidden admin path is reached straight from the admin landing code, so it
  // has no student gate cookie and no session. It must not be swallowed by the
  // access-code gate below, and it does its own password auth internally.
  if (isAdminRoute) {
    return (
      <Routes>
        <Route path={ADMIN_PATH} element={<AdminPanel />} />
        <Route path="*" element={<Navigate to={ADMIN_PATH} replace />} />
      </Routes>
    )
  }

  // Site closed by the Warden — non-testers see the maintenance page.
  // We allow reaching /enter so authorized accounts with testing rights can sign in!
  const cleanPath = loc.pathname.replace(/\/+$/, '') || '/'
  const isAuthRoute = cleanPath === '/enter' || cleanPath === '/reset-password'
  const isTester = user?.testingRights || user?.role === 'admin' || maint.isTester
  if (maint.maintenance && !isTester && !isAuthRoute) {
    return <Maintenance message={maint.message} eta={maint.eta} />
  }

  // Show landing only if NOT logged in AND no gate access
  if (!loading && !user && !hasAccess) {
    return (
      <PageTransition>
        <CodeEntryView
          onSuccess={() => {
            setHasAccess(true)
            sessionStorage.setItem('bk_has_access', 'true')
          }}
        />
      </PageTransition>
    )
  }

  // If loading, show spinner
  if (loading) {
    return <div className="bk-loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0403', color: '#ff5a1f' }}>Loading…</div>
  }

  // Pages that render their own full-screen scene and chrome (ornate banner +
  // the gold avatar medallion). The fixed header would stack on top of them.
  // The individual introduction rooms are ordinary panels, not scenes, so they
  // keep the header — it is their only route to logout and account settings.
  // Dungeon pages are scenes too: they draw the house hall behind the rooms and
  // carry their own "back to the hall" control and profile medallion.
  const isAtmosphericPage = [
    '/enter',
    '/onboarding',
    '/dashboard',
    '/dashboard/introduction',
  ].includes(cleanPath) || cleanPath.startsWith('/dungeons/')

  // User is logged in OR has gate access - show full app with header
  return (
    <>
      {(maint.siteMaintenance || maint.maintenance) && isTester && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 9999,
          background: 'linear-gradient(90deg, #7f1d1d, #991b1b)',
          color: '#fef2f2', padding: '0.4rem 1rem', fontSize: '0.78rem',
          textAlign: 'center', fontWeight: 600, letterSpacing: '0.03em',
          borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
        }}>
          ⚠️ Maintenance Mode Active — Site sealed for regular students. Tester bypass enabled.
        </div>
      )}
      {!isAtmosphericPage && <Header user={user} onLogout={logout} />}
      <main style={{ paddingTop: isAtmosphericPage ? '0' : '56px', minHeight: '100vh' }}>
        <PageTransition>
          <Routes location={loc}>
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
        </PageTransition>
      </main>
    </>
  )
}

const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'

export default function App() {
  return (
    <GateProvider>
      <AuthProvider>
        <CastleProvider>
          <BrowserRouter>
            <AppRoutes />
            {/* Outside <Routes> so it survives every dashboard phase. It self-gates:
                it shows only when the server lets this account hit /api/dev/* — local
                env test mode, or an account the Warden granted testing rights. */}
            <TestPanel />
          </BrowserRouter>
        </CastleProvider>
      </AuthProvider>
    </GateProvider>
  )
}