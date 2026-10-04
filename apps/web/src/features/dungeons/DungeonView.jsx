import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../app/api.js'
import { getDungeon, tierUnlocks } from './index.js'
import { DOOR_ORDER, NUMERALS, dungeonMeta } from './hall/hallConfig.js'
import DungeonShell from './DungeonShell.jsx'
import './dungeons.css'

const TIER_ORDER = ['mandatory', 'medium', 'hard']

// /dungeons/:dungeonId            -> the room list behind the door
// /dungeons/:dungeonId/:roomId    -> one room (brief, machine, hints, flag)
// The room lives in the URL so refresh and the browser back button both work.
export default function DungeonView({ dungeonId }) {
  const nav = useNavigate()
  const params = useParams()
  const roomParam = (params['*'] || '').split('/')[0] || null
  const dungeon = getDungeon(dungeonId)
  const [solved, setSolved] = useState(() => new Set())
  const [live, setLive] = useState(null) // null = still checking
  const [loading, setLoading] = useState(true)

  const loadProgress = useCallback(async () => {
    try {
      const prog = await api.get('/progress')
      setSolved(new Set(prog?.solved || []))
      setLive((prog?.unlocked || []).includes(dungeonId))
    } catch {
      // Keep what we have; if we never heard back, let them browse — the
      // Connect button reports a sealed dungeon on its own.
      setLive((v) => (v === null ? true : v))
    } finally {
      setLoading(false)
    }
  }, [dungeonId])

  useEffect(() => { loadProgress() }, [loadProgress])

  const unlocks = useMemo(
    () => (dungeon ? tierUnlocks(dungeon, solved) : null),
    [dungeon, solved]
  )

  if (!dungeon) {
    return (
      <DungeonShell dungeonId={dungeonId}>
        <section className="bkd-sealed">
          <h1 className="bkd-title">No chambers here yet</h1>
          <p className="bkd-note">This dungeon has no rooms built yet.</p>
        </section>
      </DungeonShell>
    )
  }

  if (loading && live === null) {
    return (
      <DungeonShell dungeonId={dungeonId}>
        <div className="bkd-loading"><span className="bkd-spinner" aria-hidden="true" /> Opening the door…</div>
      </DungeonShell>
    )
  }

  if (live === false) {
    return (
      <DungeonShell dungeonId={dungeonId}>
        <SealedDoor dungeonId={dungeonId} onRetry={loadProgress} />
      </DungeonShell>
    )
  }

  const room = roomParam ? dungeon.roomById[roomParam] : null
  const roomOpen = room ? unlocks[room.tier] : false
  const goRoom = (id) => nav(`/dungeons/${dungeonId}/${id}`)
  const goList = () => nav(`/dungeons/${dungeonId}`)

  if (room && roomOpen) {
    return (
      <DungeonShell dungeonId={dungeonId}>
        <RoomView
          room={room}
          solved={solved.has(room.id)}
          onBack={goList}
          onSolved={() => { setSolved((s) => new Set(s).add(room.id)); loadProgress() }}
        />
      </DungeonShell>
    )
  }

  const idx = DOOR_ORDER.indexOf(dungeonId)
  const total = dungeon.rooms.length
  const cleared = dungeon.rooms.filter((r) => solved.has(r.id)).length

  return (
    <DungeonShell dungeonId={dungeonId}>
      <header className="bkd-head">
        <p className="bkd-eyebrow">Door {NUMERALS[idx] || ''} · {dungeonMeta(dungeonId).subject}</p>
        <h1 className="bkd-title">{dungeon.title}</h1>
        <p className="bkd-blurb">{dungeon.blurb}</p>
        <div className="bkd-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={cleared}>
          <div className="bkd-progress-bar"><span style={{ width: `${total ? (cleared / total) * 100 : 0}%` }} /></div>
          <span className="bkd-progress-label">{cleared} of {total} chambers cleared</span>
        </div>
        {roomParam && !roomOpen && (
          <p className="bkd-warn">That chamber is still locked — clear the rooms before it first.</p>
        )}
      </header>

      {TIER_ORDER.map((tier) => {
        const rooms = dungeon.rooms.filter((r) => r.tier === tier)
        if (rooms.length === 0) return null
        const meta = dungeon.tiers[tier]
        const open = unlocks[tier]
        const tierCleared = rooms.filter((r) => solved.has(r.id)).length
        return (
          <section key={tier} className={`bkd-tier is-${tier} ${open ? '' : 'is-locked'}`}>
            <div className="bkd-tier-head">
              <h2>{meta.label}</h2>
              <span className="bkd-tier-count">{tierCleared}/{rooms.length}</span>
              <span className="bkd-tier-note">{open ? meta.note : `🔒 ${meta.note}`}</span>
            </div>
            <div className="bkd-grid">
              {rooms.map((r, i) => {
                const done = solved.has(r.id)
                return (
                  <button
                    key={r.id}
                    className={`bkd-card ${done ? 'is-done' : ''} ${open ? '' : 'is-locked'}`}
                    onClick={() => open && goRoom(r.id)}
                    disabled={!open}
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    <span className="bkd-card-top">
                      <span className="bkd-num">{r.num}</span>
                      <span className="bkd-pill">{done ? '✓ Cleared' : open ? 'Enter' : '🔒 Locked'}</span>
                    </span>
                    <span className="bkd-card-title">{r.title}</span>
                    <span className="bkd-card-concept">{r.concept}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </DungeonShell>
  )
}

function SealedDoor({ dungeonId, onRetry }) {
  const meta = dungeonMeta(dungeonId)
  return (
    <section className="bkd-sealed">
      <span className="bkd-sealed-icon" aria-hidden="true">🔒</span>
      <h1 className="bkd-title">{meta.title} is sealed</h1>
      <p className="bkd-note">
        The Warden hasn’t unsealed this dungeon yet. It opens when your class reaches it.
      </p>
      <button className="bkd-btn bkd-btn-ghost" onClick={onRetry}>Check again</button>
    </section>
  )
}

function RoomView(props) {
  // Secure-coding rooms use an in-browser editor; everything else uses the
  // terminal/web-app "machine" panel.
  return props.room.editor ? <SecureEditorRoom {...props} /> : <MachineRoom {...props} />
}

// Shown in the new tab while the container boots, so the student sees
// something instead of a blank page (and the pop-up isn't blocked: the tab is
// opened synchronously inside the click, before the API call).
const BOOT_HTML = `<!doctype html><title>Booting your machine…</title>
<body style="margin:0;height:100vh;display:grid;place-items:center;background:#05070d;color:#7ee787;font:14px/1.6 ui-monospace,Menlo,monospace">
<div><div>[ breachkeep ] allocating a private container…</div><div style="opacity:.6">this tab becomes your terminal in a moment</div></div></body>`

const BOOT_STEPS = [
  'Forging your private container…',
  'Planting your personal flag…',
  'Binding the terminal…',
  'Opening the gate…',
]

function BootSequence() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, BOOT_STEPS.length - 1)), 1100)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="bkd-boot" role="status" aria-live="polite">
      <span className="bkd-spinner" aria-hidden="true" />
      <ol className="bkd-boot-steps">
        {BOOT_STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'is-done' : i === step ? 'is-now' : ''}>{s}</li>
        ))}
      </ol>
    </div>
  )
}

function MachineRoom({ room, solved, onBack, onSolved }) {
  const [revealed, setRevealed] = useState(0) // how many hints shown
  const [lab, setLab] = useState({ state: 'idle', url: '', appUrl: '', msg: '' })
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])

  const openTab = (url) => window.open(url, '_blank', 'noopener,noreferrer')

  const connect = useCallback(async () => {
    // Open the tab now, inside the click, so pop-up blockers allow it; point
    // it at the terminal once the API answers.
    let tab = null
    try {
      tab = window.open('', '_blank')
      if (tab) { tab.document.write(BOOT_HTML); tab.document.close() }
    } catch { /* blocked — we fall back to the buttons */ }

    setLab({ state: 'loading', url: '', appUrl: '', msg: '' })
    try {
      // Boots (or reuses) this student's container and returns the tokened
      // terminal URL (and, for web rooms, the web-app URL).
      const res = await api.post('/labs/open', { roomId: room.id })
      if (!res?.url) {
        if (tab) tab.close()
        if (mounted.current) setLab({ state: 'error', url: '', appUrl: '', msg: 'No terminal URL came back — try again.' })
        return
      }
      // For a web room, open the app tab; otherwise open the terminal tab.
      const first = room.app && res.appUrl ? res.appUrl : res.url
      let opened = false
      if (tab && !tab.closed) {
        try { tab.opener = null; tab.location.replace(first); opened = true } catch { /* ignore */ }
      }
      if (!opened) opened = !!openTab(first)
      if (mounted.current) setLab({ state: 'ready', url: res.url, appUrl: res.appUrl || '', msg: opened ? '' : 'popup-blocked' })
    } catch (e) {
      if (tab) tab.close()
      const code = e?.data?.error
      const msg =
        code === 'dungeon_not_live'
          ? 'This dungeon is not open yet — the Warden has to unseal it.'
          : code === 'lab_unavailable'
            ? 'The lab service could not start your machine. Give it a moment and retry.'
            : 'Could not start the machine. Try again shortly.'
      if (mounted.current) setLab({ state: 'error', url: '', appUrl: '', msg })
    }
  }, [room.id, room.app])

  const stop = useCallback(async () => {
    setLab((l) => ({ ...l, state: 'stopping' }))
    try { await api.post('/labs/stop', { roomId: room.id }) } catch { /* ignore */ }
    if (mounted.current) setLab({ state: 'idle', url: '', appUrl: '', msg: '' })
  }, [room.id])

  return (
    <div className="bkd-room">
      <button className="bkd-back" onClick={onBack}>← All rooms</button>

      <header className="bkd-room-head">
        <span className="bkd-num bkd-num-lg">{room.num}</span>
        <div>
          <h1 className="bkd-title">{room.title}</h1>
          <p className="bkd-tag">{room.tier.toUpperCase()} · {room.concept}</p>
        </div>
        {solved && <span className="bkd-done-badge">✓ Cleared</span>}
      </header>

      <div className="bkd-room-grid">
        <div className="bkd-room-main">
          <section className="bkd-panel">
            <h3>Brief</h3>
            <p>{room.brief}</p>
            <h3>Your objective</h3>
            <p className="bkd-objective">{room.objective}</p>
          </section>

          <section className="bkd-panel">
            <h3>Hints</h3>
            <p className="bkd-note">Stuck? Reveal them one at a time — try the step before opening the next.</p>
            <ol className="bkd-hints">
              {room.hints.map((h, i) => (
                <li key={i} className={i < revealed ? 'is-open' : 'is-closed'}>
                  {i < revealed ? h : <span className="bkd-hint-hidden">Hint {i + 1} hidden</span>}
                </li>
              ))}
            </ol>
            {revealed < room.hints.length && (
              <button className="bkd-btn bkd-btn-ghost" onClick={() => setRevealed((n) => n + 1)}>
                Reveal hint {revealed + 1}
              </button>
            )}
          </section>

          {solved && (
            <section className="bkd-panel bkd-debrief">
              <h3>What you just did</h3>
              <p>{room.debrief}</p>
            </section>
          )}
        </div>

        <aside className="bkd-room-side">
          <section className={`bkd-panel bkd-machine is-${lab.state}`}>
            <h3>The machine</h3>
            {lab.state === 'ready' || lab.state === 'stopping' ? (
              <>
                <p className="bkd-connected"><span className="bkd-live-dot" aria-hidden="true" /> Your machine is running</p>
                <p className="bkd-note">{room.app ? 'The web app opened in a new tab.' : 'The terminal opened in a new tab.'} Solve it there, then bring the flag back here.</p>
                <div className="bkd-term-actions">
                  {room.app && lab.appUrl && (
                    <button className="bkd-btn" onClick={() => openTab(lab.appUrl)}>Open web app</button>
                  )}
                  <button className={room.app ? 'bkd-btn bkd-btn-ghost' : 'bkd-btn'} onClick={() => openTab(lab.url)}>Open terminal</button>
                  <button className="bkd-btn bkd-btn-ghost" onClick={stop} disabled={lab.state === 'stopping'}>
                    {lab.state === 'stopping' ? 'Stopping…' : 'Stop machine'}
                  </button>
                </div>
                {lab.msg === 'popup-blocked' && (
                  <p className="bkd-warn">
                    Your browser blocked the new tab. Use the buttons above to open the
                    {room.app ? ' web app / terminal.' : ' terminal.'}
                  </p>
                )}
              </>
            ) : lab.state === 'loading' ? (
              <BootSequence />
            ) : (
              <div className="bkd-term-placeholder">
                <button className="bkd-btn bkd-btn-lg" onClick={connect}>⚡ Connect to machine</button>
                {lab.state === 'error' && <p className="bkd-warn">{lab.msg}</p>}
                {lab.state === 'idle' && (
                  <p className="bkd-note">{room.app
                    ? 'Boots your own vulnerable web app + a terminal, each in a new tab.'
                    : 'Boots your own private container and opens a full terminal in a new tab.'}</p>
                )}
              </div>
            )}
          </section>

          <section className="bkd-panel">
            <h3>Submit the flag</h3>
            <RoomFlag roomId={room.id} onSolved={onSolved} alreadySolved={solved} />
          </section>
        </aside>
      </div>
    </div>
  )
}

function SecureEditorRoom({ room, solved, onBack, onSolved }) {
  const [revealed, setRevealed] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | starting | ready | error
  const [grader, setGrader] = useState({ base: '', token: '' })
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)

  const graderUrl = (path) =>
    `${grader.base}${path}${grader.token ? `?token=${encodeURIComponent(grader.token)}` : ''}`

  const start = useCallback(async () => {
    setPhase('starting')
    try {
      const r = await api.post('/labs/open', { roomId: room.id })
      if (!r?.name) { setPhase('error'); return }
      const base = `/app/${r.name}`
      const token = r.token || ''
      setGrader({ base, token })
      const f = await fetch(`${base}/files${token ? `?token=${encodeURIComponent(token)}` : ''}`, {
        credentials: 'include',
      }).then((x) => x.json())
      setCode(f.content || '')
      setPhase('ready')
    } catch {
      setPhase('error')
    }
  }, [room.id])

  const run = useCallback(async () => {
    setRunning(true); setResult(null)
    try {
      const res = await fetch(graderUrl('/save'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: code }),
      }).then((x) => x.json())
      setResult(res)
      if (res.pass) onSolved?.()
    } catch {
      setResult({ pass: false, error: 'Could not reach the grader — try again.' })
    }
    setRunning(false)
  }, [code, grader.base, grader.token, onSolved])

  const onKeyDown = (e) => {
    if (e.key === 'Tab') { // insert two spaces instead of leaving the field
      e.preventDefault()
      const el = e.target
      const s = el.selectionStart, en = el.selectionEnd
      const next = code.slice(0, s) + '  ' + code.slice(en)
      setCode(next)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2 })
    }
  }

  return (
    <div className="bkd-room">
      <button className="bkd-back" onClick={onBack}>← All rooms</button>
      <header className="bkd-room-head">
        <span className="bkd-num bkd-num-lg">{room.num}</span>
        <div>
          <h1 className="bkd-title">{room.title}</h1>
          <p className="bkd-tag">{room.tier.toUpperCase()} · {room.concept}</p>
        </div>
        {solved && <span className="bkd-done-badge">Cleared</span>}
      </header>

      <section className="bkd-panel">
        <h3>Brief</h3>
        <p>{room.brief}</p>
        <h3>Your objective</h3>
        <p className="bkd-objective">{room.objective}</p>
      </section>

      <section className="bkd-panel">
        <h3>Fix the code</h3>
        {phase !== 'ready' ? (
          <div className="bkd-term-placeholder">
            <button className="bkd-btn" onClick={start} disabled={phase === 'starting'}>
              {phase === 'starting' ? 'Loading the code…' : 'Open the code'}
            </button>
            {phase === 'error' && <p className="bkd-warn">Could not start this room — is the dungeon live? Try again.</p>}
            {phase === 'idle' && <p className="bkd-note">Loads server.js into an editor. Fix the flaw, then run the checks.</p>}
          </div>
        ) : (
          <>
            <textarea
              className="bkd-code"
              value={code}
              spellCheck={false}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="bkd-term-actions">
              <button className="bkd-btn" onClick={run} disabled={running}>
                {running ? 'Running checks…' : 'Run checks'}
              </button>
            </div>
            {result && (
              <div className={`bkd-result ${result.pass ? 'ok' : 'no'}`}>
                {result.pass ? (
                  <>
                    <p className="bkd-connected">● Fixed — exploit blocked and the app still works.</p>
                    {result.flag && <p>Your flag: <code>{result.flag}</code> — submit it below.</p>}
                  </>
                ) : (
                  <>
                    <p className="bkd-warn">Not yet.{result.detail
                      ? ` exploit blocked: ${String(result.detail.exploitBlocked ?? (result.detail.parts ? result.detail.parts.every((p)=>p.exploitBlocked) : '—'))}, app still works: ${String(result.detail.stillWorks ?? (result.detail.parts ? result.detail.parts.every((p)=>p.stillWorks) : '—'))}.`
                      : (result.error ? ` ${result.error}` : '')}</p>
                    {result.output && <pre className="bkd-output">{String(result.output).slice(-1200)}</pre>}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className="bkd-panel">
        <h3>Hints</h3>
        <p className="bkd-note">Stuck? Reveal them one at a time.</p>
        <ol className="bkd-hints">
          {room.hints.map((h, i) => (
            <li key={i} className={i < revealed ? 'is-open' : 'is-closed'}>
              {i < revealed ? h : <span className="bkd-hint-hidden">Hint {i + 1} hidden</span>}
            </li>
          ))}
        </ol>
        {revealed < room.hints.length && (
          <button className="bkd-btn bkd-btn-ghost" onClick={() => setRevealed((n) => n + 1)}>
            Reveal hint {revealed + 1}
          </button>
        )}
      </section>

      <section className="bkd-panel">
        <h3>Submit the flag</h3>
        <RoomFlag roomId={room.id} onSolved={onSolved} alreadySolved={solved} />
      </section>

      {solved && (
        <section className="bkd-panel bkd-debrief">
          <h3>What you just did</h3>
          <p>{room.debrief}</p>
        </section>
      )}
    </div>
  )
}

function RoomFlag({ roomId, onSolved, alreadySolved }) {
  const [flag, setFlag] = useState('')
  const [result, setResult] = useState(alreadySolved ? 'correct' : null)
  const [hint, setHint] = useState('')
  const submit = async () => {
    try {
      const res = await api.post('/flags/submit', { roomId, flag })
      setResult(res.correct ? 'correct' : 'wrong')
      setHint(res.hint || '')
      if (res.correct) onSolved?.()
    } catch {
      setResult('error')
      setHint('')
    }
  }
  return (
    <div className="bkd-flag">
      <input
        placeholder="BK{...}"
        value={flag}
        onChange={(e) => setFlag(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
      />
      <button className="bkd-btn" onClick={submit}>Submit</button>
      {result === 'correct' && <span className="bkd-ok">Room cleared!</span>}
      {result === 'wrong' && <span className="bkd-no">{hint || 'Not quite — keep at it.'}</span>}
      {result === 'error' && <span className="bkd-no">Something went wrong.</span>}
    </div>
  )
}
