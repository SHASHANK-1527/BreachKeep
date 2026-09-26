import React from 'react'
import ReactDOM from 'react-dom/client'
import Landing from './pages/Landing.jsx'
import Maintenance from './pages/Maintenance.jsx'
import useMaintenance from './app/useMaintenance.js'
import './sanctum/sanctum.css'
import './styles/custom-pages.css'

// The public bundle checks the kill switch too — otherwise a closed site would
// still show the access-code page and let students try (and fail) to enter.
function PublicRoot() {
  const { checked, maintenance, message, eta } = useMaintenance()
  if (!checked) return null
  if (maintenance) return <Maintenance message={message} eta={eta} />
  return <Landing />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PublicRoot />
  </React.StrictMode>
)
