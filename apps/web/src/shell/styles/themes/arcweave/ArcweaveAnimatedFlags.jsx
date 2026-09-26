import React from 'react';
import './ArcweaveAnimatedFlags.css';

/**
 * ArcweaveAnimatedFlags
 * Renders the authentic hand-drawn flags from the citadel illustration
 * animated with organic cloth wind-wave displacement physics and
 * graded in House Arcweave's mystical twilight violet & celestial palette.
 * 
 * Anchored with 100% pixel-perfect native alignment inside the 1376x768 master SVG.
 */
export default function ArcweaveAnimatedFlags({ windGust = 1 }) {
  // Gentle, realistic cloth ripple scale (prevents harsh jitter or over-distortion)
  const rippleScale = windGust > 1.2 ? 3.0 : 2.0;

  return (
    <svg
      className="arcweave-master-scene-svg"
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

        {/* 14 Authentic Hand-Drawn Flags in the Illustration Artwork (exact 1px past pole) */}
        <clipPath id="authentic-flags-clip">
          {/* 1. West Watchtower Roof Flag (pole at 427) */}
          <rect x="429" y="276" width="32" height="20" />
          {/* 2. East Watchtower Roof Flag (pole at 960) */}
          <rect x="962" y="291" width="32" height="20" />
          {/* 3. Castle High Left Spire - Sun Circle (pole at 602) */}
          <rect x="604" y="153" width="33" height="22" />
          {/* 4. Castle High Right Spire - Silver Sigil (pole at 775) */}
          <rect x="777" y="153" width="33" height="22" />
          {/* 5. Castle Mid-Left Conical Tower Flag (pole at 557) */}
          <rect x="559" y="214" width="26" height="18" />
          {/* 6. Castle Mid-Right Conical Tower Flag (pole at 819) */}
          <rect x="821" y="215" width="26" height="18" />
          {/* 7. Castle Outer West Wall Turret Flag (pole at 526) */}
          <rect x="528" y="307" width="24" height="15" />
          {/* 8. Castle Outer East Wall Turret Flag (pole at 850) */}
          <rect x="852" y="307" width="24" height="15" />
          {/* 9. Castle Inner Keep Crimson Streamer Left (pole at 627) */}
          <rect x="629" y="264" width="25" height="15" />
          {/* 10. Castle Inner Keep Crimson Streamer Right (pole at 749) */}
          <rect x="751" y="264" width="25" height="15" />
          {/* 11. Causeway Front Left Parapet Post Flag (pole at 538) */}
          <rect x="541" y="474" width="42" height="28" />
          {/* 12. Causeway Front Right Parapet Post Flag - Sun Sigil (pole at 831) */}
          <rect x="835" y="459" width="54" height="30" />
          {/* 13. Causeway Gatehouse-Approach Left Flag (pole at 631) */}
          <rect x="633" y="440" width="23" height="17" />
          {/* 14. Causeway Gatehouse-Approach Right Flag (pole at 734) */}
          <rect x="736" y="440" width="23" height="17" />
        </clipPath>

        {/* Arcweave Celestial Violet & Amethyst Energy Glow Gradient */}
        <radialGradient id="core-energy-glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="30%" stopColor="#c4b5fd" stopOpacity="0.8" />
          <stop offset="65%" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Base Pristine Illustration Artwork (Clean sky for moving clouds and energy core) */}
      <image
        href="/rimeguard_fortress_scene_cleansky.jpg"
        x="0"
        y="0"
        width="1376"
        height="768"
        preserveAspectRatio="none"
        className="arcweave-scene-artwork"
      />

      {/* 2. Authentic Hand-Drawn Flags in Living Transverse Wind Motion */}
      <g clipPath="url(#authentic-flags-clip)">
        <image
          href="/rimeguard_fortress_scene.jpg"
          x="0"
          y="0"
          width="1376"
          height="768"
          preserveAspectRatio="none"
          filter="url(#wind-cloth-wave)"
          className="arcweave-scene-artwork"
        />
      </g>

      {/* 3. Floating Rotational Arcane Energy Core Crystal (Hovering above Central Spire) */}
      <g className="energy-core-crystal-group" transform="translate(688, 96)">
        {/* Pulsing Luminous Violet Energy Aura */}
        <circle r="36" fill="url(#core-energy-glow-grad)" className="core-energy-aura-pulse" />

        {/* Vertical Energy Conduit Tether Connecting Spire Tip at (688, 143) to Core */}
        <line
          x1="0"
          y1="28"
          x2="0"
          y2="46"
          stroke="#c4b5fd"
          strokeWidth="1.8"
          strokeDasharray="3,3"
          className="core-energy-tether"
        />

        {/* Orbiting Concentric Crystalline Energy Rings */}
        <ellipse
          rx="38"
          ry="11"
          fill="none"
          stroke="#9b7bff"
          strokeWidth="1.2"
          opacity="0.65"
          className="core-orbital-ring-outer"
        />
        <ellipse
          rx="26"
          ry="8"
          fill="none"
          stroke="#c4b5fd"
          strokeWidth="1.4"
          opacity="0.85"
          className="core-orbital-ring-inner"
        />

        {/* Ambient Rising Arcane Starlight & Golden Sparks */}
        <circle cx="-14" cy="-8" r="1.5" fill="#ffcf70" opacity="0.85">
          <animate attributeName="cy" values="-8;-18;-8" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="4" r="1.3" fill="#e9d5ff" opacity="0.85">
          <animate attributeName="cy" values="4;-6;4" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="-6" cy="22" r="1.2" fill="#c4b5fd" opacity="0.75">
          <animate attributeName="cy" values="22;12;22" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="8" cy="20" r="1.4" fill="#ffcf70" opacity="0.8">
          <animate attributeName="cy" values="20;10;20" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.85;0.3" dur="2.2s" repeatCount="indefinite" />
        </circle>

        {/* Hand-Drawn Crystal Energy Core (3D Rotating with Arcweave Refraction) */}
        <image
          href="/crystal_core.png"
          x="-32"
          y="-36"
          width="64"
          height="71"
          className="rotating-crystal-image"
        />
      </g>
    </svg>
  );
}
