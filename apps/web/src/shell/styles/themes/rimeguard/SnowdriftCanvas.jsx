import React, { useEffect, useRef } from 'react';

/**
 * SnowdriftCanvas
 * 60fps alpine snowdrift & vibrant cherry blossom petal canvas
 * for House Rimeguard's floating ice citadel.
 * Fixed particle pools ensure zero GC allocation spikes.
 */
export default function SnowdriftCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 1. Alpine Crystalline Snowflakes
    const MAX_SNOW = 65;
    const snowParticles = new Array(MAX_SNOW);
    for (let i = 0; i < MAX_SNOW; i++) {
      snowParticles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.6,
        speedY: Math.random() * 0.85 + 0.45,
        speedX: Math.random() * 0.5 - 0.25,
        swaySpeed: Math.random() * 0.015 + 0.005,
        swayOffset: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.5 + 0.25,
      };
    }

    // 2. Vibrant Sakura Blossom Petals
    const SAKURA_COLORS = [
      '#f472b6', // vivid sakura pink
      '#fb7185', // rich rose blossom
      '#fbcfe8', // soft spring petal
      '#fda4af', // warm sakura peach
      '#ffffff', // snow-dusted white petal
    ];
    const MAX_SAKURA = 55;
    const sakuraParticles = new Array(MAX_SAKURA);
    for (let i = 0; i < MAX_SAKURA; i++) {
      sakuraParticles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4.0 + 2.8,
        speedY: Math.random() * 0.7 + 0.4,
        speedX: Math.random() * 0.65 + 0.2, // wind drift to the right
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.022,
        flipSpeed: Math.random() * 0.02 + 0.01,
        flipOffset: Math.random() * Math.PI * 2,
        color: SAKURA_COLORS[i % SAKURA_COLORS.length],
        alpha: Math.random() * 0.45 + 0.3,
      };
    }

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Render Alpine Snowflakes
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < MAX_SNOW; i++) {
        const s = snowParticles[i];
        s.y += s.speedY;
        s.x += Math.sin(time * s.swaySpeed + s.swayOffset) * 0.4 + s.speedX;

        if (s.y > height) {
          s.y = -6;
          s.x = Math.random() * width;
        }
        if (s.x > width) s.x = 0;
        if (s.x < 0) s.x = width;

        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Fluttering Sakura Petals
      for (let i = 0; i < MAX_SAKURA; i++) {
        const p = sakuraParticles[i];
        p.y += p.speedY;
        p.x += Math.sin(time * 0.015 + p.flipOffset) * 0.5 + p.speedX;
        p.rotation += p.rotSpeed;

        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x > width + 10) p.x = -10;
        if (p.x < -10) p.x = width;

        const flip = Math.sin(time * p.flipSpeed + p.flipOffset);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(1, Math.max(0.15, Math.abs(flip)));
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.globalAlpha = 1.0;
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20,
      }}
      aria-hidden="true"
    />
  );
}
