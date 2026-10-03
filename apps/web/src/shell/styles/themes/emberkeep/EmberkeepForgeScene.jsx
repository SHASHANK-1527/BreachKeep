import React from 'react';
import './EmberkeepForgeScene.css';

/**
 * EmberkeepForgeScene (Master Emberkeep Forge Citadel Scene Layer)
 * 
 * Clean, pristine volcanic forge citadel:
 * - High-definition 1376x768 artwork of House Emberkeep
 * - Pure unobstructed presentation: zero floating dots, zero glowing overlays
 * - Silky smooth, gentle volcanic floating movement
 * - Zero em dashes in documentation or code
 */
export default function EmberkeepForgeScene() {
  return (
    <svg
      className="emberkeep-master-scene-svg"
      viewBox="0 0 1376 768"
      preserveAspectRatio="xMidYMax slice"
      aria-label="Illustration of House Emberkeep Volcanic Forge Citadel"
    >
      {/* ========================================================
          EMBERKEEP CITADEL FLOATING GROUP
          Gentle, silky-smooth volcanic floating movement
          ======================================================== */}
      <g className="emberkeep-citadel-floating-group">
        <image
          href="/emberkeep_forge_citadel.webp"
          x="0"
          y="0"
          width="1376"
          height="768"
          preserveAspectRatio="none"
          className="emberkeep-clean-citadel-artwork"
        />
      </g>
    </svg>
  );
}
