import React, { useEffect, useRef } from 'react';

export default function SnowdriftCanvas() {
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

    // Fixed Particle Pool (hub-shell guideline: fixed pool size, reuse items)
    const MAX_MOTES = 110;
    const particles = new Array(MAX_MOTES);
    const moteColors = [
      '#c4b5fd', // lavender violet
      '#9b7bff', // arcane purple
      '#ffffff', // celestial white
      '#e9d5ff', // pale amethyst
      '#ffcf70', // warm gold mote
    ];

    for (let i = 0; i < MAX_MOTES; i++) {
      particles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 0.9 + 0.35,
        speedX: Math.random() * 0.7 - 0.35,
        swaySpeed: Math.random() * 0.02 + 0.005,
        swayRange: Math.random() * 25 + 10,
        swayOffset: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.65 + 0.25,
        color: moteColors[i % moteColors.length],
      };
    }

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Render Arcweave Arcane Library Motes & Floating Grimoire Stardust
      for (let i = 0; i < MAX_MOTES; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += Math.sin(time * p.swaySpeed + p.swayOffset) * 0.5 + p.speedX;

        // Wrap around boundaries
        if (p.y > height) {
          p.y = -5;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    />
  );
}

