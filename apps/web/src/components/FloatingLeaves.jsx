import { useEffect, useState } from 'react'

export default function FloatingLeaves({ count = 18 }) {
  const [leaves, setLeaves] = useState([])

  useEffect(() => {
    const items = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * (100 / count)) + (Math.random() * 8 - 4)}%`,
      delay: `${(Math.random() * 9).toFixed(1)}s`,
      duration: `${(8.5 + Math.random() * 6).toFixed(1)}s`,
      size: `${14 + Math.floor(Math.random() * 12)}px`,
      isAlt: i % 2 === 1,
      opacity: (0.75 + Math.random() * 0.25).toFixed(2),
      char: Math.random() > 0.35 ? '🍁' : '🍂',
    }))
    setLeaves(items)
  }, [count])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 12 }}>
      {leaves.map((leaf) => (
        <span
          key={leaf.id}
          className={`bk-floating-leaf ${leaf.isAlt ? 'bk-leaf-alt' : ''}`}
          style={{
            left: leaf.left,
            fontSize: leaf.size,
            animationDuration: leaf.duration,
            animationDelay: leaf.delay,
            filter: 'drop-shadow(0 2px 6px rgba(185, 28, 28, 0.45)) drop-shadow(0 0 10px rgba(220, 38, 38, 0.3))',
          }}
          aria-hidden="true"
        >
          {leaf.char}
        </span>
      ))}
    </div>
  )
}
