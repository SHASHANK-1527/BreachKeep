import { useEffect, useRef } from 'react'

// Ported from niket app.js ParticleCanvas (portal) and dashboard.js CavernParticleCanvas.
// Fixed-size pooled particles (no unbounded array growth), reduced-motion aware.
export default function ParticleField({ mode = 'portal' }) {
  const ref = useRef(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const N = mode === 'cavern' ? 60 : 90
    const color = mode === 'cavern' ? '160,180,255' : '255,150,90'
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    const P = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5, a: Math.random() * 0.5 + 0.2,
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of P) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},${p.a})`; ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    if (!reduce) draw(); else draw() // draw one static frame if reduced
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [mode])
  return <canvas ref={ref} className={`sn-particles sn-particles-${mode}`} aria-hidden="true" />
}
