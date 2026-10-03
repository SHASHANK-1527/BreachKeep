import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCastle } from '../app/CastleContext.jsx'
import ThemeStage from './styles/themes/ThemeStage.jsx'
import HubShell from './HubShell.jsx'
import HubProfileMenu from './HubProfileMenu.jsx'
import {
  DOOR_ORDER,
  NUMERALS,
  hallFor,
  dungeonMeta,
  doorState,
} from '../features/dungeons/hall/hallConfig.js'
import './styles/castle-experience.css'
import './styles/dungeon-hall.css'

/**
 * The sorted student's home: their house fortress -> the house's "to hall"
 * video -> the hall with six doors, one per dungeon. A live door opens into
 * /dungeons/<id> (the room list); a sealed one explains why it is shut.
 *
 * Stage survives navigation through CastleContext (sessionStorage), so coming
 * back from a dungeon lands straight in the hall without replaying the video.
 */
export default function CastleExperience({ user, progress, capstoneArmed = false }) {
  const nav = useNavigate()
  const { castleView, setCastleView } = useCastle()
  const house = (user?.house || '').toLowerCase()
  const hall = hallFor(house)

  const [stage, setStage] = useState(() => (castleView === 'gates' ? 'hall' : 'fortress'))
  const [videoFading, setVideoFading] = useState(false)
  const [entering, setEntering] = useState(null) // { id, x, y } while the door-open zoom plays
  const [sealed, setSealed] = useState(null) // dungeon id whose sealed notice is showing
  const videoRef = useRef(null)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)) }

  const doors = useMemo(
    () => DOOR_ORDER.map((id, i) => ({
      id,
      num: NUMERALS[i],
      rect: hall.doors[i],
      meta: dungeonMeta(id),
      state: doorState(id, { ...progress, capstoneArmed }),
    })),
    [hall, progress, capstoneArmed]
  )
  const openCount = doors.filter((d) => d.state.open).length

  // Warm the hall image while the student is still on the fortress.
  useEffect(() => { const img = new Image(); img.src = hall.hallImg }, [hall.hallImg])

  const goHall = useCallback(() => {
    setStage('hall')
    setCastleView('gates')
  }, [setCastleView])

  const enterHall = useCallback(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { goHall(); return }
    setStage('video')
  }, [goHall])

  const finishVideo = useCallback(() => {
    setVideoFading(true)
    later(() => { setVideoFading(false); goHall() }, 350)
  }, [goHall])

  const toFortress = useCallback(() => {
    setStage('fortress')
    setCastleView('citadel')
  }, [setCastleView])

  // Autoplay with sound when the browser allows it, muted otherwise; if even
  // that fails, skip straight to the hall rather than leave a black screen.
  useEffect(() => {
    if (stage !== 'video' || !videoRef.current) return
    const v = videoRef.current
    v.currentTime = 0
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => finishVideo())
    })
  }, [stage, finishVideo])

  const openDoor = useCallback((door) => {
    if (entering) return
    if (!door.state.open) { setSealed(door.id); return }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { nav(`/dungeons/${door.id}`); return }
    const { left, top, width, height } = door.rect
    setEntering({ id: door.id, x: left + width / 2, y: top + height / 2 })
    later(() => nav(`/dungeons/${door.id}`), 820)
  }, [entering, nav])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (sealed) setSealed(null)
      else if (stage === 'video') finishVideo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sealed, stage, finishVideo])

  const accentVars = { '--dh-accent': hall.accent, '--dh-glow': hall.glow }

  return (
    <>
      {stage !== 'hall' && (
        <ThemeStage house={house}>
          <HubShell user={user}>
            <div className="dh-fortress-cta" style={accentVars}>
              <p className="dh-cta-eyebrow">{hall.hallName}</p>
              <button type="button" className="dh-enter-btn" onClick={enterHall}>
                <span className="dh-enter-ring" aria-hidden="true" />
                <span>Enter the Hall</span>
              </button>
              <p className="dh-cta-sub">
                Six doors, six dungeons · <strong>{openCount}</strong> unsealed
              </p>
            </div>
          </HubShell>
        </ThemeStage>
      )}

      {stage === 'video' && (
        <div
          className={`exp-transition-overlay ${videoFading ? 'fade-out' : ''}`}
          role="dialog"
          aria-label={`Entering ${hall.hallName}`}
        >
          <video
            ref={videoRef}
            src={hall.video}
            autoPlay
            playsInline
            preload="auto"
            onEnded={finishVideo}
            onError={finishVideo}
            className="exp-transition-video"
          />
          <button type="button" className="exp-skip-btn" onClick={finishVideo}>
            Skip &rarr;
          </button>
        </div>
      )}

      {stage === 'hall' && (
        <div className="dh-hall" style={accentVars} data-house={house}>
          <div
            className={`dh-cover ${entering ? 'is-entering' : ''}`}
            style={entering ? { transformOrigin: `${entering.x}% ${entering.y}%` } : undefined}
          >
            <img className="dh-hall-img" src={hall.hallImg} alt="" draggable="false" />
            {doors.map((door, i) => (
              <DoorHotspot
                key={door.id}
                door={door}
                edge={i === 0 ? 'left' : i === doors.length - 1 ? 'right' : null}
                active={entering?.id === door.id}
                onOpen={() => openDoor(door)}
              />
            ))}
          </div>
          <div className="dh-vignette" aria-hidden="true" />
          <div className="dh-fog" aria-hidden="true" />

          <header className="dh-hud">
            <span className="dh-hud-rune" aria-hidden="true">{hall.rune}</span>
            <div>
              <h1 className="dh-hud-title">{hall.hallName}</h1>
              <p className="dh-hud-sub">
                {hall.name} · {openCount} of {doors.length} doors unsealed
              </p>
            </div>
          </header>

          <HubProfileMenu user={user} />

          {/* Phones: the painting is too wide to aim at, so list the doors. */}
          <ul className="dh-door-list">
            {doors.map((door) => (
              <li key={door.id}>
                <button
                  type="button"
                  className={`dh-list-door ${door.state.open ? '' : 'is-sealed'}`}
                  onClick={() => openDoor(door)}
                >
                  <span className="dh-list-num">{door.num}</span>
                  <span className="dh-list-text">
                    <span className="dh-list-title">{door.meta.title}</span>
                    <span className="dh-list-sub">{door.meta.subject}</span>
                  </span>
                  <DoorStatus door={door} />
                </button>
              </li>
            ))}
          </ul>

          <nav className="dh-dock" aria-label="Hall navigation">
            <button type="button" className="dh-dock-btn" onClick={toFortress} disabled={!!entering}>
              ← Fortress
            </button>
            <button type="button" className="dh-dock-btn" onClick={enterHall} disabled={!!entering}>
              ↻ Replay entry
            </button>
          </nav>

          {entering && <div className="dh-flash" aria-hidden="true" />}
        </div>
      )}

      {sealed && (
        <SealedNotice
          door={doors.find((d) => d.id === sealed)}
          accentVars={accentVars}
          onClose={() => setSealed(null)}
        />
      )}
    </>
  )
}

function DoorHotspot({ door, edge, active, onOpen }) {
  const { rect, state, meta } = door
  return (
    <button
      type="button"
      className={[
        'dh-door',
        state.open ? 'is-open' : 'is-sealed',
        state.conquered ? 'is-conquered' : '',
        active ? 'is-active' : '',
      ].join(' ')}
      style={{
        left: `${rect.left}%`,
        top: `${rect.top}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
      }}
      onClick={onOpen}
      aria-label={`Door ${door.num}: ${meta.title} (${meta.subject}) — ${state.open ? 'open' : 'sealed'}`}
    >
      <span className="dh-door-glow" aria-hidden="true" />
      {!state.open && <span className="dh-door-seal" aria-hidden="true">🔒</span>}

      <span className={`dh-door-tip ${edge ? `edge-${edge}` : ''}`} aria-hidden="true">
        <span className="dh-tip-subject">{meta.subject}</span>
        <span className="dh-tip-blurb">{meta.blurb}</span>
      </span>

      <span className="dh-door-label" aria-hidden="true">
        <span className="dh-label-num">{door.num}</span>
        <span className="dh-label-title">{meta.title}</span>
        <DoorStatus door={door} />
      </span>
    </button>
  )
}

function DoorStatus({ door }) {
  const { state, id } = door
  if (!state.open) return <span className="dh-status is-sealed">Sealed</span>
  if (id === 'capstone') return <span className="dh-status is-open">Armed</span>
  if (state.conquered) return <span className="dh-status is-done">Conquered</span>
  return (
    <span className="dh-status is-open">
      {state.cleared}/{state.total} cleared
    </span>
  )
}

function SealedNotice({ door, accentVars, onClose }) {
  if (!door) return null
  const capstone = door.id === 'capstone'
  return (
    <div className="sealed-gate-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="dh-sealed-title">
      <div
        className="sealed-gate-modal"
        style={{ ...accentVars, '--sealed-accent': 'var(--dh-accent)', '--sealed-glow': 'var(--dh-glow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sealed-modal-icon" aria-hidden="true">🔒</span>
        <h3 id="dh-sealed-title" className="sealed-modal-title">
          Door {door.num} · {door.meta.title}
        </h3>
        <p className="sealed-modal-desc">
          {capstone
            ? 'The Gauntlet runs live, together, on the day. The Warden arms the target box when it begins — this door opens then.'
            : `${door.meta.subject} is still sealed. The Warden unseals each dungeon when your class reaches it — come back once it has been announced.`}
        </p>
        <button type="button" className="sealed-modal-close-btn" onClick={onClose} autoFocus>
          Understood
        </button>
      </div>
    </div>
  )
}
