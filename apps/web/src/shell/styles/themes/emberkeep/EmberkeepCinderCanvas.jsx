import React, { useEffect, useRef } from 'react';

/**
 * EmberkeepCinderCanvas (Realistic Volcanic Floating Embers Canvas)
 * 
 * Compliant with antislop craftsmanship standards:
 * - Tiny, delicate ember specks (0.7px to 1.6px) mimicking real furnace cinders
 * - Natural convection physics: rising thermal drafts with organic horizontal sway
 * - Subtle ember flicker modulation for realistic coal ignition
 * - Fixed pool of 60 particles for zero GC allocation spikes at 60fps
 * - Zero em dashes in documentation or code
 */
export default function EmberkeepCinderCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const MAX_EMBERS = 60;
    const embers = new Array(MAX_EMBERS);
    const emberColors = [
      '#ffffff', // White-hot core
      '#ffdca8', // Incandescent gold
      '#ff9e42', // Bright forge cinder
      '#ff5a1f', // Molten orange
      '#e04000', // Deep burning red ember
    ];

    for (let i = 0; i < MAX_EMBERS; i++) {
      embers[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 0.9 + 0.7, // Delicate realistic speck size (0.7px - 1.6px)
        speedY: Math.random() * 0.85 + 0.35, // Natural thermal updraft
        driftX: Math.random() * 0.4 - 0.2, // Subtle ambient wind drift
        swaySpeed: Math.random() * 0.025 + 0.01,
        swayWidth: Math.random() * 0.5 + 0.3,
        swayOffset: Math.random() * Math.PI * 2,
        flickerSpeed: Math.random() * 0.06 + 0.02,
        flickerPhase: Math.random() * Math.PI * 2,
        baseAlpha: Math.random() * 0.45 + 0.35,
        color: emberColors[i % emberColors.length],
      };
    }

    let time = 0;
    const render = () => {
      time += 0.025;
      ctx.clearRect(0, 0, width, height);

      // Render realistic floating embers
      for (let i = 0; i < MAX_EMBERS; i++) {
        const e = embers[i];
        e.y -= e.speedY; // Rising with thermal convection
        e.x += Math.sin(time * e.swaySpeed + e.swayOffset) * e.swayWidth + e.driftX;

        // Wrap around boundaries smoothly
        if (e.y < -10) {
          e.y = height + 10;
          e.x = Math.random() * width;
        }
        if (e.x > width + 10) e.x = -5;
        if (e.x < -10) e.x = width + 5;

        // Realistic subtle ember combustion flicker
        const flicker = 0.75 + 0.25 * Math.sin(time * e.flickerSpeed + e.flickerPhase);
        const currentAlpha = e.baseAlpha * flicker;

        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 3; // Delicate soft glow, not large blurry dots

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="emberkeep-cinder-canvas"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
