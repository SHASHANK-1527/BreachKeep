import React from 'react';
import './VoltgridCitadelScene.css';

export default function VoltgridCitadelScene() {
  const causewayLights = [
    { cx: 395, cy: 730 },
    { cx: 450, cy: 685 },
    { cx: 505, cy: 640 },
    { cx: 560, cy: 595 },
    { cx: 615, cy: 550 },
    { cx: 670, cy: 505 },
    { cx: 725, cy: 460 }
  ];

  return (
    <svg
      className="voltgrid-master-scene-svg"
      viewBox="0 0 1376 768"
      preserveAspectRatio="xMidYMax slice"
      aria-label="Illustration of House Voltgrid Electric Citadel"
    >
      <defs>

        {/* High-Voltage Arc Bloom Filter */}
        <filter id="electric-arc-bloom" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="voltgrid-citadel-floating-group">
        {/* Master Electric Citadel Artwork */}
        <image
          href="/voltgrid_grid_citadel.webp"
          x="0"
          y="0"
          width="1376"
          height="768"
          preserveAspectRatio="none"
          className="voltgrid-clean-citadel-artwork"
        />

        {/* Subtle Sky Ambient Flash */}
        <rect
          x="0"
          y="0"
          width="1376"
          height="450"
          fill="#00e5ff"
          className="sky-electric-ambient-flash"
          pointerEvents="none"
        />

        {/* Realistic High-Voltage Insulator Arcs & Cloud Discharges */}
        <g className="electric-discharges-layer" pointerEvents="none">
          {/* Right Foreground Tower Insulator Bushing Sparks (1110, 220) */}
          <path
            d="M1095,230 L1104,222 L1112,228 L1122,218 L1130,224"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="miter"
            className="electric-arc-path arc-right-insulator"
            filter="url(#electric-arc-bloom)"
          />
          <path
            d="M1105,224 L1114,215 L1120,222"
            fill="none"
            stroke="#7df9ff"
            strokeWidth="1.2"
            className="electric-arc-path arc-right-insulator"
          />

          {/* Right Tower Lower Capacitor Arc (1148, 490) */}
          <path
            d="M1142,485 L1148,495 L1154,490 L1158,505"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            className="electric-arc-path arc-right-insulator"
            filter="url(#electric-arc-bloom)"
          />

          {/* Left Tower Transformer Head Arc (210, 275) */}
          <path
            d="M198,285 L208,276 L214,282 L225,272"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            className="electric-arc-path arc-left-insulator"
            filter="url(#electric-arc-bloom)"
          />

          {/* Distant Cloud Storm Lightning (310, 270) */}
          <path
            d="M312,240 L318,265 L314,275 L324,295 L320,305 L328,320"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.0"
            className="electric-arc-path arc-distant-cloud"
            filter="url(#electric-arc-bloom)"
          />
          <path
            d="M318,265 L328,272 L334,285"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1.2"
            className="electric-arc-path arc-distant-cloud"
          />

          {/* Central Conduit Current Pulses */}
          <path
            d="M390,735 L560,595 L755,425"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1.8"
            strokeDasharray="8,6"
            className="grid-conduit-pulse"
          />
        </g>


        {/* Causeway Catwalk Guidance Lights */}
        <g className="causeway-lights-group" pointerEvents="none">
          {causewayLights.map((pt, i) => (
            <circle
              key={`light-${i}`}
              cx={pt.cx}
              cy={pt.cy}
              r="1.6"
              fill="#00e5ff"
              className="causeway-light-point"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
