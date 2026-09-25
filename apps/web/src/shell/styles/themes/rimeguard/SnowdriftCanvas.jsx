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
    const MAX_SNOW = 110;
    const particles = new Array(MAX_SNOW);
    for (let i = 0; i < MAX_SNOW; i++) {
      particles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 1.2 + 0.5,
        speedX: Math.random() * 0.8 - 0.4,
        swaySpeed: Math.random() * 0.02 + 0.005,
        swayRange: Math.random() * 25 + 10,
        swayOffset: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.6 + 0.25,
      };
    }

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Render Snowdrift Particles
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < MAX_SNOW; i++) {
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

