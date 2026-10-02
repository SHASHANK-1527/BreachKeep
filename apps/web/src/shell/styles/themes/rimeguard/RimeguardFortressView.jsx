import React from 'react';
import './RimeguardFortressView.css';
import RimeguardAnimatedFlags from './RimeguardAnimatedFlags';

/**
 * RimeguardFortressView
 * Master viewport stage for House Rimeguard Frozen Citadel.
 * Clean, weightless cinematic presentation with zero buttons or clutter.
 */
export default function RimeguardFortressView({ children }) {
  return (
    <div className="rimeguard-viewport-stage">
      {/* ========================================================
          1. MASTER 1376x768 SCENE CANVAS: ARTWORK & ANIMATED CITADEL
          Unified SVG coordinate system with preserveAspectRatio="xMidYMax slice"
          locking all frost cores, lightning arcs, and waterfalls in place.
          ======================================================== */}
      <div className="fortress-illustration-canvas">
        <RimeguardAnimatedFlags />
      </div>

      {/* ========================================================
          2. CINEMATIC TITLE HEADER
          Clean, weightless typography that lets the sky and peaks breathe.
          Zero buttons, zero extra text or overlays.
          ======================================================== */}
      <header className="rimeguard-cinematic-hud">
        <div className="hud-cinematic-title">
          <div className="cinematic-crest-icon" aria-hidden="true">
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
              <polygon points="14,10 17,16 23,17 18.5,21.5 20,27.5 14,24.5 8,27.5 9.5,21.5 5,17 11,16" fill="#cbe9fd" />
            </svg>
          </div>
          <div className="cinematic-title-text">
            <h1 className="cinematic-house-name">HOUSE RIMEGUARD</h1>
            <span className="cinematic-realm-sub">THE FROZEN CITADEL &bull; REALM OF PERMAFROST</span>
          </div>
        </div>
      </header>

      {children && <div className="theme-stage-overlay">{children}</div>}
    </div>
  );
}
