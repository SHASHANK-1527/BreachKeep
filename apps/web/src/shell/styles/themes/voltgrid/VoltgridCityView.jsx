import React, { useState, useEffect } from 'react';
import './VoltgridCityView.css';
import VoltgridCitadelScene from './VoltgridCitadelScene';

export default function VoltgridCityView({ children }) {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = ((e.clientX / window.innerWidth) - 0.5) * 16;
      const y = ((e.clientY / window.innerHeight) - 0.5) * 12;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="voltgrid-viewport-stage">
      <div
        className="cybercity-illustration-canvas"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0) scale(1.025)`,
          transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <VoltgridCitadelScene />
      </div>

      <header className="voltgrid-cinematic-hud">
        <div className="hud-cinematic-title">
          <div className="cinematic-crest-icon" aria-hidden="true">
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
          </div>
          <div className="cinematic-title-text">
            <h1 className="cinematic-house-name">HOUSE VOLTGRID</h1>
            <span className="cinematic-realm-sub">HIGH-VOLTAGE CITADEL &bull; REALM OF THE ELECTRIC GRID</span>
          </div>
        </div>
      </header>

      {children && <div className="theme-stage-overlay">{children}</div>}
    </div>
  );
}
