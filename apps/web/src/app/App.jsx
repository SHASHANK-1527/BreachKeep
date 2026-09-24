import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import { GateProvider } from './GateContext.jsx'
import Enter from '../pages/Enter.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Onboarding from '../pages/Onboarding.jsx'
import Dungeon from '../pages/Dungeon.jsx'
import Account from '../pages/Account.jsx'
import AdminPanel from '../pages/admin/AdminPanel.jsx'
import IntroductionModule from '../features/introduction-module/IntroductionModule.jsx'

import { useState } from 'react'
import { api } from './api.js'

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/keep-warden-7f3a9c'

function RequireSession({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="bk-loading">Loading…</div>
  if (!user) return <Navigate to="/enter" replace state={{ from: loc }} />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const [accessCode, setAccessCode] = useState('')
  const [accessError, setAccessError] = useState('')
  const [hasAccess, setHasAccess] = useState(false)

  const handleAccessSubmit = async (e) => {
    e.preventDefault()
    setAccessError('')
    try {
      const res = await api.post('/auth/verify-access-code', { code: accessCode })
      if (res.ok || res.status === 200) {
        setHasAccess(true)
      } else {
        setAccessError('Access Denied')
      }
    } catch (e2) {
      setAccessError(e2.data?.error || 'Invalid access code')
    }
  }

  if (!hasAccess) {
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

  return (
    <Routes>
      {/* Admin panel at the secret path; its own API calls enforce the admin password */}
      <Route path={ADMIN_PATH} element={<AdminPanel />} />

      <Route
        path="/enter"
        element={loading ? <div className="bk-loading">Loading…</div> : user ? <Navigate to="/dashboard" replace /> : <Enter />}
      />
      <Route path="/onboarding" element={<RequireSession><Onboarding /></RequireSession>} />
      <Route path="/dashboard" element={<RequireSession><Dashboard /></RequireSession>} />
      <Route path="/dashboard/introduction/*" element={<RequireSession><IntroductionModule /></RequireSession>} />
      <Route path="/dungeons/:dungeonId/*" element={<RequireSession><Dungeon /></RequireSession>} />
      <Route path="/account" element={<RequireSession><Account /></RequireSession>} />

      {/* anything else inside the gated bundle -> send to enter */}
      <Route path="*" element={<Navigate to="/enter" replace />} />
    </Routes>
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
