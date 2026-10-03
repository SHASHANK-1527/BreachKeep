import React from 'react';
import './RimeguardAnimatedFlags.css';

/**
 * RimeguardAnimatedFlags
 * 
 * Living Floating Citadel of House Rimeguard:
 * - Ultra-wide framed floating ice fortress island with crystal spires, permafrost stone, and cherry blossoms
 * - preserveAspectRatio="xMidYMin slice" guarantees all spires and upper towers are 100% visible on widescreen monitors
 * - Weightless anti-gravity levitation drift for the floating island
 * - Shimmering glacial waterfall mist and spray particles tumbling into the cloud ocean
 */
export default function RimeguardAnimatedFlags() {
  // Glacial waterfall mist & spray particles aligned with the floating castle cascades
  const waterfallMistParticles = [
    // Left Main Glacial Falls (around x=385-435, y=595-750)
    { cx: 395, cy: 605, r: 1.8, dur: '2.5s', delay: '0s', dx: 3, dy: 140 },
    { cx: 410, cy: 625, r: 2.1, dur: '2.2s', delay: '0.4s', dx: 4, dy: 130 },
    { cx: 425, cy: 645, r: 1.7, dur: '2.6s', delay: '1.0s', dx: -3, dy: 115 },
    { cx: 435, cy: 665, r: 2.0, dur: '2.3s', delay: '0.3s', dx: 5, dy: 100 },
    { cx: 405, cy: 690, r: 2.2, dur: '2.0s', delay: '0.8s', dx: -4, dy: 80 },
    { cx: 420, cy: 715, r: 1.9, dur: '2.4s', delay: '1.3s', dx: 3, dy: 60 },

    // Secondary Chasm Falls (around x=560-580, y=620-750)
    { cx: 565, cy: 630, r: 1.6, dur: '2.2s', delay: '0.5s', dx: 2, dy: 110 },
    { cx: 575, cy: 665, r: 1.9, dur: '2.0s', delay: '0.9s', dx: -2, dy: 85 },
    { cx: 570, cy: 705, r: 1.7, dur: '2.4s', delay: '1.2s', dx: 1, dy: 55 }
  ];

  return (
    <svg
      className="rimeguard-master-scene-svg"
      viewBox="0 0 1376 768"
      preserveAspectRatio="xMidYMin slice"
      aria-label="Illustration of House Rimeguard Ice Themed Floating Citadel with Cherry Blossoms"
    >
      {/* ========================================================
          1. FLOATING CITADEL GROUP (WEIGHTLESS LEVITATION DRIFT)
          ======================================================== */}
      <g className="rimeguard-citadel-floating-group">
        {/* Base Master Artwork */}
        <image
          href="/rimeguard_citadel.webp"
          x="0"
          y="0"
          width="1376"
          height="768"
          preserveAspectRatio="none"
          className="rimeguard-clean-citadel-artwork"
        />

        {/* ========================================================
            2. GLACIAL WATERFALL MIST PARTICLES
            Streaming down from the floating rock cliffs into the clouds
            ======================================================== */}
        <g className="glacial-waterfall-particles-layer" pointerEvents="none">
          {waterfallMistParticles.map((p, idx) => (
            <circle
              key={`p-waterfall-${idx}`}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={idx % 2 === 0 ? '#ffffff' : '#bae6fd'}
              className="glacial-stream-particle"
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
