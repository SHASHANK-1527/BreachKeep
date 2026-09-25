import React, { useState, useEffect } from 'react';
import './EmberkeepFortressView.css';
import EmberkeepAnimatedFlags from './EmberkeepAnimatedFlags';

export default function EmberkeepFortressView({ children }) {
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
    <div className="emberkeep-viewport-stage">
      {/* ========================================================
          1. UNIFIED 2D SCENE CANVAS: ARTWORK & ANIMATED FLAGS
          Unified within a single 1376x768 SVG coordinate system
          with preserveAspectRatio="xMidYMax slice" so that all
          flags are mathematically locked to their flagpoles on every screen.
          ======================================================== */}
      <div className="fortress-illustration-canvas">
        <EmberkeepAnimatedFlags windGust={windGust} />

        {/* ========================================================
            2. SCENE CLOUD / SMOKE FORMATIONS IN CONTINUOUS MOTION
            The authentic illustrated clouds from the artwork,
            drifting and billowing with living thermal updraft motion.
            ======================================================== */}
        <div className="scene-illustrated-clouds-container" aria-hidden="true">
          <div className="scene-cloud-wrapper cloud-left-wrapper">
            <img
              src="/ember_cloud_left.png"
              alt=""
              className="scene-cloud-sprite cloud-left-sprite"
            />
          </div>
          <div className="scene-cloud-wrapper cloud-right-wrapper">
            <img
              src="/ember_cloud_right.png"
              alt=""
              className="scene-cloud-sprite cloud-right-sprite"
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CINEMATIC TITLE HEADER
          Clean, weightless typography allowing sky and forge citadel to breathe
          ======================================================== */}
      <header className="emberkeep-cinematic-hud">
        <div className="hud-cinematic-title">
          <div className="cinematic-crest-icon">
            <svg width="26" height="30" viewBox="0 0 28 34" fill="none">
              {/* Outer Volcanic Shield */}
              <path
                d="M14 2 L26 6 V18 C26 27 14 33 14 33 C14 33 2 27 2 18 V6 Z"
                fill="#240c08"
                stroke="#4a150e"
                strokeWidth="2.2"
              />
              {/* Inner Forge Chamber */}
              <path
                d="M14 5 L23 8.5 V17.5 C23 24.5 14 29.5 14 29.5 C14 29.5 5 24.5 5 17.5 V8.5 Z"
                fill="#3d130c"
                stroke="#ff5a1f"
                strokeWidth="1.2"
              />
              {/* Anvil Base */}
              <path
                d="M8 23 H20 V25 C20 26 18 27 14 27 C10 27 8 26 8 25 Z"
                fill="#ffdca8"
              />
              {/* Blazing Forge Flame Emblem */}
              <path
                d="M14 8 C16 12 19 14 18 19 C17 21 15 22 14 22 C13 22 11 21 10 19 C9 15 12 13 14 8 Z"
                fill="#ff5a1f"
              />
              <path
                d="M14 12 C15 14 16.5 15.5 16 18 C15.5 19.5 14.5 20 14 20 C13.5 20 12.5 19.5 12 18 C11.5 15.5 13 14 14 12 Z"
                fill="#ffdca8"
              />
            </svg>
          </div>
          <div className="cinematic-title-text">
            <h1 className="cinematic-house-name">HOUSE EMBERKEEP</h1>
            <span className="cinematic-realm-sub">THE VOLCANIC FORGE &bull; REALM OF FIRE &amp; FURNACE</span>
          </div>
        </div>
      </header>
      {children && <div className="theme-stage-overlay">{children}</div>}
    </div>
  );
}
