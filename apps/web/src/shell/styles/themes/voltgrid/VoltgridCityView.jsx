import React, { useState, useEffect } from 'react';
import './VoltgridCityView.css';
import VoltgridAnimatedFlags from './VoltgridAnimatedFlags';

export default function VoltgridCityView({ children }) {
  const [windGust, setWindGust] = useState(1);

  useEffect(() => {
    // Subtle periodic ambient wind gusts to vary banner flutter naturally (exact 1:1 match)
    const interval = setInterval(() => {
      setWindGust(1.4);
      setTimeout(() => setWindGust(1), 2200);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="voltgrid-viewport-stage">
      {/* ========================================================
          1. UNIFIED 2D SCENE CANVAS: ARTWORK & ANIMATED CYBER BANNERS
          Unified within a single 1376x768 SVG coordinate system
          with preserveAspectRatio="xMidYMax slice" so that all
          elements are mathematically locked to their positions on every screen.
          ======================================================== */}
      <div className="cybercity-illustration-canvas">
        <VoltgridAnimatedFlags windGust={windGust} />

        {/* ========================================================
            2. SCENE VAPOR FORMATIONS IN CONTINUOUS MOTION
            Atmospheric nocturnal cybercity mist drifting and billowing
            with living alpine/cyber wind motion.
            ======================================================== */}
        <div className="scene-illustrated-clouds-container" aria-hidden="true">
          <div className="scene-cloud-wrapper cloud-left-wrapper">
            <img
              src="/voltgrid_cloud_left.png"
              alt=""
              className="scene-cloud-sprite cloud-left-sprite"
            />
          </div>
          <div className="scene-cloud-wrapper cloud-right-wrapper">
            <img
              src="/voltgrid_cloud_right.png"
              alt=""
              className="scene-cloud-sprite cloud-right-sprite"
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CINEMATIC TITLE HEADER
          Clean, weightless typography reflecting House Voltgrid
          ======================================================== */}
      <header className="voltgrid-cinematic-hud">
        <div className="hud-cinematic-title">
          <div className="cinematic-crest-icon">
            <svg width="28" height="32" viewBox="0 0 32 36" fill="none">
              {/* Rounded-square hologram panel (Voltgrid screen shape language) */}
              <rect
                x="2"
                y="2"
                width="28"
                height="32"
                rx="8"
                fill="#0d1013"
                stroke="rgba(41, 230, 201, 0.4)"
                strokeWidth="1.8"
              />
              <rect
                x="4.5"
                y="4.5"
                width="23"
                height="27"
                rx="6"
                fill="none"
                stroke="rgba(41, 230, 201, 0.15)"
                strokeWidth="1"
              />
              {/* High-tech circuit traces */}
              <path
                d="M16 6 V13 M16 23 V30 M7 18 H13 M19 18 H25"
                stroke="#29e6c9"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Central Active Data Node (Magenta #ff3cf0 active indicator) */}
              <circle cx="16" cy="18" r="4.2" fill="#ff3cf0" />
              <circle cx="16" cy="18" r="2.2" fill="#ffffff" />
              {/* Micro circuit endpoints */}
              <circle cx="16" cy="6" r="1.2" fill="#29e6c9" />
              <circle cx="16" cy="30" r="1.2" fill="#29e6c9" />
              <circle cx="7" cy="18" r="1.2" fill="#29e6c9" />
              <circle cx="25" cy="18" r="1.2" fill="#29e6c9" />
            </svg>
          </div>
          <div className="cinematic-title-text">
            <h1 className="cinematic-house-name">HOUSE VOLTGRID</h1>
            <span className="cinematic-realm-sub">NEON CYBERCITY &bull; REALM OF DATA TRAFFIC</span>
          </div>
        </div>
      </header>
      {children && <div className="theme-stage-overlay">{children}</div>}
    </div>
  );
}
