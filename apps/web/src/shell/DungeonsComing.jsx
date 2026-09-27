import './styles/dungeons-coming.css'

const HOUSE_LINE = {
  arcweave: 'The archive stirs. Sealed tomes await their reader.',
  emberkeep: 'The forge is still cooling. Its trials are not yet struck.',
  rimeguard: 'The ice has not yet cracked. What sleeps beneath still sleeps.',
  voltgrid: 'The grid is charging. New sectors come online soon.',
}

/**
 * Centred "the dungeons are coming" placeholder shown on the house hub while
 * no chambers are live. Replaces the old broken stone-gate cards.
 */
export default function DungeonsComing({ house }) {
  const key = (house || '').toLowerCase()

  return (
    <div className="dc-wrap" role="status">
      <div className="dc-panel">
        <div className="dc-sigil" aria-hidden="true">
          <span className="dc-sigil-ring dc-ring-outer" />
          <span className="dc-sigil-ring dc-ring-inner" />
          <svg viewBox="0 0 64 64" className="dc-sigil-mark">
            <path d="M32 6 L54 17 V38 C54 50 32 58 32 58 C32 58 10 50 10 38 V17 Z" />
            <path d="M32 18 V46 M22 27 H42 M24 38 H40" className="dc-sigil-lines" />
          </svg>
        </div>

        <p className="dc-eyebrow">Sealed for now</p>
        <h2 className="dc-title">
          <span>The</span> <span>Dungeons</span> <span>Are</span> <span>Coming</span>
        </h2>

        <div className="dc-divider" aria-hidden="true">
          <span /><i>◆</i><span />
        </div>

        <p className="dc-sub">
          {HOUSE_LINE[key] || 'No chambers have opened yet.'}
        </p>
        <p className="dc-note">
          Your trials will appear here the moment the Warden unseals them.
        </p>

        <div className="dc-pulse" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}
