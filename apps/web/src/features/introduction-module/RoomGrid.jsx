import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAvatar from '../../components/TopAvatar.jsx'
import FloatingLeaves from '../../components/FloatingLeaves.jsx'
import GoldenFireflies from './components/GoldenFireflies.jsx'
import { SCENES, GATE_SPOTS } from './questMapScenes.js'
import { api } from '../../app/api.js'

// The instructor demo wing is always reachable by URL
// (/dashboard/introduction/demo-vulnerability); this only decides whether a
// button for it sits on the quest map. Vite strips the branch from a production
// bundle when VITE_TEST_MODE is not 'true'.
const SHOW_DEMO_LINK = import.meta.env.VITE_TEST_MODE === 'true'

// Precise locations of night sky stars across top sky
const STAR_SPOTS = [
  { left: 4.2, top: 3.0, size: 2.0, delay: 0 },
  { left: 10.8, top: 5.8, size: 2.8, delay: 1.2 },
  { left: 16.5, top: 2.2, size: 2.0, delay: 2.1 },
  { left: 23.2, top: 7.8, size: 3.6, delay: 0.7, flare: true },
  { left: 29.4, top: 3.8, size: 2.2, delay: 1.8 },
  { left: 35.1, top: 6.8, size: 2.6, delay: 2.5 },
  { left: 41.6, top: 2.8, size: 2.0, delay: 0.4 },
  { left: 48.2, top: 8.6, size: 3.0, delay: 1.6 },
  { left: 54.8, top: 3.6, size: 2.2, delay: 2.8 },
  { left: 61.9, top: 7.2, size: 3.5, delay: 0.9, flare: true },
  { left: 68.3, top: 3.2, size: 2.0, delay: 1.4 },
  { left: 74.5, top: 5.8, size: 2.4, delay: 2.2 },
  { left: 80.2, top: 2.2, size: 2.0, delay: 0.3 },
  { left: 86.8, top: 5.2, size: 3.0, delay: 1.9 },
  { left: 93.4, top: 7.6, size: 3.6, delay: 1.1, flare: true },
  { left: 96.2, top: 3.4, size: 2.0, delay: 2.6 },
  { left: 7.8, top: 10.8, size: 2.4, delay: 1.7 },
  { left: 19.2, top: 12.2, size: 2.0, delay: 0.8 },
  { left: 38.5, top: 12.0, size: 2.2, delay: 2.3 },
  { left: 58.8, top: 11.2, size: 2.6, delay: 1.5 },
  { left: 71.8, top: 9.8, size: 2.0, delay: 0.6 },
  { left: 89.8, top: 11.8, size: 2.2, delay: 2.0 },
]

// Natural ambient lantern & brazier breathing glow positions
const LANTERN_GLOW_SPOTS = [
  { left: 7.6, top: 17.0, size: 70, delay: 0 },
  { left: 30.4, top: 29.8, size: 65, delay: 0.6 },
  { left: 52.8, top: 36.4, size: 55, delay: 1.2 },
  { left: 63.5, top: 36.4, size: 55, delay: 0.3 },
  { left: 58.2, top: 33.2, size: 50, delay: 0.9 },
  { left: 50.8, top: 40.5, size: 65, delay: 1.5 },
  { left: 23.0, top: 44.2, size: 60, delay: 0.4 },
  { left: 31.2, top: 44.2, size: 60, delay: 1.0 },
  { left: 53.5, top: 56.6, size: 65, delay: 0.7 },
  { left: 56.4, top: 59.8, size: 60, delay: 1.3 },
  { left: 65.4, top: 59.8, size: 60, delay: 0.5 },
  { left: 76.4, top: 28.5, size: 70, delay: 0.8 },
  { left: 83.2, top: 28.5, size: 70, delay: 1.4 },
  { left: 79.8, top: 27.2, size: 80, delay: 0.2 },
  { left: 54.0, top: 76.0, size: 65, delay: 0.6 },
  { left: 20.0, top: 82.0, size: 65, delay: 1.1 },
  { left: 62.0, top: 92.0, size: 65, delay: 0.5 },
]

/**
 * Introduction page — immersive quest trail with living atmosphere:
 * twinkling night sky stars, drifting mountain clouds, physically simulated
 * cascading waterfall canvas, dancing torch and brazier flames, and unified gates.
 */
export default function RoomGrid() {
  const nav = useNavigate()
  const [completedRooms, setCompletedRooms] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('bk_completed_intro_rooms') || '[]')
      return Array.isArray(cached) ? cached : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const fetchStatus = () => {
      api.get('/intro/status').then((res) => {
        let rooms = []
        if (res && Array.isArray(res.introRooms)) {
          rooms = res.introRooms
        } else if (res && typeof res.cleared === 'number') {
          rooms = SCENES.slice(0, res.cleared).map(s => s.to)
        }
        // The server is the source of truth. Replace (do NOT union with the old
        // localStorage mirror) so an admin “Restart intro” / reset actually clears
        // the quest map instead of the stale cache keeping every gate lit.
        try {
          localStorage.setItem('bk_completed_intro_rooms', JSON.stringify(rooms))
        } catch {}
        setCompletedRooms(rooms)
      }).catch(() => {})
    }

    fetchStatus()

    const onRoomCompleted = () => fetchStatus()
    window.addEventListener('bk:intro_room_completed', onRoomCompleted)
    window.addEventListener('focus', onRoomCompleted)
    return () => {
      window.removeEventListener('bk:intro_room_completed', onRoomCompleted)
      window.removeEventListener('focus', onRoomCompleted)
    }
  }, [])

  const clearedCount = completedRooms.length

  return (
    <div className="bk-questmap-page bk-intro-page">
      <FloatingLeaves count={14} />
      <TopAvatar />

      {/* Ornate Header Banner */}
      <div className="bk-ornate-banner" style={{ pointerEvents: 'none' }}>
        <span className="bk-diamond-accent">◇</span>
        <span className="bk-ornate-banner-text">INTRODUCTION</span>
        <span className="bk-diamond-accent">◇</span>
      </div>

      {SHOW_DEMO_LINK && (
        <p className="bk-questmap-demo-link">
          <button type="button" className="im-btn im-ghost im-small" onClick={() => nav('demo-vulnerability')}>
            Instructor demo &mdash; the unpatched wing
          </button>
        </p>
      )}

      {/* Trail progress line */}
      <p className="bk-questmap-progress">
        {clearedCount >= SCENES.length
          ? '✦ All nine scenes cleared — return to the hub to be sorted. ✦'
          : `${clearedCount} of ${SCENES.length} scenes cleared`}
      </p>

      {/* Immersive quest trail with living animations */}
      <div className="qm-map qm-map-immersive">
        {/* Base Map Graphic — Mounted first as foundational background */}
        <img
          src="/assets/introduction-bg.webp"
          alt="Introduction Quest Map"
          className="qm-map-bg qm-map-bg-plain"
          draggable="false"
        />

        {/* 1. Atmospheric mountain mist & wisps */}
        <div className="qm-mountain-mist" aria-hidden="true" />
        <div className="qm-forest-wisps" aria-hidden="true" />

        {/* 2. Twinkling Night Sky Stars */}
        <div className="qm-stars-layer" aria-hidden="true">
          {STAR_SPOTS.map((st, idx) => (
            <span
              key={idx}
              className={`qm-twinkle-star ${st.flare ? 'is-flare' : ''}`}
              style={{
                left: `${st.left}%`,
                top: `${st.top}%`,
                width: `${st.size}px`,
                height: `${st.size}px`,
                animationDelay: `${st.delay}s`,
              }}
            />
          ))}
        </div>

        {/* 3. Glowing Golden Dots (Fireflies) */}
        <GoldenFireflies count={36} />

        {/* 6. Subtle Ambient Lantern Breathing Glow (soft light warmth, no cartoon flames) */}
        <div className="qm-lantern-breathing-layer" aria-hidden="true">
          {LANTERN_GLOW_SPOTS.map((l, idx) => (
            <div
              key={idx}
              className="qm-lantern-breath-spot"
              style={{
                left: `${l.left}%`,
                top: `${l.top}%`,
                width: `${l.size}px`,
                height: `${l.size}px`,
                animationDelay: `${l.delay}s`,
              }}
            />
          ))}
        </div>

        {/* 6. Interactive Gates with integrated ground shadows and clear completion badges */}
        {SCENES.map((s, i) => {
          const spot = GATE_SPOTS[i]
          const isDone = completedRooms.includes(s.to)
          return (
            <button
              key={s.to}
              type="button"
              className={`qm-gate qm-gate-live qm-gate-tappable ${isDone ? 'is-cleared' : ''}`}
              style={{
                left: `${spot.left}%`,
                top: `${spot.top}%`,
                width: `${spot.width}%`,
              }}
              onClick={() => nav(s.to)}
              aria-label={`Scene ${s.num}: ${s.title} — ${isDone ? 'cleared, revisit task' : 'enter task'}`}
              title={`${s.title} — tap to enter`}
            >
              {/* Ground contact shadow to seat gate firmly in the forest path */}
              <div className="qm-gate-ground-shadow" aria-hidden="true" />

              <img
                src={s.gate}
                alt={s.title}
                className={`qm-gate-img ${isDone ? 'qm-gate-done' : ''}`}
                draggable="false"
              />

              {/* Seamless Roman Numeral Badge with Integrated Golden Clearance Seal */}
              <span className={`qm-gate-num ${isDone ? 'qm-gate-num-cleared' : ''}`}>
                {isDone ? `✓ ${s.num}` : s.num}
              </span>

              <span className="qm-gate-tooltip">
                {s.num}: {s.title}{isDone ? ' · CLEARED' : ''}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}


