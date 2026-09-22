import { useEffect } from 'react'
import ParticleField from '../sanctum/ParticleField.jsx'
import { useSfx } from '../sanctum/useSfx.js'

// Phase B: triggers house assignment, plays a burst, reveals the house, then the
// Dashboard reloads into the themed hub after 5s (handled by onStart's caller).
export default function SortingCeremony({ house, onStart }) {
  const sfx = useSfx()
  useEffect(() => { onStart() }, []) // trigger assignment once
  useEffect(() => { if (house) sfx.chime() }, [house])
  return (
    <div className="sn-ceremony">
      <ParticleField mode="portal" />
      {!house ? (
        <h1 className="sn-ceremony-text">The keep is choosing your house…</h1>
      ) : (
        <div className="sn-ceremony-reveal" data-house={house}>
          <h1 className="sn-ceremony-house">{house.toUpperCase()}</h1>
          <p className="sn-sub">Your gates are opening…</p>
        </div>
      )}
    </div>
  )
}
