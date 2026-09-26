import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAvatar from '../../components/TopAvatar.jsx'
import FloatingLeaves from '../../components/FloatingLeaves.jsx'
import { SCENES, GATE_SPOTS } from './questMapScenes.js'
import { api } from '../../app/api.js'

/**
 * Introduction page — the immersive quest trail. No footer, no modal: every
 * gate on the map is tappable and takes you straight into that scene's task.
 *
 * All nine scenes must be solved before house sorting unlocks, so each gate
 * also shows whether it has already been cleared. The status fetch is
 * best-effort: if it fails the map still renders, just without the markers.
 */
export default function RoomGrid() {
  const nav = useNavigate()
  const [solved, setSolved] = useState([])

  useEffect(() => {
    let alive = true
    api.get('/intro/status')
      .then((s) => { if (alive) setSolved(s?.introRooms || []) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const cleared = solved.length
  const total = SCENES.length

  return (
    <div className="bk-questmap-page bk-intro-page">
      <FloatingLeaves count={12} />
      <TopAvatar />

      {/* Ornate Header Banner (Top-center) */}
      <div className="bk-ornate-banner">
        <span className="bk-diamond-accent">◇</span>
        <span className="bk-ornate-banner-text">INTRODUCTION</span>
        <span className="bk-diamond-accent">◇</span>
      </div>

      {/* Trail progress — all nine gates gate the sorting ceremony */}
      <p className="bk-questmap-progress">
        {cleared >= total
          ? 'All nine scenes cleared — return to the hub to be sorted.'
          : `${cleared} of ${total} scenes cleared`}
      </p>

      {/* Immersive trail: tap a gate to enter its task */}
      <div className="qm-map qm-map-immersive">
        <img src="/assets/introduction-bg.png" alt="" className="qm-map-bg qm-map-bg-plain" draggable="false" />

        {/* Vignette so the trail fades into the night at top and bottom */}
        <div className="qm-vignette" aria-hidden="true" />

        {SCENES.map((s, i) => {
          const spot = GATE_SPOTS[i]
          const done = solved.includes(s.to)
          return (
            <button
              key={s.to}
              type="button"
              className={`qm-gate qm-gate-live qm-gate-tappable${done ? ' qm-gate-solved' : ''}`}
              style={{ left: `${spot.left}%`, top: `${spot.top}%` }}
              onClick={() => nav(s.to)}
              aria-label={`Scene ${s.num}: ${s.title} — ${done ? 'cleared, revisit task' : 'enter task'}`}
              title={`${s.title} — tap to enter${done ? ' (cleared)' : ''}`}
            >
              <img src={s.gate} alt="" className="qm-gate-img" draggable="false" />
              <span className="qm-gate-glow" aria-hidden="true" />
              <span className="qm-gate-num">{done ? '✓' : s.num}</span>
              <span className="qm-gate-tooltip">{s.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
