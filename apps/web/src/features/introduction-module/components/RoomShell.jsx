import { Link } from 'react-router-dom';

/**
 * Shared shell for every room: case label, dialogue, "how this works" panel,
 * a hint button, and a header with a way out mid-challenge plus a reset.
 */
export default function RoomShell({
  caseLabel,
  title,
  subtitle,
  dialogue,
  mech,
  onHint,
  onReset,
  pageTitle,
  flag,
  flagShown,
  children,
}) {
  return (
    <div className="im-room-view">
      <div className="im-brief">
        <div className="im-case-tag">{caseLabel}</div>
        <h2 className="im-brief-title">{title}</h2>
        <div className="im-sub">{subtitle}</div>
        <div className="im-dialogue">{dialogue}</div>
        <div className="im-dialogue-mech">
          <span className="im-mech-label">How this works</span>
          {mech}
        </div>
        <button className="im-btn im-teal im-outline im-small im-hint-btn" onClick={onHint} type="button">
          Need a hint?
        </button>
      </div>
      <div className="im-stage">
        <div className="im-stage-head">
          <h1 className="im-stage-title">{pageTitle}</h1>
          <div className="im-actions">
            <Link className="im-btn im-ghost im-small" to="/dashboard/introduction">
              ← All challenges
            </Link>
            <button className="im-btn im-ghost im-small" onClick={onReset} type="button">
              Reset scene
            </button>
          </div>
        </div>
        {children}
        <div className={`im-flagbox ${flagShown ? 'im-show' : ''}`}>
          <span>{flag}</span>
          <Link className="im-btn im-small" to="/dashboard/introduction">
            Back to the case
          </Link>
        </div>
      </div>
    </div>
  );
}
