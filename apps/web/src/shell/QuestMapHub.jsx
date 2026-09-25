import { useNavigate } from 'react-router-dom'
import TopAvatar from '../components/TopAvatar.jsx'
import FloatingLeaves from '../components/FloatingLeaves.jsx'

/**
 * Pre-sorting dashboard — the onboarding scene: sanctum background, floating
 * leaves, INTRODUCTION banner, and the Oni Gate as static centerpiece art
 * (exactly as in the asset — it is not clickable). The Introduction bar at
 * the bottom is the toggle: it plays the portal warp into the trail.
 */
export default function QuestMapHub({ user }) {
  const nav = useNavigate()

  // Straight into the introduction trail — no warp video here.
  const handleEnter = () => {
    nav('/dashboard/introduction')
  }

  return (
    <div className="bk-sanctum-page">
      {/* Ambient floating red autumn leaves */}
      <FloatingLeaves count={14} />

      {/* Top-left User Avatar */}
      <TopAvatar />

      {/* Ornate Header Banner (Top-center) */}
      <div className="bk-ornate-banner">
        <span className="bk-diamond-accent">◇</span>
        <span className="bk-ornate-banner-text">INTRODUCTION</span>
        <span className="bk-diamond-accent">◇</span>
      </div>

      {/* Welcome line */}
      <p className="bk-hub-line">
        Welcome, {user?.username || 'Initiate'} — the dungeons are sealed. Face the gate.
      </p>

      {/* Introduction button — toggles to the introduction page */}
      <button
        type="button"
        className="bk-hub-cta-btn"
        onClick={handleEnter}
      >
        Introduction
      </button>

      {/* The sealed Oni Gate — static centerpiece, as in the asset */}
      <div className="bk-oni-wrapper bk-oni-static">
        <img
          src="/assets/oni-mask.png"
          alt="Sealed Oni Gate"
          className="bk-oni-graphic"
        />
        <div className="bk-oni-label">
          <span>Sealed</span>
        </div>
      </div>
    </div>
  )
}
