import React, { useState, useEffect } from 'react';
import './EmberkeepFortressView.css';
import EmberkeepForgeScene from './EmberkeepForgeScene';

export default function EmberkeepFortressView({ children }) {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Smooth cinematic parallax camera shift
      const x = ((e.clientX / window.innerWidth) - 0.5) * 16;
      const y = ((e.clientY / window.innerHeight) - 0.5) * 12;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="emberkeep-viewport-stage">
      {/* Master 1376x768 SVG scene layer with smooth parallax tracking */}
      <div
        className="fortress-illustration-canvas"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0) scale(1.025)`,
          transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <EmberkeepForgeScene />
      </div>

      {/* Cinematic Title Header */}
      <header className="emberkeep-cinematic-hud">
        <div className="hud-cinematic-title">
          <div className="cinematic-crest-icon" aria-hidden="true">
            <svg width="34" height="40" viewBox="0 0 34 40" fill="none">
              {/* Outer Volcanic Shield */}
              <path
                d="M17 2 L31 7 V22 C31 32 17 38 17 38 C17 38 3 32 3 22 V7 Z"
                fill="#160806"
                stroke="#3a1510"
                strokeWidth="2.2"
              />
              {/* Inner Hearth Inset */}
              <path
                d="M17 5 L28 9 V21 C28 29 17 34 17 34 C17 34 6 29 6 21 V9 Z"
                fill="#240e0b"
                stroke="#ff5a1f"
                strokeWidth="1.2"
              />
              {/* Anvil & Hearth Flame Symbol */}
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
          </div>
          <div className="cinematic-title-text">
            <h1 className="cinematic-house-name">HOUSE EMBERKEEP</h1>
            <span className="cinematic-realm-sub">THE FORGE CITADEL : REALM OF FURNACE & ANVIL</span>
          </div>
        </div>
      </header>
      {children && <div className="theme-stage-overlay">{children}</div>}
    </div>
  );
}
