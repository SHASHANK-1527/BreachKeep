import React, { useState, useEffect } from 'react';

/**
 * VoltgridEnergyCore3D
 * 
 * 100% native vector SVG 3D engine calculating true 3D depth,
 * backface culling, dynamic Lambertian lighting, and depth sorting.
 * 
 * Geometry:
 * - Perfectly proportioned 3D diamond octahedron (balanced 1:1 aspect ratio)
 * - Pure vertical Y-axis stately rotation (upright orientation with zero skewed tilt)
 * - Counter-rotating inner magenta (#ff3cf0) data core
 * - 6 orbiting 3D satellite shards revolving in depth space
 * - Active neon data conduit tether directly to central spire tip at (688, 126)
 */

// Symmetrical 3D Octahedron Core (Balanced Diamond Ratio)
const R = 26.0;   // Equator radius (width 52px)
const H = 32.0;   // Apex height (total height 64px, balanced diamond)

const topApex = [0, -H, 0];
const botApex = [0, H, 0];

// 4 Equatorial Vertices (Equilateral Diamond Cross)
const eqPts = [
  [R, 0, 0],
  [0, 0, R],
  [-R, 0, 0],
  [0, 0, -R],
];

const allCorePts = [topApex, ...eqPts, botApex];

// 8 Symmetrical Triangular Diamond Faces
const coreFaces = [
  // 4 Top Pyramid Faces
  [0, 1, 2],
  [0, 2, 3],
  [0, 3, 4],
  [0, 4, 1],
  // 4 Bottom Pyramid Faces
  [5, 2, 1],
  [5, 3, 2],
  [5, 4, 3],
  [5, 1, 4],
];

// Inner Glowing Core (Hexagonal Bipyramid)
const inN = 6;
const inR = 12.0;
const inH = 15.0;
const inTop = [0, -inH, 0];
const inBot = [0, inH, 0];
const inEq = [];
for (let i = 0; i < inN; i++) {
  const a = (i * 2 * Math.PI) / inN;
  inEq.push([inR * Math.cos(a), 0, inR * Math.sin(a)]);
}
const inAllPts = [inTop, ...inEq, inBot];
const inFaces = [];
for (let i = 0; i < inN; i++) {
  inFaces.push([0, 1 + i, 1 + ((i + 1) % inN)]);
  inFaces.push([inN + 1, 1 + ((i + 1) % inN), 1 + i]);
}

// 6 Satellite Orbiting Shards
const shardConfigs = [
  { r: 42.0, y: -2.0, s: 1.0, phase: 0.0, tilt: 0.15 },
  { r: 42.0, y: -2.0, s: 1.0, phase: Math.PI, tilt: -0.15 },
  { r: 36.0, y: 16.0, s: 0.85, phase: 0.6 * Math.PI, tilt: 0.12 },
  { r: 36.0, y: 16.0, s: 0.85, phase: 1.6 * Math.PI, tilt: -0.12 },
  { r: 32.0, y: -18.0, s: 0.75, phase: 0.3 * Math.PI, tilt: 0.2 },
  { r: 32.0, y: 20.0, s: 0.75, phase: 1.3 * Math.PI, tilt: -0.2 },
];

const shardFaces = [
  [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
  [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
];

// Directional light vector from top-left front (clean specular)
const lx = -0.45;
const ly = -0.55;
const lz = 0.70;

export default function VoltgridEnergyCore3D({ cx = 688, baseCy = 86 }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animId;
    let lastNow = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastNow) / 1000, 0.1);
      lastNow = now;
      setTime((t) => t + dt);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // --- 60fps 3D Geometry Calculation ---
  // Gentle levitation floating drift (stays centered)
  const levY = Math.sin(time * 0.9) * 3.0;
  const currentCy = baseCy + levY;

  // Stately, hypnotic rotation around vertical axis (tiltX = 0 for perfect upright orientation)
  const angle = time * 0.72;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // Pure vertical orientation matrix (zero skew/tilt)
  const xform = (p, c = cosA, s = sinA) => {
    const rx = p[0] * c + p[2] * s;
    const rz = -p[0] * s + p[2] * c;
    const ry = p[1];
    return [rx, ry, rz];
  };

  const polys = [];

  // 1. Inner Kernel (Counter-rotating Magenta Core)
  const inAng = -angle * 0.75;
  const inCa = Math.cos(inAng);
  const inSa = Math.sin(inAng);
  const tIn = inAllPts.map((p) => xform(p, inCa, inSa));
  for (let i = 0; i < inFaces.length; i++) {
    const f = inFaces[i];
    const p0 = tIn[f[0]];
    const p1 = tIn[f[1]];
    const p2 = tIn[f[2]];
    const ax = p1[0] - p0[0], ay = p1[1] - p0[1];
    const bx = p2[0] - p0[0], by = p2[1] - p0[1];
    const nz = ax * by - ay * bx;
    if (nz > 0) {
      const avgZ = (p0[2] + p1[2] + p2[2]) / 3.0;
      const ptsStr = `${(cx + p0[0]).toFixed(1)},${(currentCy + p0[1]).toFixed(1)} ${(cx + p1[0]).toFixed(1)},${(currentCy + p1[1]).toFixed(1)} ${(cx + p2[0]).toFixed(1)},${(currentCy + p2[1]).toFixed(1)}`;
      polys.push({
        id: `in-${i}`,
        z: avgZ - 2.0,
        points: ptsStr,
        fill: 'rgba(255, 60, 240, 0.85)',
        stroke: 'rgba(255, 255, 255, 0.75)',
        strokeW: 1.0,
      });
    }
  }

  // 2. Primary 3D Diamond Octahedron Facets
  const tCore = allCorePts.map((p) => xform(p));
  for (let i = 0; i < coreFaces.length; i++) {
    const f = coreFaces[i];
    const p0 = tCore[f[0]];
    const p1 = tCore[f[1]];
    const p2 = tCore[f[2]];
    const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
    const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    if (nz > 0) {
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const dot = Math.max(0, (nx * lx + ny * ly + nz * lz) / nl);

      let col = 'rgba(41, 230, 201, 0.88)';
      if (dot > 0.72) col = 'rgba(255, 255, 255, 0.96)';
      else if (dot > 0.48) col = 'rgba(216, 245, 240, 0.92)';
      else if (dot > 0.28) col = 'rgba(41, 230, 201, 0.85)';
      else col = 'rgba(15, 118, 110, 0.88)';

      const avgZ = (p0[2] + p1[2] + p2[2]) / 3.0;
      const ptsStr = `${(cx + p0[0]).toFixed(1)},${(currentCy + p0[1]).toFixed(1)} ${(cx + p1[0]).toFixed(1)},${(currentCy + p1[1]).toFixed(1)} ${(cx + p2[0]).toFixed(1)},${(currentCy + p2[1]).toFixed(1)}`;
      polys.push({
        id: `core-${i}`,
        z: avgZ,
        points: ptsStr,
        fill: col,
        stroke: 'rgba(5, 6, 8, 0.92)',
        strokeW: 1.4,
      });
    }
  }

  // 3. Orbiting Satellite Shards
  for (let sIdx = 0; sIdx < shardConfigs.length; sIdx++) {
    const sc = shardConfigs[sIdx];
    const sAngle = angle + sc.phase;
    const sCx = sc.r * Math.cos(sAngle);
    const sCz = sc.r * Math.sin(sAngle);
    const sCy = sc.y;
    const sScale = sc.s;
    const shH = 9.0 * sScale;
    const shW = 4.0 * sScale;

    const cTz = Math.cos(sc.tilt);
    const sTz = Math.sin(sc.tilt);

    const sLocal = [
      [0, -shH, 0],
      [shW, 0, 0], [0, 0, shW], [-shW, 0, 0], [0, 0, -shW],
      [0, shH, 0]
    ];

    const sTrans = sLocal.map((lp) => {
      const lxT = lp[0] * cTz - lp[1] * sTz;
      const lyT = lp[0] * sTz + lp[1] * cTz;
      const rx = lxT + sCx;
      const ry = lyT + sCy;
      const rz = lp[2] + sCz;
      return [rx, ry, rz];
    });

    for (let fIdx = 0; fIdx < shardFaces.length; fIdx++) {
      const f = shardFaces[fIdx];
      const p0 = sTrans[f[0]];
      const p1 = sTrans[f[1]];
      const p2 = sTrans[f[2]];
      const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
      const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;
      if (nz > 0) {
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        const dot = Math.max(0, (nx * lx + ny * ly + nz * lz) / nl);
        const isMagenta = sIdx % 2 === 1;
        let col = isMagenta ? 'rgba(255, 60, 240, 0.88)' : 'rgba(41, 230, 201, 0.90)';
        if (dot > 0.65) col = 'rgba(255, 255, 255, 0.96)';
        else if (dot > 0.35) col = isMagenta ? 'rgba(255, 130, 245, 0.92)' : 'rgba(216, 245, 240, 0.92)';

        const avgZ = (p0[2] + p1[2] + p2[2]) / 3.0;
        const ptsStr = `${(cx + p0[0]).toFixed(1)},${(currentCy + p0[1]).toFixed(1)} ${(cx + p1[0]).toFixed(1)},${(currentCy + p1[1]).toFixed(1)} ${(cx + p2[0]).toFixed(1)},${(currentCy + p2[1]).toFixed(1)}`;
        polys.push({
          id: `shard-${sIdx}-${fIdx}`,
          z: avgZ,
          points: ptsStr,
          fill: col,
          stroke: 'rgba(5, 6, 8, 0.90)',
          strokeW: 1.2,
        });
      }
    }
  }

  // Painter's algorithm sort
  polys.sort((a, b) => a.z - b.z);

  // FX animations
  const auraPulse = Math.sin(time * 1.6) * 0.15 + 0.85;
  const tetherPulse = Math.sin(time * 2.8) * 0.25 + 0.75;
  const crystalBottomY = currentCy + H;
  const spireTipY = 126;

  return (
    <g className="voltgrid-3d-energy-core" pointerEvents="none">
      {/* 1. Neon Radial Aura Glow (Centered at cx, currentCy) */}
      <circle
        cx={cx}
        cy={currentCy}
        r={54 * auraPulse}
        fill="url(#core-energy-glow-grad)"
        opacity="0.85"
      />

      {/* 2. Vertical Data Tether Line to Central Spire Tip at (688, 126) */}
      {spireTipY > crystalBottomY && (
        <g>
          <line
            x1={cx}
            y1={crystalBottomY}
            x2={cx}
            y2={spireTipY}
            stroke="#29e6c9"
            strokeWidth="1.8"
            strokeDasharray="4,3"
            opacity={0.75 * tetherPulse}
          />
          <line
            x1={cx}
            y1={crystalBottomY}
            x2={cx}
            y2={spireTipY}
            stroke="#ffffff"
            strokeWidth="1.0"
            opacity={0.9 * tetherPulse}
          />
        </g>
      )}

      {/* 3. True 3D Depth-Sorted Facets */}
      {polys.map((poly) => (
        <polygon
          key={poly.id}
          points={poly.points}
          fill={poly.fill}
          stroke={poly.stroke}
          strokeWidth={poly.strokeW}
          strokeLinejoin="round"
        />
      ))}

      {/* 4. Ambient Rising Data Bits / Sparkles */}
      {[0, 1, 2, 3].map((i) => {
        const pPhase = (time * 0.45 + i * 0.25) % 1;
        const px = cx + Math.sin(time * 1.2 + i * 1.5) * (14 + i * 3);
        const py = currentCy + 24 - pPhase * 48;
        const pAlpha = Math.sin(pPhase * Math.PI) * 0.85;
        const isLit = i % 2 === 1;
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r="1.2"
            fill={isLit ? '#ff3cf0' : '#29e6c9'}
            opacity={pAlpha}
          />
        );
      })}
    </g>
  );
}
