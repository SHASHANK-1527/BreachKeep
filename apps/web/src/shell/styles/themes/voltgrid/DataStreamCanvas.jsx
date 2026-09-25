import React, { useEffect, useRef } from 'react';

/**
 * DataStreamCanvas
 * Renders 60fps vertical "data-stream" line segments falling between cybercity structures,
 * strictly upholding House Voltgrid's identity from theme-voltgrid.
 * 
 * Features:
 * - Fixed particle pool (non-allocating animation loop)
 * - Vertical line segment geometry (rivers of light between buildings)
 * - Teal (#29e6c9) resting state with interactive magenta (#ff3cf0) data-burst acceleration
 * - Holographic drone / AI-guide inertial cursor tracking
 */
export default function DataStreamCanvas() {
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

    // Fixed Particle Pool (hub-shell performance rule: fixed size array, reuse slots)
    const MAX_STREAMS = 85;
    const particles = new Array(MAX_STREAMS);
    for (let i = 0; i < MAX_STREAMS; i++) {
      particles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        len: Math.random() * 16 + 8,
        speedY: Math.random() * 3.5 + 1.8,
        alpha: Math.random() * 0.55 + 0.2,
        lit: false,
        litTimer: 0,
        width: Math.random() > 0.85 ? 2.0 : 1.2,
      };
    }

    // Holographic AI-Guide Cursor Follower (Inertial Tracking)
    let mouseX = width / 2;
    let mouseY = height / 2;
    let curX = mouseX;
    let curY = mouseY;
    let mouseActive = false;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseActive = true;

      // Burst proximity particles into active magenta data state
      for (let i = 0; i < MAX_STREAMS; i++) {
        const p = particles[i];
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        if (dx * dx + dy * dy < 4900) { // within 70px
          p.lit = true;
          p.litTimer = 45;
        }
      }
    };

    const handleMouseDown = (e) => {
      // Click burst: radiate pulse to nearby streams
      for (let i = 0; i < MAX_STREAMS; i++) {
        const p = particles[i];
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        if (dx * dx + dy * dy < 22500) { // within 150px
          p.lit = true;
          p.litTimer = 75;
          p.speedY = Math.random() * 5 + 6;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });

    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Smooth inertia cursor interpolation
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;

      // Render Vertical Data Streams (Voltgrid's signature particle language)
      for (let i = 0; i < MAX_STREAMS; i++) {
        const p = particles[i];

        if (p.lit) {
          p.litTimer--;
          if (p.litTimer <= 0) {
            p.lit = false;
            p.speedY = Math.random() * 3.5 + 1.8;
          }
        }

        p.y += p.speedY + (p.lit ? 4.5 : 0);

        // Wrap around boundaries
        if (p.y > height + 25) {
          p.y = -p.len - 10;
          p.x = Math.random() * width;
          p.lit = false;
        }

        ctx.strokeStyle = p.lit ? '#ff3cf0' : '#29e6c9';
        ctx.globalAlpha = p.lit ? Math.min(1, p.alpha * 1.6) : p.alpha;
        ctx.lineWidth = p.width;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.len);
        ctx.stroke();

        // Subtle glowing head for lit/magenta packets
        if (p.lit) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y + p.len, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Holographic AI-Guide Companion Reticle (rounded-square hologram)
      if (mouseActive) {
        ctx.globalAlpha = 0.75;
        const boxSize = 14;
        const half = boxSize / 2;

        // Outer rounded reticle brackets
        ctx.strokeStyle = '#29e6c9';
        ctx.lineWidth = 1.4;

        // Corner 1: Top-Left
        ctx.beginPath();
        ctx.moveTo(curX - half, curY - half + 4);
        ctx.lineTo(curX - half, curY - half);
        ctx.lineTo(curX - half + 4, curY - half);
        ctx.stroke();

        // Corner 2: Top-Right
        ctx.beginPath();
        ctx.moveTo(curX + half - 4, curY - half);
        ctx.lineTo(curX + half, curY - half);
        ctx.lineTo(curX + half, curY - half + 4);
        ctx.stroke();

        // Corner 3: Bottom-Left
        ctx.beginPath();
        ctx.moveTo(curX - half, curY + half - 4);
        ctx.lineTo(curX - half, curY + half);
        ctx.lineTo(curX - half + 4, curY + half);
        ctx.stroke();

        // Corner 4: Bottom-Right
        ctx.beginPath();
        ctx.moveTo(curX + half - 4, curY + half);
        ctx.lineTo(curX + half, curY + half);
        ctx.lineTo(curX + half, curY + half - 4);
        ctx.stroke();

        // Central pulsing AI node
        const pulse = Math.sin(tick * 0.08) * 0.5 + 1.2;
        ctx.fillStyle = '#ff3cf0';
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
    />
  );
}
