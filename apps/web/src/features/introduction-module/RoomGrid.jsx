import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAvatar from '../../components/TopAvatar.jsx'
import FloatingLeaves from '../../components/FloatingLeaves.jsx'
import { SCENES, GATE_SPOTS } from './questMapScenes.js'
import { api } from '../../app/api.js'

/**
 * Introduction page — the immersive quest trail rendered from introduction-ui.png.
 * Each milestone and gateway along the winding path is interactive and routes to its task.
 */
export default function RoomGrid() {
  const nav = useNavigate()
  const [cleared, setCleared] = useState(0)

  useEffect(() => {
    api.get('/intro/status').then((res) => {
      if (res && typeof res.cleared === 'number') {
        setCleared(res.cleared)
      }
    }).catch(() => {})
  }, [])

  return (
    <div className="bk-questmap-page bk-intro-page">
      <FloatingLeaves count={12} />
      <TopAvatar />

      {/* Ornate Header Banner */}
      <div className="bk-ornate-banner" style={{ pointerEvents: 'none' }}>
        <span className="bk-diamond-accent">◇</span>
        <span className="bk-ornate-banner-text">INTRODUCTION</span>
        <span className="bk-diamond-accent">◇</span>
      </div>

      {/* Trail progress line */}
      <p className="bk-questmap-progress">
        {cleared >= SCENES.length
          ? 'All nine scenes cleared — return to the hub to be sorted.'
          : `${cleared} of ${SCENES.length} scenes cleared`}
      </p>

      {/* Immersive quest trail matching introduction-ui.png reference */}
      <div className="qm-map qm-map-immersive">
        <img
          src="/assets/introduction-bg.png"
          alt="Introduction Quest Map"
          className="qm-map-bg qm-map-bg-plain"
          draggable="false"
        />

        {SCENES.map((s, i) => {
          const spot = GATE_SPOTS[i]
          const isDone = i < cleared
          return (
            <button
              key={s.to}
              type="button"
              className="qm-gate qm-gate-live qm-gate-tappable"
              style={{
                left: `${spot.left}%`,
                top: `${spot.top}%`,
                width: `${spot.width}%`,
              }}
              onClick={() => nav(s.to)}
              aria-label={`Scene ${s.num}: ${s.title} — ${isDone ? 'cleared, revisit task' : 'enter task'}`}
              title={`${s.title} — tap to enter`}
            >
              <img
                src={s.gate}
                alt={s.title}
                className="qm-gate-img"
                draggable="false"
              />
              <span className="qm-gate-num">{isDone ? '✓' : s.num}</span>
              <span className="qm-gate-tooltip">{s.num}: {s.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
