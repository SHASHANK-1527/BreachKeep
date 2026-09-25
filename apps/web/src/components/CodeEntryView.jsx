import { useState, useRef } from 'react'
import { api } from '../app/api.js'

export default function CodeEntryView({ onSuccess }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Portal warp: on success the modal fades, the vortex video fills the
  // screen, then we hand off to the next page (same as the sign-in page).
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isFlashActive, setIsFlashActive] = useState(false)
  const videoRef = useRef(null)

  const goTo = (dest) => {
    setIsTransitioning(true)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play().catch(() => {})
      }
    }, 100)
    setTimeout(() => setIsFlashActive(true), 2200)
    setTimeout(() => window.location.assign(dest), 2700)
  }

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
        // Always play the portal warp between the verification code and the
        // onboarding message; the hard navigation at the end makes the parent
        // app re-read the gate flag from sessionStorage. Calling onSuccess now
        // would unmount this view and cut the video short.
        goTo('/onboarding')
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
      {/* Full-screen Portal Video Transition (on success) */}
      {isTransitioning && (
        <div className="bk-portal-transition-layer">
          <video
            ref={videoRef}
            className="bk-portal-video"
            playsInline
            muted
            autoPlay
            src="/assets/portal.mp4"
          />
        </div>
      )}

      {/* Screen-filling Portal Flash Overlay */}
      <div className={`bk-portal-flash-overlay ${isFlashActive ? 'active' : ''}`} />

      <div className={`bk-code-modal ${isTransitioning ? 'bk-fading' : ''}`}>
        <h1 className="bk-code-heading">Code</h1>
        <div className="bk-code-underline" />

        {error && <div className="bk-code-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="bk-code-input"
            placeholder="Enter your code"
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
        </form>
      </div>
    </div>
  )
}
