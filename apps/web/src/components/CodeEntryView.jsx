import { useState } from 'react'
import { api } from '../app/api.js'

export default function CodeEntryView({ onSuccess }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter your code')
      return
    }
    setError('')
    setBusy(true)

    try {
      const res = await api.post('/auth/verify-access-code', { code: code.trim() })
      if (res.redirect) {
        window.location.assign(res.redirect)
        return
      }
      // Some API builds reply { next } without ok:true — accept both shapes.
      if (res.ok || res.next) {
        sessionStorage.setItem('bk_has_access', 'true')
        // Straight to the next page — the portal warp lives between the
        // sign-in page and onboarding, not here.
        window.location.assign(res.next || '/enter')
      } else {
        setError('Invalid access code')
      }
    } catch (err) {
      setError(err.data?.error || 'Invalid access code')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bk-code-page">
      <div className="bk-code-modal">
        <h1 className="bk-code-heading">Code</h1>
        <div className="bk-code-underline" />

        {error && <div className="bk-code-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="bk-code-input"
            placeholder="Enter access code or email"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            disabled={busy}
          />
          <div>
            <button type="submit" className="bk-code-btn" disabled={busy}>
              {busy ? 'Verifying…' : 'Next'}
            </button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="bk-creds-toggle"
              onClick={() => {
                sessionStorage.setItem('bk_has_access', 'true')
                window.location.assign('/enter')
              }}
            >
              Already have an account? Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
