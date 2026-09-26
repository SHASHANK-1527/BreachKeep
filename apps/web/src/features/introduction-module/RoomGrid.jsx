import { useNavigate } from 'react-router-dom'
import TopAvatar from '../../components/TopAvatar.jsx'
import FloatingLeaves from '../../components/FloatingLeaves.jsx'
import { SCENES, GATE_SPOTS } from './questMapScenes.js'

/**
 * Introduction page — the immersive quest trail. No footer, no modal: every
 * gate on the map is tappable and takes you straight into that scene's task.
 */
export default function RoomGrid() {
  const nav = useNavigate()

  return (
    <div className="bk-questmap-page bk-intro-page">
      <FloatingLeaves count={12} />
      <TopAvatar />

      {/* Immersive trail: tap a gate to enter its task */}
      <div className="qm-map qm-map-immersive">
        <img src="/assets/introduction-bg.png" alt="" className="qm-map-bg qm-map-bg-plain" draggable="false" />

        {/* Vignette so the trail fades into the night at top and bottom */}
        <div className="qm-vignette" aria-hidden="true" />

        {SCENES.map((s, i) => {
          const spot = GATE_SPOTS[i]
          return (
            <button
              key={s.to}
              type="button"
              className="qm-gate qm-gate-live qm-gate-tappable"
              style={{ left: `${spot.left}%`, top: `${spot.top}%` }}
              onClick={() => nav(s.to)}
              aria-label={`Scene ${s.num}: ${s.title} — enter task`}
              title={`${s.title} — tap to enter`}
            >
              <img src={s.gate} alt="" className="qm-gate-img" draggable="false" />
              <span className="qm-gate-glow" aria-hidden="true" />
              <span className="qm-gate-num">{s.num}</span>
              <span className="qm-gate-tooltip">{s.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
