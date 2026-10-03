import React, { useRef, useEffect, useState, useCallback } from 'react'
import { CASTLE_THEMES } from '../../../app/CastleContext.jsx'

/**
 * Full-screen cinematic transition video played when entering the castle.
 */
export default function CastleTransitionOverlay({ house, onEnded, onSkip }) {
  const videoRef = useRef(null)
  const [fading, setFading] = useState(false)
  const themeData = CASTLE_THEMES[house] || CASTLE_THEMES.rimeguard
  const videoSrc = themeData.video

  const finish = useCallback(() => {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      onEnded?.()
    }, 350)
  }, [fading, onEnded])

  const handleSkip = (e) => {
    e.stopPropagation()
    onSkip?.()
  }

  // Handle ESC key to skip
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        handleSkip(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])

  // Start playback reliably
  useEffect(() => {
    if (!videoRef.current) return
    const v = videoRef.current
    v.play().catch(() => {
      // If unmuted autoplay fails due to browser policy, mute and retry
      v.muted = true
      v.play().catch(() => {
        // If still fails, advance to the gates
        finish()
      })
    })
  }, [finish])

  return (
    <div
      className={`castle-transition-overlay ${fading ? 'fade-out' : ''}`}
      role="dialog"
      aria-label="Castle entrance transition"
    >
      <video
        ref={videoRef}
        src={encodeURI(videoSrc)}
        autoPlay
        playsInline
        onEnded={finish}
        className="castle-transition-video"
      />

      <button
        type="button"
        className="castle-transition-skip-btn"
        onClick={handleSkip}
        aria-label="Skip transition"
      >
        Skip Transition &rarr;
      </button>
    </div>
  )
}
