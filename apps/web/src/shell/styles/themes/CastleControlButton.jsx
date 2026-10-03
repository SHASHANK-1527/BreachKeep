import React from 'react'
import { useCastle, CASTLE_THEMES } from '../../../app/CastleContext.jsx'

/**
 * CastleControlButton
 * Positioned in the bottom-left of the page.
 * Triggers entrance transition video, or returns to citadel exterior.
 */
export default function CastleControlButton({ house }) {
  const norm = (house || '').toLowerCase().trim()
  const {
    castleView,
    setCastleView,
    startTransition,
    isTransitioning,
  } = useCastle()

  if (!norm || !CASTLE_THEMES[norm]) return null

  const isGates = castleView === 'gates'

  return (
    <div className="bk-enter-castle-anchor" data-house={norm}>
      {!isGates ? (
        <button
          type="button"
          className="bk-enter-castle-btn"
          onClick={() => startTransition(norm)}
          disabled={isTransitioning}
          aria-label="Enter the Castle"
          title="Enter the Castle"
        >
          <span className="btn-glow-ring" aria-hidden="true" />
          <svg
            className="btn-castle-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            {/* Castle / Gateway icon */}
            <path d="M2 20h20v2H2v-2zm2-2V7l2.5 1.5L9 7v11H4zm7 0V3l2.5 1.5L16 3v15h-5zm7 0V7l2.5 1.5L22 7v11h-4zM6 14h2v2H6v-2zm7-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm7 0h2v2h-2v-2z" />
          </svg>
          <span className="btn-label">ENTER THE CASTLE</span>
        </button>
      ) : (
        <div className="bk-castle-actions-row">
          <button
            type="button"
            className="bk-enter-castle-btn bk-btn-exit"
            onClick={() => setCastleView('citadel')}
            aria-label="Exit to Courtyard"
            title="Return to Citadel Exterior"
          >
            <svg
              className="btn-castle-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="btn-label">EXIT CASTLE</span>
          </button>

          <button
            type="button"
            className="bk-enter-castle-btn bk-btn-replay"
            onClick={() => startTransition(norm)}
            disabled={isTransitioning}
            aria-label="Replay Entrance Transition"
            title="Replay Entrance Transition Video"
          >
            <svg
              className="btn-castle-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="btn-label">REPLAY</span>
          </button>
        </div>
      )}
    </div>
  )
}
