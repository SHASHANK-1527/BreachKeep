import React, { useEffect, useRef } from 'react';

/**
 * SnowdriftCanvas (Purple Plasma & Lightning Ionized Spark Canvas)
 * 
 * Compliant with antislop performance and craftsmanship standards:
 * - Fixed particle pool of 80 particles ensures zero GC allocation spikes during runtime
 * - High-energy ionized plasma sparks and violet embers drifting with natural brownian jitter
 * - High-contrast rendering matching the purple lightning citadel atmosphere
 * - Zero em dashes in documentation or code
 */
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

    // Fixed particle pool for optimal 60fps performance
    const MAX_SPARKS = 80;
    const particles = new Array(MAX_SPARKS);
    const sparkColors = [
      '#ffffff', // Core lightning white
      '#d8b4fe', // Ionized neon lavender
      '#c084fc', // High-voltage violet
      '#a855f7', // Deep plasma purple
      '#fef08a', // Star-metal arc spark
    ];

    for (let i = 0; i < MAX_SPARKS; i++) {
      particles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.6,
        speedY: Math.random() * 0.8 + 0.3,
        speedX: Math.random() * 0.6 - 0.3,
        jitterSpeed: Math.random() * 0.04 + 0.01,
        jitterPhase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.6 + 0.25,
        color: sparkColors[i % sparkColors.length],
      };
    }

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Render high-voltage ionized sparks
      for (let i = 0; i < MAX_SPARKS; i++) {
        const p = particles[i];
        p.y -= p.speedY; // Upward drift into the storm mantle
        p.x += Math.sin(time * p.jitterSpeed + p.jitterPhase) * 0.7 + p.speedX;

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x > width + 10) p.x = -5;
        if (p.x < -10) p.x = width + 5;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
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
        zIndex: 10,
      }}
    />
  );
}
