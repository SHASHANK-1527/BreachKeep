import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../app/api.js';
import { reportComplete } from '../reportComplete.js';

/**
 * Shared shell for every room: case label, dialogue, "how this works" panel,
 * a hint button, and a header with a way out mid-challenge plus a reset.
 *
 * The flag panel is no longer a printed string. When a scene sets `solved`, the
 * shell asks the API for *this student's* flag for `roomId` - an HMAC of
 * (userId, roomId), so no two students get the same one and a flag read off a
 * neighbour's screen is rejected. The student then submits it back through
 * /api/flags/submit, and only a correct server-side match records the scene as
 * cleared. Nothing here decides whether the answer was right; the server does.
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
  roomId,
  solved,
  resetKey,
  children,
}) {
  const [flag, setFlag] = useState('');
  const [flagError, setFlagError] = useState('');
  const [entry, setEntry] = useState('');
  const [verdict, setVerdict] = useState(null); // 'correct' | 'wrong' | 'error'
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  // Fetch the student's own flag the first time the scene reports solved.
  useEffect(() => {
    if (!solved || !roomId || flag) return;
    let live = true;
    setFlagError('');
    api
      .get(`/flags/for-room/${roomId}`)
      .then((res) => {
        if (!live) return;
        if (res?.flag) setFlag(res.flag);
        else setFlagError('The keep did not return a flag for this scene.');
      })
      .catch((err) => {
        if (!live) return;
        setFlagError(
          err?.status === 401
            ? 'Your session expired — sign in again to claim this flag.'
            : 'Could not reach the keep to claim your flag. Try again in a moment.',
        );
      });
    return () => {
      live = false;
    };
  }, [solved, roomId, flag]);

  // A scene reset clears the panel too, so "Reset scene" really does start over.
  useEffect(() => {
    setFlag('');
    setFlagError('');
    setEntry('');
    setVerdict(null);
    setBusy(false);
  }, [resetKey]);

  const submit = useCallback(async () => {
    const candidate = entry.trim();
    if (!candidate || busy) return;
    setBusy(true);
    setVerdict(null);
    try {
      const res = await api.post('/flags/submit', { roomId, flag: candidate });
      if (res?.correct) {
        setVerdict('correct');
        // The server already recorded it; this keeps the quest map in step.
        reportComplete(roomId);
      } else {
        setVerdict('wrong');
      }
    } catch {
      setVerdict('error');
    } finally {
      setBusy(false);
    }
  }, [entry, busy, roomId]);

  const useIssuedFlag = useCallback(() => {
    if (!flag) return;
    setEntry(flag);
    setVerdict(null);
    inputRef.current?.focus();
  }, [flag]);

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
              &larr; All challenges
            </Link>
            <button className="im-btn im-ghost im-small" onClick={onReset} type="button">
              Reset scene
            </button>
          </div>
        </div>
        {children}

        <div className={`im-flagbox ${solved ? 'im-show' : ''}`}>
          <div className="im-flag-head">
            <span className="im-flag-label">Your flag for this scene</span>
            <span className="im-flag-note">
              Issued to your account only &mdash; a classmate&rsquo;s flag will not validate.
            </span>
          </div>

          <div className="im-flag-value">
            {flag ? (
              <>
                <code className="im-flag-code">{flag}</code>
                <button className="im-btn im-ghost im-small" type="button" onClick={useIssuedFlag}>
                  Use it
                </button>
              </>
            ) : flagError ? (
              <span className="im-flag-no">{flagError}</span>
            ) : (
              <span className="im-flag-pending">Claiming your flag&hellip;</span>
            )}
          </div>

          <form
            className="im-flag-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              ref={inputRef}
              className="im-flag-input"
              placeholder="BK{...}"
              value={entry}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => {
                setEntry(e.target.value);
                setVerdict(null);
              }}
              aria-label="Submit the flag for this scene"
            />
            <button className="im-btn im-small" type="submit" disabled={busy || !entry.trim()}>
              {busy ? 'Checking…' : 'Submit flag'}
            </button>
          </form>

          <div className="im-flag-verdict" role="status" aria-live="polite">
            {verdict === 'correct' && (
              <span className="im-flag-ok">Scene cleared &mdash; recorded against your account.</span>
            )}
            {verdict === 'wrong' && (
              <span className="im-flag-no">
                Not a match. Submit the flag issued above, exactly as shown.
              </span>
            )}
            {verdict === 'error' && (
              <span className="im-flag-no">The keep did not answer. Try that again.</span>
            )}
          </div>

          <div className="im-flag-foot">
            <Link className="im-btn im-small im-ghost" to="/dashboard/introduction">
              Back to the case
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
