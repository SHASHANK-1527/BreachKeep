import { useNavigate } from 'react-router-dom'
import TopAvatar from '../components/TopAvatar.jsx'
import FloatingLeaves from '../components/FloatingLeaves.jsx'

/**
 * Pre-sorting dashboard — the onboarding scene: sanctum background, floating
 * leaves, and the Oni Gate as static centerpiece art, adjusted and harmonized
 * to the sanctum stone pedestal & harvest moon scene. The INTRODUCTION banner
 * itself is the button that toggles to the introduction page.
 */
export default function QuestMapHub({ user }) {
  const nav = useNavigate()

  const handleEnter = () => {
    nav('/dashboard/introduction')
  }

  return (
    <div className="bk-sanctum-page">
      {/* Ambient floating red autumn leaves */}
      <FloatingLeaves count={14} />

      {/* Top-left User Avatar */}
      <TopAvatar />

      {/* INTRODUCTION banner — it is the button into the introduction page */}
      <button
        type="button"
        className="bk-ornate-banner bk-banner-btn"
        onClick={handleEnter}
        aria-label="Open the introduction page"
      >
        <span className="bk-diamond-accent">◇</span>
        <span className="bk-ornate-banner-text">INTRODUCTION</span>
        <span className="bk-diamond-accent">◇</span>
      </button>

      {/* Welcome line */}
      <p className="bk-hub-line">
        Welcome, {user?.username || 'Initiate'} — face the gate to begin.
      </p>

      {/* The Oni Gate — harmonized to match the sanctum stone pedestal & crimson harvest moon */}
      <div className="bk-oni-wrapper bk-oni-static bk-oni-still">
        <div className="bk-oni-pedestal-shadow" aria-hidden="true" />
        <div className="bk-oni-ambient-aura" aria-hidden="true" />
        <img
          src="/assets/oni-mask.webp"
          alt="Oni Gate"
          className="bk-oni-graphic bk-oni-themed"
        />
      </div>
    </div>
  )
}
