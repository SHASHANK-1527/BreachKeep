import React from 'react';
import './ArcweaveAnimatedFlags.css';

/**
 * ArcweaveAnimatedFlags (Master Purple Lightning & Plasma Citadel Scene)
 * 
 * Living background illustration of House Arcweave:
 * - High-definition 1376x768 citadel artwork
 * - Choreographed atmospheric purple lightning strikes and sky ambient flashes
 * - Floating plasma singularity with concentric magnetic confinement rings
 * - High-energy ionized plasma cascades tumbling over castle cliffs
 * - Weightless floating anti-gravity oscillation
 * - Zero em dashes in documentation or code
 */
export default function ArcweaveAnimatedFlags() {
  // Electrical waterfall particle streams
  const plasmaCascadeParticles = [
    { cx: 388, cy: 615, r: 1.8, dur: '2.4s', delay: '0s', dx: 6, dy: 140 },
    { cx: 402, cy: 605, r: 2.1, dur: '2.1s', delay: '0.5s', dx: 4, dy: 155 },
    { cx: 415, cy: 618, r: 1.6, dur: '2.6s', delay: '1.1s', dx: -5, dy: 145 },
    { cx: 428, cy: 625, r: 2.0, dur: '2.3s', delay: '0.3s', dx: 8, dy: 135 },
    { cx: 395, cy: 660, r: 2.2, dur: '2.0s', delay: '0.8s', dx: -4, dy: 105 },
    { cx: 412, cy: 670, r: 1.7, dur: '2.5s', delay: '1.4s', dx: 6, dy: 95 },
    { cx: 846, cy: 725, r: 1.6, dur: '2.2s', delay: '0.4s', dx: 2, dy: 45 },
    { cx: 852, cy: 735, r: 1.9, dur: '2.0s', delay: '0.9s', dx: -3, dy: 35 }
  ];

  return (
    <svg
      className="arcweave-master-scene-svg"
      viewBox="0 0 1376 768"
      preserveAspectRatio="xMidYMax slice"
      aria-label="Illustration of House Arcweave Lightning Citadel and Plasma Sanctums"
    >
      <defs>
        {/* Central Stabilized Plasma Singularity Gradient */}
        <radialGradient id="plasma-singularity-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="25%" stopColor="#f3e8ff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#c084fc" stopOpacity="0.8" />
          <stop offset="80%" stopColor="#a855f7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#581c87" stopOpacity="0" />
        </radialGradient>

        {/* Secondary Orb Glow Gradient */}
        <radialGradient id="plasma-secondary-orb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#d8b4fe" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#9333ea" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
        </radialGradient>

        {/* Lightning Contact Point Bloom Filter */}
        <filter id="plasma-glow-filter" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ========================================================
          1. CITADEL FLOATING BASE GROUP
          Pristine artwork of the purple lightning citadel
          ======================================================== */}
      <g className="arcweave-citadel-floating-group">
        <image
          href="/arcweave_lightning_citadel.jpg"
          x="0"
          y="0"
          width="1376"
          height="768"
          preserveAspectRatio="none"
          className="arcweave-clean-citadel-artwork"
        />

        {/* Sky Ambient Lightning Flash Wash */}
        <rect
          x="0"
          y="0"
          width="1376"
          height="450"
          fill="#c084fc"
          className="sky-lightning-ambient-flash"
          pointerEvents="none"
        />

        {/* ========================================================
            2. CHOREOGRAPHED ATMOSPHERIC PURPLE LIGHTNING STRIKES
            ======================================================== */}
        <g className="lightning-arcs-layer" pointerEvents="none">
          {/* Main Strike to Central Tesla Apex (638, 70) */}
          <path
            d="M615,0 L622,25 L618,35 L632,52 L628,58 L638,70"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinejoin="miter"
            className="lightning-bolt lightning-main-apex"
            filter="url(#plasma-glow-filter)"
          />
          <path
            d="M622,25 L640,32 L648,48"
            fill="none"
            stroke="#d8b4fe"
            strokeWidth="1.4"
            className="lightning-bolt lightning-main-apex-branch"
          />

          {/* Left Spire Strike (320, 260) */}
          <path
            d="M360,20 L350,75 L362,110 L342,160 L352,195 L330,230 L320,260"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinejoin="miter"
            className="lightning-bolt lightning-left-spire"
            filter="url(#plasma-glow-filter)"
          />

          {/* Right Floating Island Plasma Conduit Arc */}
          <path
            d="M740,240 Q715,260 670,265"
            fill="none"
            stroke="#c084fc"
            strokeWidth="2.2"
            strokeDasharray="6,4"
            className="plasma-conduit-arc-right"
          />

          {/* Left Floating Island Plasma Conduit Arc */}
          <path
            d="M480,290 Q515,310 560,312"
            fill="none"
            stroke="#c084fc"
            strokeWidth="2.2"
            strokeDasharray="6,4"
            className="plasma-conduit-arc-left"
          />
        </g>

        {/* ========================================================
            3. PLASMA SINGULARITY ORBS & MAGNETIC RINGS
            ======================================================== */}
        <g className="plasma-orbs-group" pointerEvents="none">
          {/* Central Master Plasma Singularity at (605, 462) */}
          <g transform="translate(605, 462)">
            <circle
              r="34"
              fill="url(#plasma-singularity-core)"
              className="singularity-pulsing-aura"
            />
            <ellipse
              rx="42"
              ry="14"
              fill="none"
              stroke="#c084fc"
              strokeWidth="1.2"
              strokeDasharray="5,6"
              className="singularity-magnetic-ring-1"
            />
            <ellipse
              rx="28"
              ry="10"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.0"
              strokeDasharray="4,4"
              className="singularity-magnetic-ring-2"
            />
            <circle cx="-6" cy="-4" r="1.5" fill="#ffffff" />
            <circle cx="8" cy="5" r="1.2" fill="#fef08a" />
          </g>

          {/* Secondary Plasma Orb Left at (504, 418) */}
          <g transform="translate(504, 418)">
            <circle r="22" fill="url(#plasma-secondary-orb)" className="satellite-plasma-pulse" />
            <ellipse
              rx="26"
              ry="9"
              fill="none"
              stroke="#d8b4fe"
              strokeWidth="0.9"
              strokeDasharray="4,5"
              className="singularity-magnetic-ring-1"
            />
          </g>

          {/* Secondary Plasma Orb Right at (718, 422) */}
          <g transform="translate(718, 422)">
            <circle r="22" fill="url(#plasma-secondary-orb)" className="satellite-plasma-pulse" />
            <ellipse
              rx="26"
              ry="9"
              fill="none"
              stroke="#d8b4fe"
              strokeWidth="0.9"
              strokeDasharray="4,5"
              className="singularity-magnetic-ring-2"
            />
          </g>
        </g>

        {/* ========================================================
            4. IONIZED PLASMA CASCADE PARTICLES
            ======================================================== */}
        <g className="plasma-cascades-layer" pointerEvents="none">
          {plasmaCascadeParticles.map((p, idx) => (
            <circle
              key={`p-casc-${idx}`}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={idx % 2 === 0 ? '#ffffff' : '#e9d5ff'}
              className="plasma-stream-particle"
              style={{
                animationDuration: p.dur,
                animationDelay: p.delay,
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`
              }}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
