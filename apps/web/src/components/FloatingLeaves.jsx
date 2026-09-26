import { useEffect, useState } from 'react'

export default function FloatingLeaves({ count = 12 }) {
  const [leaves, setLeaves] = useState([])

  useEffect(() => {
    const items = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * (100 / count)) + (Math.random() * 8 - 4)}%`,
      delay: `${(Math.random() * 8).toFixed(1)}s`,
      duration: `${(8 + Math.random() * 7).toFixed(1)}s`,
      size: `${14 + Math.floor(Math.random() * 12)}px`,
      char: Math.random() > 0.4 ? '🍁' : '🍂',
    }))
    setLeaves(items)
  }, [count])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 12 }}>
      {leaves.map((leaf) => (
        <span
          key={leaf.id}
          className="bk-floating-leaf"
          style={{
            left: leaf.left,
            fontSize: leaf.size,
            animationDuration: leaf.duration,
            animationDelay: leaf.delay,
          }}
        >
          {leaf.char}
        </span>
      ))}
    </div>
  )
}
