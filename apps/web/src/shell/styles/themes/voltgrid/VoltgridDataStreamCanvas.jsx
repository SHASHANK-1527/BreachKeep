import React, { useEffect, useRef } from 'react';

export default function VoltgridDataStreamCanvas() {
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

    const MAX_STREAMS = 65;
    const particles = new Array(MAX_STREAMS);
    for (let i = 0; i < MAX_STREAMS; i++) {
      particles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        len: Math.random() * 18 + 8,
        speedY: Math.random() * 2.8 + 1.4,
        alpha: Math.random() * 0.35 + 0.15,
        lit: false,
        litTimer: 0,
        width: Math.random() > 0.85 ? 1.6 : 1.0,
      };
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let curX = mouseX;
    let curY = mouseY;
    let mouseActive = false;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseActive = true;

      for (let i = 0; i < MAX_STREAMS; i++) {
        const p = particles[i];
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        if (dx * dx + dy * dy < 4900) {
          p.lit = true;
          p.litTimer = 40;
        }
      }
    };

    const handleMouseDown = (e) => {
      for (let i = 0; i < MAX_STREAMS; i++) {
        const p = particles[i];
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        if (dx * dx + dy * dy < 22500) {
          p.lit = true;
          p.litTimer = 70;
          p.speedY = Math.random() * 5 + 4;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });

    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;

      for (let i = 0; i < MAX_STREAMS; i++) {
        const p = particles[i];

        if (p.lit) {
          p.litTimer--;
          if (p.litTimer <= 0) {
            p.lit = false;
            p.speedY = Math.random() * 2.8 + 1.4;
          }
        }

        p.y += p.speedY + (p.lit ? 3.5 : 0);

        if (p.y > height + 25) {
          p.y = -p.len - 10;
          p.x = Math.random() * width;
          p.lit = false;
        }

        ctx.strokeStyle = p.lit ? '#ffffff' : '#00e5ff';
        ctx.globalAlpha = p.lit ? Math.min(1, p.alpha * 1.8) : p.alpha;
        ctx.lineWidth = p.width;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.len);
        ctx.stroke();

        if (p.lit) {
          ctx.fillStyle = '#7df9ff';
          ctx.beginPath();
          ctx.arc(p.x, p.y + p.len, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (mouseActive) {
        ctx.globalAlpha = 0.7;
        const half = 7;

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.3;

        ctx.beginPath();
        ctx.moveTo(curX - half, curY - half + 4);
        ctx.lineTo(curX - half, curY - half);
        ctx.lineTo(curX - half + 4, curY - half);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(curX + half - 4, curY - half);
        ctx.lineTo(curX + half, curY - half);
        ctx.lineTo(curX + half, curY - half + 4);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(curX - half, curY + half - 4);
        ctx.lineTo(curX - half, curY + half);
        ctx.lineTo(curX - half + 4, curY + half);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(curX + half - 4, curY + half);
        ctx.lineTo(curX + half, curY + half);
        ctx.lineTo(curX + half, curY + half - 4);
        ctx.stroke();

        const pulse = Math.sin(tick * 0.08) * 0.3 + 1.2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(curX, curY, pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
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
