import React from 'react';
import './ArcweaveFortressView.css';
import ArcweaveAnimatedFlags from './ArcweaveAnimatedFlags';

export default function ArcweaveFortressView({ children }) {
  return (
    <div className="arcweave-viewport-stage">
      {/* Master 1376x768 SVG scene layer */}
      <div className="fortress-illustration-canvas">
        <ArcweaveAnimatedFlags />
      </div>

      {/* Cinematic Title Header */}
      <header className="arcweave-cinematic-hud">
        <div className="hud-cinematic-title">
          <div className="cinematic-crest-icon" aria-hidden="true">
            <svg width="34" height="40" viewBox="0 0 34 40" fill="none">
              {/* Shield Base */}
              <path
                d="M17 2 L31 7 V22 C31 32 17 38 17 38 C17 38 3 32 3 22 V7 Z"
                fill="#120924"
                stroke="#3b1d5c"
                strokeWidth="2.2"
              />
              {/* Inner High-Voltage Inset */}
              <path
                d="M17 5 L28 9 V21 C28 29 17 34 17 34 C17 34 6 29 6 21 V9 Z"
                fill="#1e1038"
                stroke="#a855f7"
                strokeWidth="1.2"
              />
              {/* Lightning Bolt Crest */}
              <polygon
                points="18,8 10,21 16,21 14,32 24,18 18,18"
                fill="#ffffff"
                stroke="#c084fc"
                strokeWidth="0.8"
              />
            </svg>
          </div>
          <div className="cinematic-title-text">
            <h1 className="cinematic-house-name">HOUSE ARCWEAVE</h1>
            <span className="cinematic-realm-sub">THE LIGHTNING CITADEL : REALM OF PLASMA ARCANA</span>
          </div>
        </div>
      </header>
      {children && <div className="theme-stage-overlay">{children}</div>}
    </div>
  );
}
