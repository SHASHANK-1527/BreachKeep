import React, { useMemo } from 'react';

/**
 * Glowing golden dots (fireflies) that gently drift, wander, and pulse
 * throughout the enchanted forest trail, replacing harsh fire graphics
 * with a magical, serene atmosphere.
 */
export default function GoldenFireflies({ count = 32, className = '' }) {
  const fireflies = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      // Natural organic distribution across the map
      const left = Math.round(5 + Math.random() * 90);
      const top = Math.round(8 + Math.random() * 86);
      const size = (3 + Math.random() * 2.8).toFixed(1);
      const pulseDuration = (2.2 + Math.random() * 2.5).toFixed(1);
      const driftDuration = (6 + Math.random() * 8).toFixed(1);
      const delay = (Math.random() * 5).toFixed(1);

      return {
        id: i,
        left: `${left}%`,
        top: `${top}%`,
        size: `${size}px`,
        pulseDuration: `${pulseDuration}s`,
        driftDuration: `${driftDuration}s`,
        delay: `${delay}s`,
      };
    });
  }, [count]);

  return (
    <div className={`qm-fireflies-layer ${className}`} aria-hidden="true">
      {fireflies.map((f) => (
        <span
          key={f.id}
          className="qm-golden-firefly"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            animationDuration: `${f.driftDuration}, ${f.pulseDuration}`,
            animationDelay: `${f.delay}, ${f.delay}`,
          }}
        />
      ))}
    </div>
  );
}
