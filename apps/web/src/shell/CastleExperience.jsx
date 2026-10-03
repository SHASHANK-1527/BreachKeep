import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useCastle, CASTLE_THEMES } from '../app/CastleContext.jsx'
import './styles/castle-experience.css'

/**
 * CITADELS CONFIGURATION
 * Exact asset filenames per instructions:
 * Citadels: emberkeep_forge_citadel, arcweave_lightning_citadel, voltgrid_grid_citadel.webp, rimeguard_citadel
 * Halls: voltgrid_hall, emberkeep_hall, arcweave_hall, rimeguard_hall
 * Transition videos: arcweave_to_hall, rimeguard_to_hall, voltgrid_to_hall, emberkeep_to_hall
 */
export const CITADELS = {
  emberkeep: {
    id: 'emberkeep',
    name: 'House Emberkeep',
    shortName: 'Emberkeep',
    gateName: 'The Forge Gate',
    realmTitle: 'THE FORGE CITADEL',
    sub: 'Realm of Furnace & Anvil',
    citadelImg: '/emberkeep_forge_citadel.webp',
    videoSrc: '/emberkeep_to_hall.mp4',
    hallImg: '/emberkeep_hall.webp',
    accent: '#ff5a1f',
    glow: 'rgba(255, 90, 31, 0.65)',
    rune: '🔥',
    gateCoords: { left: '2.2%', top: '23%', width: '13.8%', height: '46%' },
    desc: 'Hearth of Pyromantic Forging and Molten Metallurgy',
  },
  arcweave: {
    id: 'arcweave',
    name: 'House Arcweave',
    shortName: 'Arcweave',
    gateName: 'The Arcanum Gate',
    realmTitle: 'THE LIGHTNING CITADEL',
    sub: 'Realm of Plasma Arcana',
    citadelImg: '/arcweave_lightning_citadel.webp',
    videoSrc: '/arcweave_to_hall.mp4',
    hallImg: '/arcweave_hall.webp',
    accent: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.65)',
    rune: '⚡',
    gateCoords: { left: '18.2%', top: '23.5%', width: '13.8%', height: '44%' },
    desc: 'Tapestry of Arcane Spells, Lightning & Plasma Tomes',
  },
  voltgrid: {
    id: 'voltgrid',
    name: 'House Voltgrid',
    shortName: 'Voltgrid',
    gateName: 'The Grid Gate',
    realmTitle: 'HIGH-VOLTAGE CITADEL',
    sub: 'Realm of the Electric Grid',
    citadelImg: '/voltgrid_grid_citadel.webp',
    videoSrc: '/voltgrid_to_hall.mp4',
    hallImg: '/voltgrid_hall.webp',
    accent: '#00e5ff',
    glow: 'rgba(0, 229, 255, 0.65)',
    rune: '💠',
    gateCoords: { left: '33.8%', top: '25.5%', width: '13.5%', height: '40.5%' },
    desc: 'High-Voltage Matrix, Cybernetic Relays & Synaptic Power',
  },
  rimeguard: {
    id: 'rimeguard',
    name: 'House Rimeguard',
    shortName: 'Rimeguard',
    gateName: 'The Frost Gate',
    realmTitle: 'THE FROZEN CITADEL',
    sub: 'Realm of Permafrost',
    citadelImg: '/rimeguard_citadel.webp',
    videoSrc: '/rimeguard_to_hall.mp4',
    hallImg: '/rimeguard_hall.webp',
    accent: '#6fd6ff',
    glow: 'rgba(111, 214, 255, 0.65)',
    rune: '❄',
    gateCoords: { left: '52.8%', top: '25.5%', width: '13.5%', height: '40.5%' },
    desc: 'Bastion of Glacial Fortitude and Ancient Frost Wards',
  },
}

export const SEALED_GATES = {
  vault: {
    id: 'vault',
    gateName: 'The Deep Vault',
    realmTitle: 'THE DEEP VAULT',
    sub: 'Sealed Sub-Level',
    rune: '🗝️',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.6)',
    gateCoords: { left: '67.8%', top: '23.5%', width: '13.8%', height: '44%' },
    message:
      'The Deep Vault remains sealed behind ancient adamantine wards. Only initiates who complete their introductory trials and earn their house crest may unlock these sub-chambers.',
  },
  astral: {
    id: 'astral',
    gateName: 'Astral Sanctum',
    realmTitle: 'ASTRAL SANCTUM',
    sub: 'Celestial Portal',
    rune: '✨',
    accent: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.6)',
    gateCoords: { left: '83.8%', top: '23%', width: '13.8%', height: '46%' },
    message:
      'The Astral Sanctum slumbers in cosmic stasis. The planetary alignment has not yet arrived. The Warden will signal when the astral rift opens.',
  },
}

export default function CastleExperience({ house }) {
  const normPropHouse = (house || '').toLowerCase().trim()
  const {
    castleView,
    setCastleView,
    activeHouse,
    setActiveHouse,
  } = useCastle()

  // Initial house selection: activeHouse from context, or house prop, or 'rimeguard'
  const initialHouse = useMemo(() => {
    if (activeHouse && CITADELS[activeHouse]) return activeHouse
    if (normPropHouse && CITADELS[normPropHouse]) return normPropHouse
    return 'rimeguard'
  }, [activeHouse, normPropHouse])

  // Current stage: 'entrance' | 'hall' | 'citadel_preview' | 'transition_video'
  const [stage, setStage] = useState(() => {
    return castleView === 'gates' ? 'hall' : 'entrance'
  })

  const [activeCitadel, setActiveCitadel] = useState(initialHouse)
  const [targetCitadel, setTargetCitadel] = useState(initialHouse)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [videoFading, setVideoFading] = useState(false)
  const [sealedNotice, setSealedNotice] = useState(null)

  const videoRef = useRef(null)
  const previewTimerRef = useRef(null)

  // Preload all imagery immediately to prevent blank flashes or stutter
  useEffect(() => {
    const assetsToPreload = [
      '/assets/gate-bg.webp',
      '/assets/gate-bg-sm.webp',
      ...Object.values(CITADELS).map((c) => c.hallImg),
      ...Object.values(CITADELS).map((c) => c.citadelImg),
    ]

    assetsToPreload.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

  // Sync when prop house changes
  useEffect(() => {
    if (normPropHouse && CITADELS[normPropHouse]) {
      setActiveCitadel(normPropHouse)
      setTargetCitadel(normPropHouse)
    }
  }, [normPropHouse])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [])

  // Handle Enter the Castle from Entrance
  const handleEnterCastle = useCallback(() => {
    if (isTransitioning) return
    setStage('hall')
    if (setCastleView) setCastleView('gates')
  }, [isTransitioning, setCastleView])

  // Handle return to Castle Entrance
  const handleExitToEntrance = useCallback(() => {
    if (isTransitioning) return
    setStage('entrance')
    if (setCastleView) setCastleView('citadel')
  }, [isTransitioning, setCastleView])

  // Trigger Citadel -> Transition Video -> Hall flow
  const handleSelectCitadel = useCallback((citadelId) => {
    if (isTransitioning) return

    if (SEALED_GATES[citadelId]) {
      setSealedNotice(SEALED_GATES[citadelId])
      return
    }

    const nextCitadel = CITADELS[citadelId]
    if (!nextCitadel) return

    setIsTransitioning(true)
    setTargetCitadel(citadelId)
    setStage('citadel_preview')

    // Brief cinematic Citadel title card, then video transition
    previewTimerRef.current = setTimeout(() => {
      setStage('transition_video')
    }, 900)
  }, [isTransitioning])

  // Handle transition video finish
  const handleTransitionComplete = useCallback(() => {
    setVideoFading(true)
    setTimeout(() => {
      setActiveCitadel(targetCitadel)
      if (setActiveHouse) setActiveHouse(targetCitadel)
      if (setCastleView) setCastleView('gates')
      setStage('hall')
      setIsTransitioning(false)
      setVideoFading(false)
    }, 350)
  }, [targetCitadel, setActiveHouse, setCastleView])

  // Handle replay for current citadel
  const handleReplay = useCallback(() => {
    if (isTransitioning) return
    handleSelectCitadel(activeCitadel)
  }, [isTransitioning, activeCitadel, handleSelectCitadel])

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (sealedNotice) {
          setSealedNotice(null)
        } else if (stage === 'transition_video') {
          handleTransitionComplete()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sealedNotice, stage, handleTransitionComplete])

  // Play transition video with browser autoplay policy fallback
  useEffect(() => {
    if (stage === 'transition_video' && videoRef.current) {
      const v = videoRef.current
      v.currentTime = 0
      v.play().catch(() => {
        // Fallback for strict browser autoplay: mute and retry
        v.muted = true
        v.play().catch(() => {
          handleTransitionComplete()
        })
      })
    }
  }, [stage, handleTransitionComplete])

  const currentCitadelData = CITADELS[activeCitadel] || CITADELS.rimeguard
  const targetCitadelData = CITADELS[targetCitadel] || CITADELS.rimeguard

  return (
    <div
      className="castle-exp-root"
      style={{
        '--hall-accent': currentCitadelData.accent,
        '--hall-accent-glow': currentCitadelData.glow,
      }}
    >
      <div className="castle-exp-viewport">
        {/* ========================================================
            STAGE 1: CASTLE ENTRANCE
            ======================================================== */}
        {stage === 'entrance' && (
          <div className="castle-entrance-stage" role="region" aria-label="Castle Entrance">
            <div className="castle-entrance-atmosphere" />
            <div className="castle-entrance-fog" />

            <div className="castle-entrance-content">
              <div className="castle-entrance-header">
                <p className="castle-entrance-eyebrow">BREACHKEEP ANCIENT FORTRESS</p>
                <h1 className="castle-entrance-title">THE CASTLE GATES</h1>
                <p className="castle-entrance-sub">
                  Beyond these ironbound gates lie the Grand Halls and elemental Citadels of the Four Houses.
                  Choose your gateway and cross the threshold.
                </p>
              </div>

              <button
                type="button"
                className="btn-enter-castle-master"
                onClick={handleEnterCastle}
                aria-label="Enter the Castle Hall"
              >
                <span className="btn-enter-glow-ring" aria-hidden="true" />
                <svg
                  className="btn-enter-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M2 20h20v2H2v-2zm2-2V7l2.5 1.5L9 7v11H4zm7 0V3l2.5 1.5L16 3v15h-5zm7 0V7l2.5 1.5L22 7v11h-4zM6 14h2v2H6v-2zm7-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm7 0h2v2h-2v-2z" />
                </svg>
                <span>ENTER THE CASTLE</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 2: CASTLE HALL WITH 6 GATES
            ======================================================== */}
        {stage === 'hall' && (
          <div className="castle-hall-stage" role="region" aria-label="Castle Hall with 6 Gates">
            {/* Castle Hall Artwork as Background */}
            <div className="hall-artwork-wrapper">
              <img
                src={encodeURI(currentCitadelData.hallImg)}
                alt={`${currentCitadelData.name} Castle Hall`}
                className="hall-artwork-image"
              />
              <div className="hall-atmosphere-overlay" />
              <div className="hall-floor-fog" />
            </div>

            {/* Top HUD: Info & Navigation */}
            <header className="hall-top-hud">
              <div className="hall-hud-info">
                <span className="hall-hud-icon" aria-hidden="true">{currentCitadelData.rune}</span>
                <div className="hall-hud-titles">
                  <h2 className="hall-hud-main-title">{currentCitadelData.name}</h2>
                  <span className="hall-hud-sub-title">
                    {currentCitadelData.gateName} &bull; {currentCitadelData.sub}
                  </span>
                </div>
              </div>

              <div className="hall-hud-actions">
                <button
                  type="button"
                  className="hud-action-btn"
                  onClick={handleReplay}
                  disabled={isTransitioning}
                  title="Replay entrance transition video"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Replay</span>
                </button>

                <button
                  type="button"
                  className="hud-action-btn"
                  onClick={handleExitToEntrance}
                  disabled={isTransitioning}
                  title="Return to Castle Entrance"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Entrance</span>
                </button>
              </div>
            </header>

            {/* 6 Interactive Gate Hotspots across the Castle Hall Panorama */}
            <div className="hall-gates-interactive-grid" role="group" aria-label="Castle Hall Gates">
              {/* Gate 1: Emberkeep */}
              <button
                type="button"
                className="hall-gate-hotspot"
                style={{
                  ...CITADELS.emberkeep.gateCoords,
                  '--gate-accent': CITADELS.emberkeep.accent,
                  '--gate-glow': CITADELS.emberkeep.glow,
                }}
                onClick={() => handleSelectCitadel('emberkeep')}
                aria-label="Select Emberkeep Gate"
              >
                <div className="gate-beam-light" />
                <div className="gate-floating-pill">
                  <span className="gate-pill-rune">{CITADELS.emberkeep.rune}</span>
                  <div className="gate-pill-text">
                    <span className="gate-pill-title">{CITADELS.emberkeep.shortName}</span>
                    <span className="gate-pill-sub">{CITADELS.emberkeep.gateName}</span>
                  </div>
                </div>
              </button>

              {/* Gate 2: Arcweave */}
              <button
                type="button"
                className="hall-gate-hotspot"
                style={{
                  ...CITADELS.arcweave.gateCoords,
                  '--gate-accent': CITADELS.arcweave.accent,
                  '--gate-glow': CITADELS.arcweave.glow,
                }}
                onClick={() => handleSelectCitadel('arcweave')}
                aria-label="Select Arcweave Gate"
              >
                <div className="gate-beam-light" />
                <div className="gate-floating-pill">
                  <span className="gate-pill-rune">{CITADELS.arcweave.rune}</span>
                  <div className="gate-pill-text">
                    <span className="gate-pill-title">{CITADELS.arcweave.shortName}</span>
                    <span className="gate-pill-sub">{CITADELS.arcweave.gateName}</span>
                  </div>
                </div>
              </button>

              {/* Gate 3: Voltgrid */}
              <button
                type="button"
                className="hall-gate-hotspot"
                style={{
                  ...CITADELS.voltgrid.gateCoords,
                  '--gate-accent': CITADELS.voltgrid.accent,
                  '--gate-glow': CITADELS.voltgrid.glow,
                }}
                onClick={() => handleSelectCitadel('voltgrid')}
                aria-label="Select Voltgrid Gate"
              >
                <div className="gate-beam-light" />
                <div className="gate-floating-pill">
                  <span className="gate-pill-rune">{CITADELS.voltgrid.rune}</span>
                  <div className="gate-pill-text">
                    <span className="gate-pill-title">{CITADELS.voltgrid.shortName}</span>
                    <span className="gate-pill-sub">{CITADELS.voltgrid.gateName}</span>
                  </div>
                </div>
              </button>

              {/* Gate 4: Rimeguard */}
              <button
                type="button"
                className="hall-gate-hotspot"
                style={{
                  ...CITADELS.rimeguard.gateCoords,
                  '--gate-accent': CITADELS.rimeguard.accent,
                  '--gate-glow': CITADELS.rimeguard.glow,
                }}
                onClick={() => handleSelectCitadel('rimeguard')}
                aria-label="Select Rimeguard Gate"
              >
                <div className="gate-beam-light" />
                <div className="gate-floating-pill">
                  <span className="gate-pill-rune">{CITADELS.rimeguard.rune}</span>
                  <div className="gate-pill-text">
                    <span className="gate-pill-title">{CITADELS.rimeguard.shortName}</span>
                    <span className="gate-pill-sub">{CITADELS.rimeguard.gateName}</span>
                  </div>
                </div>
              </button>

              {/* Gate 5: Sealed Vault */}
              <button
                type="button"
                className="hall-gate-hotspot is-sealed"
                style={{
                  ...SEALED_GATES.vault.gateCoords,
                  '--gate-accent': SEALED_GATES.vault.accent,
                  '--gate-glow': SEALED_GATES.vault.glow,
                }}
                onClick={() => handleSelectCitadel('vault')}
                aria-label="Inspect The Deep Vault (Sealed)"
              >
                <div className="gate-beam-light" />
                <div className="gate-floating-pill">
                  <span className="gate-pill-rune">{SEALED_GATES.vault.rune}</span>
                  <div className="gate-pill-text">
                    <span className="gate-pill-title">{SEALED_GATES.vault.gateName}</span>
                    <span className="gate-pill-sub">Sealed Chamber</span>
                  </div>
                </div>
              </button>

              {/* Gate 6: Astral Sanctum */}
              <button
                type="button"
                className="hall-gate-hotspot is-sealed"
                style={{
                  ...SEALED_GATES.astral.gateCoords,
                  '--gate-accent': SEALED_GATES.astral.accent,
                  '--gate-glow': SEALED_GATES.astral.glow,
                }}
                onClick={() => handleSelectCitadel('astral')}
                aria-label="Inspect Astral Sanctum (Sealed)"
              >
                <div className="gate-beam-light" />
                <div className="gate-floating-pill">
                  <span className="gate-pill-rune">{SEALED_GATES.astral.rune}</span>
                  <div className="gate-pill-text">
                    <span className="gate-pill-title">{SEALED_GATES.astral.gateName}</span>
                    <span className="gate-pill-sub">Celestial Portal</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Bottom Citadel Selector Dock */}
            <nav className="hall-bottom-dock" aria-label="Select Citadel">
              {Object.values(CITADELS).map((c) => {
                const isActive = activeCitadel === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`dock-citadel-btn ${isActive ? 'is-active' : ''}`}
                    style={{
                      '--dock-accent': c.accent,
                      '--dock-glow': c.glow,
                    }}
                    onClick={() => handleSelectCitadel(c.id)}
                    disabled={isTransitioning}
                    aria-pressed={isActive}
                  >
                    <span aria-hidden="true">{c.rune}</span>
                    <span>{c.shortName}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        )}

        {/* ========================================================
            STAGE 3: CITADEL PREVIEW
            ======================================================== */}
        {stage === 'citadel_preview' && (
          <div
            className="citadel-preview-stage"
            role="status"
            aria-label={`Approaching ${targetCitadelData.name}`}
            style={{
              '--preview-accent': targetCitadelData.accent,
              '--preview-glow': targetCitadelData.glow,
            }}
          >
            <img
              src={encodeURI(targetCitadelData.citadelImg)}
              alt={`${targetCitadelData.name} Citadel`}
              className="citadel-preview-image"
            />
            <div className="citadel-preview-atmosphere" />

            <div className="citadel-preview-banner">
              <span className="preview-banner-rune" aria-hidden="true">{targetCitadelData.rune}</span>
              <h2 className="preview-banner-title">{targetCitadelData.realmTitle}</h2>
              <p className="preview-banner-sub">
                {targetCitadelData.name} &bull; {targetCitadelData.sub}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          STAGE 4: FULL-SCREEN TRANSITION VIDEO OVERLAY
          ======================================================== */}
      {stage === 'transition_video' && (
        <div
          className={`exp-transition-overlay ${videoFading ? 'fade-out' : ''}`}
          role="dialog"
          aria-label={`${targetCitadelData.name} Transition Video`}
        >
          <video
            ref={videoRef}
            src={encodeURI(targetCitadelData.videoSrc)}
            autoPlay
            playsInline
            onEnded={handleTransitionComplete}
            className="exp-transition-video"
          />

          <button
            type="button"
            className="exp-skip-btn"
            onClick={handleTransitionComplete}
            aria-label="Skip transition video"
          >
            Skip Transition &rarr;
          </button>
        </div>
      )}

      {/* ========================================================
          SEALED GATE NOTICE MODAL (Gates 5 & 6)
          ======================================================== */}
      {sealedNotice && (
        <div
          className="sealed-gate-modal-backdrop"
          onClick={() => setSealedNotice(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sealed-title"
        >
          <div
            className="sealed-gate-modal"
            style={{
              '--sealed-accent': sealedNotice.accent,
              '--sealed-glow': sealedNotice.glow,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sealed-modal-icon" aria-hidden="true">{sealedNotice.rune}</span>
            <h3 id="sealed-title" className="sealed-modal-title">{sealedNotice.realmTitle}</h3>
            <p className="sealed-modal-desc">{sealedNotice.message}</p>
            <button
              type="button"
              className="sealed-modal-close-btn"
              onClick={() => setSealedNotice(null)}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
