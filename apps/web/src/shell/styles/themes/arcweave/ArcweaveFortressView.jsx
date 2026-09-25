import React, { useState, useEffect } from 'react';
import './ArcweaveFortressView.css';
import ArcweaveAnimatedFlags from './ArcweaveAnimatedFlags';

export default function ArcweaveFortressView({ children }) {
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
    <div className="arcweave-viewport-stage">
      {/* ========================================================
          1. UNIFIED 2D SCENE CANVAS: ARTWORK & ANIMATED FLAGS
          Unified within a single 1376x768 SVG coordinate system
          with preserveAspectRatio="xMidYMax slice" so that all
          flags are mathematically locked to their flagpoles on every screen.
          ======================================================== */}
      <div className="fortress-illustration-canvas">
        <ArcweaveAnimatedFlags windGust={windGust} />

        {/* ========================================================
            2. SCENE CLOUD FORMATIONS IN CONTINUOUS MOTION
            The authentic illustrated clouds from the artwork itself,
            drifting and billowing with living ambient wind motion.
            ======================================================== */}
        <div className="scene-illustrated-clouds-container" aria-hidden="true">
          <div className="scene-cloud-wrapper cloud-left-wrapper">
            <img
              src="/cloud_left.png"
              alt=""
              className="scene-cloud-sprite cloud-left-sprite"
            />
          </div>
          <div className="scene-cloud-wrapper cloud-right-wrapper">
            <img
              src="/cloud_right.png"
              alt=""
              className="scene-cloud-sprite cloud-right-sprite"
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CINEMATIC TITLE HEADER
          Clean, weightless typography tuned to House Arcweave
          ======================================================== */}
      <header className="arcweave-cinematic-hud">
        <div className="hud-cinematic-title">
          <div className="cinematic-crest-icon">
            <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
              {/* Outer Arcane Shield Border */}
              <path
                d="M14 2 L26 6 V18 C26 27 14 33 14 33 C14 33 2 27 2 18 V6 Z"
                fill="#16102b"
                stroke="#2a1f4a"
                strokeWidth="2.2"
              />
              {/* Inner Royal Violet Inset */}
              <path
                d="M14 5 L23 8.5 V17.5 C23 24.5 14 29.5 14 29.5 C14 29.5 5 24.5 5 17.5 V8.5 Z"
                fill="#2c1e4d"
                stroke="#9b7bff"
                strokeWidth="1.2"
              />
              {/* Grimoire Astral Star in Arcweave Gold */}
              <polygon
                points="14,9 16.5,15 22.5,15.5 18,19.5 19.5,25.5 14,22.5 8.5,25.5 10,19.5 5.5,15.5 11.5,15"
                fill="#ffcf70"
              />
              {/* Central Arcane Eye / Pearl */}
              <circle cx="14" cy="18" r="2.2" fill="#ffffff" />
            </svg>
          </div>
          <div className="cinematic-title-text">
            <h1 className="cinematic-house-name">HOUSE ARCWEAVE</h1>
            <span className="cinematic-realm-sub">THE FLOATING ARCHIVES &bull; REALM OF ARCANE CIPHERS</span>
          </div>
        </div>
      </header>
      {children && <div className="theme-stage-overlay">{children}</div>}
    </div>
  );
}
