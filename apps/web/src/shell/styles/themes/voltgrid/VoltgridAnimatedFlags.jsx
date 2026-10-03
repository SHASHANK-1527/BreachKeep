import React from 'react';
import './VoltgridAnimatedFlags.css';
import VoltgridEnergyCore3D from './VoltgridEnergyCore3D';

/**
 * VoltgridAnimatedFlags
 * Renders the authentic cybercity scene artwork and holographic/neon banners
 * animated with organic cloth wind-wave displacement physics.
 * 
 * Anchored with 100% pixel-perfect native alignment inside the 1376x768 master SVG.
 * Upholds House Voltgrid's cyber aesthetic from theme-voltgrid.
 */
export default function VoltgridAnimatedFlags({ windGust = 1 }) {
  // Cloth ripple scale responsive to ambient wind gust variations
  const rippleScale = windGust > 1.2 ? 3.0 : 2.0;

  return (
    <svg
      className="voltgrid-master-scene-svg"
      viewBox="0 0 1376 768"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        {/* Organic Wind Wave Turbulence Filter with Zero Pole Drift */}
        <filter id="wind-cloth-wave" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015 0.035"
            numOctaves="2"
            seed="7"
            result="waveNoise"
          >
            <animate
              attributeName="baseFrequency"
              dur="4.2s"
              values="0.013 0.030; 0.018 0.042; 0.014 0.033; 0.013 0.030"
              repeatCount="indefinite"
            />
          </feTurbulence>
          {/* Neutralize Red channel to 0.5 so horizontal displacement is exactly 0.
              This locks the banners permanently to the structural masts without drifting. */}
          <feColorMatrix
            in="waveNoise"
            type="matrix"
            values="0 0 0 0 0.5
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="transverseWave"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="transverseWave"
            scale={rippleScale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Authentic Cyber Banners along Towers and Megastructures */}
        <clipPath id="authentic-flags-clip">
          {/* 1. Left Foreground Tower Vertical Banner */}
          <rect x="120" y="310" width="75" height="210" rx="3" />
          {/* 2. Left Midground Sentry Tower Banner */}
          <rect x="375" y="415" width="55" height="175" rx="2" />
          {/* 3. Right Midground Sentry Tower Banner */}
          <rect x="960" y="415" width="60" height="175" rx="2" />
          {/* 4. Right Foreground Bastion Mast Banner */}
          <rect x="1230" y="320" width="65" height="180" rx="3" />
        </clipPath>

        {/* Energy Core Glowing Radial Aura Gradient (Voltgrid Teal -> Magenta) */}
        <radialGradient id="core-energy-glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="30%" stopColor="#29e6c9" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#0f766e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#050608" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Base Cybercity Illustration Artwork */}
      <image
        href="/voltgrid_cybercity_scene.webp"
        x="0"
        y="0"
        width="1376"
        height="768"
        preserveAspectRatio="none"
      />

      {/* 2. Authentic Cyber Banners in Living Transverse Wind Motion */}
      <g clipPath="url(#authentic-flags-clip)" className="animated-banner-group">
        <image
          href="/voltgrid_cybercity_scene.webp"
          x="0"
          y="0"
          width="1376"
          height="768"
          preserveAspectRatio="none"
          filter="url(#wind-cloth-wave)"
        />
      </g>

      {/* 3. True 3D Diamond Vector Core (Centered at cx=688, baseCy=86, perfectly aligned) */}
      <VoltgridEnergyCore3D cx={688} baseCy={86} />
    </svg>
  );
}
