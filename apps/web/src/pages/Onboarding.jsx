import { useNavigate } from 'react-router-dom'
import TopAvatar from '../components/TopAvatar.jsx'
import FloatingLeaves from '../components/FloatingLeaves.jsx'

export default function Onboarding() {
  const nav = useNavigate()

  return (
    <div className="bk-sanctum-page">
      {/* Ambient floating red autumn leaves */}
      <FloatingLeaves count={14} />

      {/* Top-left User Avatar (Circular gold medallion) */}
      <TopAvatar />

      {/* Ornate Header Banner (Top-center) */}
      <div className="bk-ornate-banner">
        <span className="bk-diamond-accent">◇</span>
        <span className="bk-ornate-banner-text">ONBOARDING</span>
        <span className="bk-diamond-accent">◇</span>
      </div>

      {/* Centerpiece Onboarding Card (Aesthetic matching Introduction page, WITHOUT the Oni Mask) */}
      <div className="bk-onboard-card">
        <h2 className="bk-onboard-title">Welcome to BreachKeep</h2>
        <p className="bk-onboard-desc">
          Before the dungeons open to you, walk the introduction — nine short case
          files that show what lies ahead. Finish them, return, and you will be
          sorted into a house.
        </p>

        <div className="bk-onboard-actions">
          <button
            type="button"
            className="bk-btn-primary-gold"
            onClick={() => nav('/dashboard/introduction')}
          >
            Begin the Introduction
          </button>
          <button
            type="button"
            className="bk-btn-ghost-gold"
            onClick={() => nav('/dashboard')}
          >
            Go to the Hub
          </button>
        </div>
      </div>
    </div>
  )
}
