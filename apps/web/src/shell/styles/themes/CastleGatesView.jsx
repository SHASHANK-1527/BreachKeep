import React from 'react'
import { CASTLE_THEMES } from '../../../app/CastleContext.jsx'

function HouseCrest({ house }) {
  switch (house) {
    case 'emberkeep':
      return (
        <svg width="34" height="40" viewBox="0 0 34 40" fill="none">
          <path
            d="M17 2 L31 7 V22 C31 32 17 38 17 38 C17 38 3 32 3 22 V7 Z"
            fill="#160806"
            stroke="#3a1510"
            strokeWidth="2.2"
          />
          <path
            d="M17 5 L28 9 V21 C28 29 17 34 17 34 C17 34 6 29 6 21 V9 Z"
            fill="#240e0b"
            stroke="#ff5a1f"
            strokeWidth="1.2"
          />
          <path
            d="M10 24 H24 V27 C24 28 22 29 20 29 H14 C12 29 10 28 10 27 Z"
            fill="#ffdca8"
          />
          <path
            d="M17 10 C14 14 13 17 15 21 C15.5 19.5 17 18 17 18 C17 18 18.5 19.5 19 21 C21 17 20 14 17 10 Z"
            fill="#ff5a1f"
          />
          <circle cx="17" cy="18" r="1.8" fill="#ffffff" />
        </svg>
      )
    case 'arcweave':
      return (
        <svg width="34" height="40" viewBox="0 0 34 40" fill="none">
          <path
            d="M17 2 L31 7 V22 C31 32 17 38 17 38 C17 38 3 32 3 22 V7 Z"
            fill="#120924"
            stroke="#3b1d5c"
            strokeWidth="2.2"
          />
          <path
            d="M17 5 L28 9 V21 C28 29 17 34 17 34 C17 34 6 29 6 21 V9 Z"
            fill="#1e1038"
            stroke="#a855f7"
            strokeWidth="1.2"
          />
          <polygon
            points="18,8 10,21 16,21 14,32 24,18 18,18"
            fill="#ffffff"
            stroke="#c084fc"
            strokeWidth="0.8"
          />
        </svg>
      )
    case 'voltgrid':
      return (
        <svg width="34" height="40" viewBox="0 0 34 40" fill="none">
          <rect
            x="3"
            y="3"
            width="28"
            height="34"
            rx="8"
            fill="#0b0f14"
            stroke="rgba(0, 229, 255, 0.45)"
            strokeWidth="2"
          />
          <rect
            x="5.5"
            y="5.5"
            width="23"
            height="29"
            rx="6"
            fill="none"
            stroke="rgba(0, 229, 255, 0.18)"
            strokeWidth="1"
          />
          <path
            d="M17 7 V14 M17 26 V33 M8 20 H14 M20 20 H26"
            stroke="#00e5ff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="17" cy="20" r="3.8" fill="#00e5ff" />
          <circle cx="17" cy="20" r="2.0" fill="#ffffff" />
          <circle cx="17" cy="7" r="1.2" fill="#7df9ff" />
          <circle cx="17" cy="33" r="1.2" fill="#7df9ff" />
          <circle cx="8" cy="20" r="1.2" fill="#7df9ff" />
          <circle cx="26" cy="20" r="1.2" fill="#7df9ff" />
        </svg>
      )
    case 'rimeguard':
    default:
      return (
        <svg width="26" height="30" viewBox="0 0 28 34" fill="none">
          <path
            d="M14 2 L26 6 V18 C26 27 14 33 14 33 C14 33 2 27 2 18 V6 Z"
            fill="#162739"
            stroke="#152433"
            strokeWidth="2.2"
          />
          <path
            d="M14 5 L23 8.5 V17.5 C23 24.5 14 29.5 14 29.5 C14 29.5 5 24.5 5 17.5 V8.5 Z"
            fill="#24405c"
            stroke="#5d8fb8"
            strokeWidth="1.2"
          />
          <polygon
            points="14,10 17,16 23,17 18.5,21.5 20,27.5 14,24.5 8,27.5 9.5,21.5 5,17 11,16"
            fill="#cbe9fd"
          />
        </svg>
      )
  }
}

/**
 * CastleGatesView
 * Renders the gates image after the entrance transition video.
 */
export default function CastleGatesView({ house, children }) {
  const norm = (house || '').toLowerCase().trim()
  const themeData = CASTLE_THEMES[norm] || CASTLE_THEMES.rimeguard

  return (
    <div className={`castle-gates-stage ${norm}-gates-stage`} data-house={norm}>
      {/* 1. Full-bleed Castle Gates Image Canvas */}
      <div className="castle-gates-illustration-canvas">
        <img
          src={encodeURI(themeData.gatesImage)}
          alt={`${themeData.name} Gates`}
          className="castle-gates-image"
        />
        <div className="castle-gates-atmosphere" />
      </div>

      {/* 2. Cinematic HUD Header matching the house style */}
      <header className={`${norm}-cinematic-hud castle-gates-hud`}>
        <div className="hud-cinematic-title">
          <div className="cinematic-crest-icon" aria-hidden="true">
            <HouseCrest house={norm} />
          </div>
          <div className="cinematic-title-text">
            <h1 className="cinematic-house-name">{themeData.name.toUpperCase()}</h1>
            <span className="cinematic-realm-sub">
              {themeData.gatesTitle} &bull; {themeData.subtitle}
            </span>
          </div>
        </div>
      </header>

      {/* 3. Hub Content / Unlocked Gates / Dungeons Overlay */}
      {children && <div className="theme-stage-overlay">{children}</div>}
    </div>
  )
}
