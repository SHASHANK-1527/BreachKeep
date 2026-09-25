import React, { useState, useEffect } from 'react';

/**
 * RimeguardEnergyCore3D
 * 
 * Authentic, multifaceted 3D ice crystal energy core rendered directly
 * as native SVG elements inside the master 1376x768 fortress scene.
 * 
 * Advantages over canvas / foreignObject:
 * - 100% native SVG vector rendering (zero foreignObject browser bugs)
 * - Infinite vector sharpness on Retina/4K displays (zero canvas blur)
 * - True 3D perspective rotation, backface culling, and depth sorting
 * - 6 orbiting 3D satellite crystalline shards revolving in real depth
 * - Inner glowing diamond core visible through faceted refraction
 * - Cel-shaded watercolor ice lighting & ink line borders matching the illustration
 * - Ethereal energy tether linking the hovering crystal to the castle spire tip at (688, 143)
 */

// --- 3D Geometry Constants ---
const N = 8;
const rEq = 23.0;
const hTop = 44.0;
const hBot = 42.0;

const topApex = [0, -hTop, 0];
const botApex = [0, hBot, 0];
const eqPts = [];
for (let i = 0; i < N; i++) {
  const a = (i * 2 * Math.PI) / N;
  eqPts.push([rEq * Math.cos(a), 0, rEq * Math.sin(a)]);
}
const allCorePts = [topApex, ...eqPts, botApex];

const coreFaces = [];
// 8 top pyramid faces
for (let i = 0; i < N; i++) {
  coreFaces.push([0, 1 + i, 1 + ((i + 1) % N)]);
}
// 8 bottom inverted pyramid faces
for (let i = 0; i < N; i++) {
  coreFaces.push([N + 1, 1 + ((i + 1) % N), 1 + i]);
}

// Inner Glowing Core (Hexagonal Bipyramid)
const inN = 6;
const inR = 11.0;
const inHt = 20.0;
const inHb = 19.0;
const inTop = [0, -inHt, 0];
const inBot = [0, inHb, 0];
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
  { r: 38.0, y: -4.0, s: 1.1, phase: 0.0, tilt: 0.25 },
  { r: 38.0, y: -4.0, s: 1.1, phase: Math.PI, tilt: -0.25 },
  { r: 33.0, y: 18.0, s: 0.9, phase: 0.6 * Math.PI, tilt: 0.15 },
  { r: 33.0, y: 18.0, s: 0.9, phase: 1.6 * Math.PI, tilt: -0.15 },
  { r: 28.0, y: -24.0, s: 0.7, phase: 0.3 * Math.PI, tilt: 0.3 },
  { r: 28.0, y: 25.0, s: 0.7, phase: 1.3 * Math.PI, tilt: -0.3 },
];

const shardFaces = [
  [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
  [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
];

// Directional light vector from top-left front
const lx = -0.38;
const ly = -0.62;
const lz = 0.69;

export default function RimeguardEnergyCore3D({ cx = 688, baseCy = 78 }) {
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
  // Levitation vertical floating drift
  const levY = Math.sin(time * 0.9) * 3.5;
  const currentCy = baseCy + levY;

  // 3D rotation angles
  const angle = time * 0.75; // stately, hypnotic rotation
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const tiltX = 0.11; // subtle downward tilt
  const cosT = Math.cos(tiltX);
  const sinT = Math.sin(tiltX);

  const xform = (p, c = cosA, s = sinA) => {
    const rx = p[0] * c + p[2] * s;
    const rz = -p[0] * s + p[2] * c;
    const ry = p[1] * cosT - rz * sinT;
    const rzF = p[1] * sinT + rz * cosT;
    return [rx, ry, rzF];
  };

  const polys = [];

  // 1. Inner Diamond Core (Counter-rotating)
  const inAng = -angle * 0.65;
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
        z: avgZ - 1.5,
        points: ptsStr,
        fill: 'rgba(255, 255, 255, 0.75)',
        stroke: 'rgba(125, 211, 252, 0.6)',
        strokeW: 1.0,
      });
    }
  }

  // 2. Primary Outer Crystal Core
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
      let col = 'rgba(56, 189, 248, 0.88)';
      if (dot > 0.75) col = 'rgba(255, 255, 255, 0.96)';
      else if (dot > 0.52) col = 'rgba(224, 242, 254, 0.94)';
      else if (dot > 0.32) col = 'rgba(186, 230, 253, 0.90)';
      else if (dot > 0.12) col = 'rgba(125, 211, 252, 0.88)';

      const avgZ = (p0[2] + p1[2] + p2[2]) / 3.0;
      const ptsStr = `${(cx + p0[0]).toFixed(1)},${(currentCy + p0[1]).toFixed(1)} ${(cx + p1[0]).toFixed(1)},${(currentCy + p1[1]).toFixed(1)} ${(cx + p2[0]).toFixed(1)},${(currentCy + p2[1]).toFixed(1)}`;
      polys.push({
        id: `core-${i}`,
        z: avgZ,
        points: ptsStr,
        fill: col,
        stroke: 'rgba(15, 38, 62, 0.92)', // crisp dark ink border
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
    const shH = 11.0 * sScale;
    const shW = 4.4 * sScale;

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
      const py = ry * cosT - rz * sinT;
      const pz = ry * sinT + rz * cosT;
      return [rx, py, pz];
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
        let col = 'rgba(125, 211, 252, 0.90)';
        if (dot > 0.65) col = 'rgba(255, 255, 255, 0.96)';
        else if (dot > 0.35) col = 'rgba(224, 242, 254, 0.94)';

        const avgZ = (p0[2] + p1[2] + p2[2]) / 3.0;
        const ptsStr = `${(cx + p0[0]).toFixed(1)},${(currentCy + p0[1]).toFixed(1)} ${(cx + p1[0]).toFixed(1)},${(currentCy + p1[1]).toFixed(1)} ${(cx + p2[0]).toFixed(1)},${(currentCy + p2[1]).toFixed(1)}`;
        polys.push({
          id: `shard-${sIdx}-${fIdx}`,
          z: avgZ,
          points: ptsStr,
          fill: col,
          stroke: 'rgba(15, 38, 62, 0.88)',
          strokeW: 1.2,
        });
      }
    }
  }

  // Sort back-to-front (Painter's algorithm for accurate depth)
  polys.sort((a, b) => a.z - b.z);

  // FX animations
  const auraPulse = Math.sin(time * 1.6) * 0.15 + 0.85;
  const tetherPulse = Math.sin(time * 2.8) * 0.25 + 0.75;
  const crystalBottomY = currentCy + hBot;
  const spireTipY = 143;

  return (
    <g className="rimeguard-3d-energy-core" pointerEvents="none">
      {/* 1. Soft Celestial Radial Aura */}
      <circle
        cx={cx}
        cy={currentCy}
        r={58 * auraPulse}
        fill="url(#core-energy-glow-grad)"
        opacity="0.85"
      />

      {/* 2. Vertical Magical Energy Tether to Spire Tip at (688, 143) */}
      {spireTipY > crystalBottomY && (
        <g>
          <line
            x1={cx}
            y1={crystalBottomY}
            x2={cx}
            y2={spireTipY}
            stroke="#7dd3fc"
            strokeWidth="1.8"
            strokeDasharray="3,3"
            opacity={0.6 * tetherPulse}
          />
          <line
            x1={cx}
            y1={crystalBottomY}
            x2={cx}
            y2={spireTipY}
            stroke="#ffffff"
            strokeWidth="1.0"
            opacity={0.85 * tetherPulse}
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

      {/* 4. Mystic Sparkles Rising into Core */}
      {[0, 1, 2, 3].map((i) => {
        const pPhase = (time * 0.4 + i * 0.25) % 1;
        const px = cx + Math.sin(time + i * 1.5) * (14 + i * 3);
        const py = currentCy + 28 - pPhase * 48;
        const pAlpha = Math.sin(pPhase * Math.PI) * 0.75;
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r="1.2"
            fill="#e0f2fe"
            opacity={pAlpha}
          />
        );
      })}
    </g>
  );
}
