import React from 'react';
import './EmberkeepAnimatedFlags.css';

/**
 * EmberkeepAnimatedFlags
 * Renders the authentic hand-drawn flags from the volcanic fortress artwork
 * animated with organic cloth wind-wave displacement physics.
 * 
 * Anchored with 100% pixel-perfect native alignment inside the 1376x768 master SVG.
 * Features the floating 3D Ember Forge Core hovering directly over the citadel spire.
 */
export default function EmberkeepAnimatedFlags({ windGust = 1 }) {
  // Gentle, realistic cloth ripple scale (prevents harsh jitter or over-distortion)
  const rippleScale = windGust > 1.2 ? 3.0 : 2.0;

  return (
    <svg
      className="emberkeep-master-scene-svg"
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
            seed="5"
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
              This locks the cloth permanently to the flagpole without detaching or drifting. */}
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

        {/* Authentic Hand-Drawn Flags & Banners in the New Fortress Artwork */}
        <clipPath id="authentic-flags-clip">
          {/* 1. Gatehouse West Battlement Flag */}
          <rect x="568" y="188" width="38" height="34" />
          {/* 2. Gatehouse East Battlement Flag */}
          <rect x="803" y="188" width="38" height="34" />
          {/* 3. Gatehouse Inner Wall Crimson Banner Left */}
          <rect x="486" y="445" width="32" height="66" />
          {/* 4. Gatehouse Inner Wall Crimson Banner Right */}
          <rect x="858" y="445" width="32" height="66" />
          {/* 5. Outer Rampart Crimson Banner Left */}
          <rect x="348" y="455" width="28" height="62" />
          {/* 6. Outer Rampart Crimson Banner Right */}
          <rect x="994" y="455" width="28" height="62" />
        </clipPath>

        {/* Ember Energy Core Glowing Radial Aura Gradient */}
        <radialGradient id="core-energy-glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#ffdca8" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#ff5a1f" stopOpacity="0.45" />
          <stop offset="85%" stopColor="#dc2626" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Base Pristine Illustration Artwork (Clean sky for moving clouds and energy core) */}
      <image
        href="/emberkeep_fortress_scene_cleansky.webp"
        x="0"
        y="0"
        width="1376"
        height="768"
        preserveAspectRatio="none"
      />

      {/* 2. Authentic Hand-Drawn Crimson & Ember Flags in Living Transverse Wind Motion */}
      <g clipPath="url(#authentic-flags-clip)">
        <image
          href="/emberkeep_fortress_scene.webp"
          x="0"
          y="0"
          width="1376"
          height="768"
          preserveAspectRatio="none"
          filter="url(#wind-cloth-wave)"
        />
      </g>

      {/* 3. Floating Rotational Forge Energy Core (Hovering above Citadel Gatehouse) */}
      <g className="energy-core-crystal-group" transform="translate(688, 70)">
        {/* Pulsing Luminous Molten Fire Energy Aura */}
        <circle r="32" fill="url(#core-energy-glow-grad)" className="core-energy-aura-pulse" />

        {/* Vertical Energy Conduit Tether Connecting Gatehouse Battlement to Core */}
        <line
          x1="0"
          y1="24"
          x2="0"
          y2="48"
          stroke="#ff5a1f"
          strokeWidth="1.8"
          strokeDasharray="3,3"
          className="core-energy-tether"
        />

        {/* Orbiting Concentric Energy Rings */}
        <ellipse
          rx="34"
          ry="10"
          fill="none"
          stroke="#ff5a1f"
          strokeWidth="1.2"
          opacity="0.65"
          className="core-orbital-ring-outer"
        />
        <ellipse
          rx="24"
          ry="7"
          fill="none"
          stroke="#ffdca8"
          strokeWidth="1.4"
          opacity="0.85"
          className="core-orbital-ring-inner"
        />

        {/* Ambient Rising Mystic Energy Sparkles & Embers */}
        <circle cx="-14" cy="-8" r="1.5" fill="#ffdca8" opacity="0.85">
          <animate attributeName="cy" values="-8;-18;-8" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.95;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="4" r="1.3" fill="#ff7a00" opacity="0.8">
          <animate attributeName="cy" values="4;-6;4" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="-6" cy="22" r="1.2" fill="#ffdca8" opacity="0.75">
          <animate attributeName="cy" values="22;12;22" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.85;0.2" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="8" cy="20" r="1.4" fill="#ff5a1f" opacity="0.7">
          <animate attributeName="cy" values="20;10;20" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.2s" repeatCount="indefinite" />
        </circle>

        {/* Hand-Drawn Molten Crystal Energy Core (3D Rotating with Incandescent Heat) */}
        <image
          href="/ember_crystal_core.webp"
          x="-28"
          y="-36"
          width="56"
          height="73"
          className="rotating-crystal-image"
        />
      </g>
    </svg>
  );
}
