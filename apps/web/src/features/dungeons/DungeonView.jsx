import { useEffect, useMemo, useState, useCallback } from 'react'
import { api } from '../../app/api.js'
import { useAuth } from '../../app/AuthContext.jsx'
import { getDungeon, tierUnlocks } from './index.js'
import './dungeons.css'

const TIER_ORDER = ['mandatory', 'medium', 'hard']

export default function DungeonView({ dungeonId }) {
  const { user } = useAuth()
  const dungeon = getDungeon(dungeonId)
  const [solved, setSolved] = useState(() => new Set())
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProgress = useCallback(async () => {
    try {
      const prog = await api.get('/progress')
      setSolved(new Set(prog?.solved || []))
    } catch {
      /* keep whatever we have; room is still browsable */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProgress() }, [loadProgress])

  const unlocks = useMemo(
    () => (dungeon ? tierUnlocks(dungeon, solved) : null),
    [dungeon, solved]
  )

  if (!dungeon) {
    return (
      <div className="bkd-scope" data-house={user?.house || undefined}>
        <div className="bkd-wrap">
          <h1 className="bkd-title">{dungeonId}</h1>
          <p className="bkd-note">This dungeon has no chambers built yet.</p>
        </div>
      </div>
    )
  }

  const selected = selectedId ? dungeon.roomById[selectedId] : null

  return (
    <div className="bkd-scope" data-house={user?.house || undefined}>
      <div className="bkd-wrap">
        {!selected ? (
          <>
            <header className="bkd-head">
              <p className="bkd-eyebrow">Dungeon</p>
              <h1 className="bkd-title">{dungeon.title}</h1>
              <p className="bkd-blurb">{dungeon.blurb}</p>
              {loading && <p className="bkd-note">Loading your progress…</p>}
            </header>

            {TIER_ORDER.map((tier) => {
              const rooms = dungeon.rooms.filter((r) => r.tier === tier)
              if (rooms.length === 0) return null
              const meta = dungeon.tiers[tier]
              const open = unlocks[tier]
              return (
                <section key={tier} className={`bkd-tier ${open ? '' : 'is-locked'}`}>
                  <div className="bkd-tier-head">
                    <h2>{meta.label}</h2>
                    <span className="bkd-tier-note">{open ? meta.note : `🔒 ${meta.note}`}</span>
                  </div>
                  <div className="bkd-grid">
                    {rooms.map((room) => {
                      const done = solved.has(room.id)
                      return (
                        <button
                          key={room.id}
                          className={`bkd-card ${done ? 'is-done' : ''} ${open ? '' : 'is-locked'}`}
                          onClick={() => open && setSelectedId(room.id)}
                          disabled={!open}
                        >
                          <span className="bkd-num">{room.num}</span>
                          <span className="bkd-card-title">{room.title}</span>
                          <span className="bkd-card-concept">{room.concept}</span>
                          <span className="bkd-pill">
                            {done ? 'Cleared' : open ? 'Enter' : 'Locked'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </>
        ) : (
          <RoomView
            room={selected}
            solved={solved.has(selected.id)}
            onBack={() => setSelectedId(null)}
            onSolved={() => { setSolved((s) => new Set(s).add(selected.id)); loadProgress() }}
          />
        )}
      </div>
    </div>
  )
}

function RoomView(props) {
  // Secure-coding rooms use an in-browser editor; everything else uses the
  // terminal/web-app "machine" panel.
  return props.room.editor ? <SecureEditorRoom {...props} /> : <MachineRoom {...props} />
}

function MachineRoom({ room, solved, onBack, onSolved }) {
  const [revealed, setRevealed] = useState(0) // how many hints shown
  const [lab, setLab] = useState({ state: 'idle', url: '', appUrl: '', msg: '' })

  const openTab = (url) => window.open(url, '_blank', 'noopener,noreferrer')

  const connect = useCallback(async () => {
    setLab({ state: 'loading', url: '', appUrl: '', msg: '' })
    try {
      // Boots (or reuses) this student's container and returns the tokened
      // terminal URL (and, for web rooms, the web-app URL). Opens a NEW TAB.
      const res = await api.post('/labs/open', { roomId: room.id })
      if (!res?.url) {
        setLab({ state: 'error', url: '', appUrl: '', msg: 'No terminal URL came back — try again.' })
        return
      }
      // For a web room, open the app tab; otherwise open the terminal tab.
      const first = room.app && res.appUrl ? res.appUrl : res.url
      const win = openTab(first)
      setLab({ state: 'ready', url: res.url, appUrl: res.appUrl || '', msg: win ? '' : 'popup-blocked' })
    } catch (e) {
      const code = e?.data?.error
      const msg =
        code === 'dungeon_not_live'
          ? 'This dungeon is not open yet — the Warden has to unseal it.'
          : code === 'lab_unavailable'
            ? 'The lab service could not start your machine. Give it a moment and retry.'
            : 'Could not start the machine. Try again shortly.'
      setLab({ state: 'error', url: '', appUrl: '', msg })
    }
  }, [room.id, room.app])

  const stop = useCallback(async () => {
    try { await api.post('/labs/stop', { roomId: room.id }) } catch { /* ignore */ }
    setLab({ state: 'idle', url: '', appUrl: '', msg: '' })
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
        {solved && <span className="bkd-done-badge">Cleared</span>}
      </header>

      <section className="bkd-panel">
        <h3>Brief</h3>
        <p>{room.brief}</p>
        <h3>Your objective</h3>
        <p className="bkd-objective">{room.objective}</p>
      </section>

      <section className="bkd-panel">
        <h3>The machine</h3>
        <div className="bkd-term-placeholder">
          {lab.state === 'ready' ? (
            <>
              <p className="bkd-connected">● Your machine is running{room.app ? ' — opened in a new tab.' : ' — the terminal opened in a new tab.'}</p>
              <div className="bkd-term-actions">
                {room.app && lab.appUrl && (
                  <button className="bkd-btn" onClick={() => openTab(lab.appUrl)}>Open web app</button>
                )}
                <button className={room.app ? 'bkd-btn bkd-btn-ghost' : 'bkd-btn'} onClick={() => openTab(lab.url)}>Open terminal</button>
                <button className="bkd-btn bkd-btn-ghost" onClick={stop}>Stop machine</button>
              </div>
              {lab.msg === 'popup-blocked' && (
                <p className="bkd-warn">
                  Your browser blocked the pop-up. Use the buttons above to open the
                  {room.app ? ' web app / terminal.' : ' terminal.'}
                </p>
              )}
            </>
          ) : (
            <>
              <button className="bkd-btn" onClick={connect} disabled={lab.state === 'loading'}>
                {lab.state === 'loading' ? 'Starting your machine…' : 'Connect to machine'}
              </button>
              {lab.state === 'error' && <p className="bkd-warn">{lab.msg}</p>}
              {lab.state === 'idle' && (
                <p className="bkd-note">{room.app
                  ? 'Boots your own vulnerable web app + a terminal, each in a new tab.'
                  : 'Boots your own private container and opens a full terminal in a new tab.'}</p>
              )}
            </>
          )}
        </div>
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
  const submit = async () => {
    try {
      const { correct } = await api.post('/flags/submit', { roomId, flag })
      setResult(correct ? 'correct' : 'wrong')
      if (correct) onSolved?.()
    } catch {
      setResult('error')
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
      {result === 'wrong' && <span className="bkd-no">Not quite — keep at it.</span>}
      {result === 'error' && <span className="bkd-no">Something went wrong.</span>}
    </div>
  )
}
