import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './app/App.jsx'
import './sanctum/sanctum.css'
import './styles/custom-pages.css'
import './styles/page-transitions.css'
import './shell/styles/hub-shell.css'
// all four house themes are scoped by [data-house], safe to import together
import './shell/styles/themes/rimeguard.css'
import './shell/styles/themes/emberkeep.css'
import './shell/styles/themes/arcweave.css'
import './shell/styles/themes/voltgrid.css'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
)
