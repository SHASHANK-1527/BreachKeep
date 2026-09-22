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
