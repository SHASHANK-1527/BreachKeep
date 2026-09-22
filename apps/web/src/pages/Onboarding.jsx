import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext.jsx'
import ParticleField from '../sanctum/ParticleField.jsx'

// First login: nudge the student into the introduction module. Sorting happens
// on the Dashboard when they return with introComplete=true (phase B).
export default function Onboarding() {
  const nav = useNavigate()
  const { user } = useAuth()
  return (
    <div className="sn-onboarding">
      <ParticleField mode="portal" />
      <div className="sn-onboard-card">
        <h1 className="sn-title">Welcome to BreachKeep</h1>
        <p className="sn-sub">
          Before the dungeons open to you, walk the introduction — three short case files that
          show what lies ahead. Finish them, return, and you will be sorted into a house.
        </p>
        <button className="sn-enter-btn" onClick={() => nav('/dashboard/introduction')}>
          Begin the Introduction
        </button>
        <button className="sn-ghost-btn" onClick={() => nav('/dashboard')}>Go to the hub</button>
      </div>
    </div>
  )
}
