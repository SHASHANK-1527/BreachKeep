import React, { useState, useEffect } from 'react';
import './RimeguardFortressView.css';
import RimeguardAnimatedFlags from './RimeguardAnimatedFlags';

export default function RimeguardFortressView({ children }) {
  const [windGust, setWindGust] = useState(1);

  useEffect(() => {
    // Subtle periodic ambient wind gusts to vary flag flutter naturally
    const interval = setInterval(() => {
      setWindGust(1.4);
      setTimeout(() => setWindGust(1), 2200);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rimeguard-viewport-stage">
      {/* ========================================================
          1. UNIFIED 2D SCENE CANVAS: ARTWORK & ANIMATED FLAGS
          Unified within a single 1376x768 SVG coordinate system
          with preserveAspectRatio="xMidYMax slice" so that all
          flags are mathematically locked to their flagpoles on every screen.
          ======================================================== */}
      <div className="fortress-illustration-canvas">
        <RimeguardAnimatedFlags windGust={windGust} includeBackground={true} />

        {/* ========================================================
            2. SCENE CLOUD FORMATIONS IN CONTINUOUS MOTION
            The authentic illustrated clouds from the artwork itself,
            drifting and billowing with living alpine wind motion.
            ======================================================== */}
        <div className="scene-illustrated-clouds-container" aria-hidden="true">
          <div className="scene-cloud-wrapper cloud-left-wrapper">
            <img
              src="/cloud_left.webp"
              alt=""
              className="scene-cloud-sprite cloud-left-sprite"
            />
          </div>
          <div className="scene-cloud-wrapper cloud-right-wrapper">
            <img
              src="/cloud_right.webp"
              alt=""
              className="scene-cloud-sprite cloud-right-sprite"
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CINEMATIC TITLE HEADER
          Clean, weightless typography that lets the sky and peaks breathe
          ======================================================== */}
      <header className="rimeguard-cinematic-hud">
        <div className="hud-cinematic-title">
          <div className="cinematic-crest-icon">
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
