import { useEffect, useState, useCallback } from 'react'
import { api } from '../../../app/api.js'
import DungeonShell from '../DungeonShell.jsx'

const ROOM_ID = 'capstone-gauntlet'

export default function CapstoneView() {
  const [state, setState] = useState({ phase: 'loading', armed: false, target: null })

  const load = useCallback(async () => {
    try {
      const r = await api.get('/labs/capstone')
      setState({ phase: 'ready', armed: !!r.armed, target: r.target || null })
    } catch {
      setState({ phase: 'error', armed: false, target: null })
    }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <DungeonShell dungeonId="capstone">
        <header className="bkd-head">
          <p className="bkd-eyebrow">Door VI · Capstone</p>
          <h1 className="bkd-title">The Gauntlet</h1>
          <p className="bkd-blurb">
            One target machine. Everything you have learned — recon, the web, the shell, privilege.
            Get to root and bring back its flag.
          </p>
        </header>

        {state.phase === 'loading' && <p className="bkd-note">Checking the gate…</p>}
        {state.phase === 'error' && (
          <p className="bkd-warn">Couldn’t reach the Keep. <button className="bkd-btn bkd-btn-ghost" onClick={load}>Retry</button></p>
        )}

        {state.phase === 'ready' && !state.armed && <WaitForDay onRefresh={load} />}
        {state.phase === 'ready' && state.armed && <Armed target={state.target} />}
    </DungeonShell>
  )
}

function WaitForDay({ onRefresh }) {
  return (
    <section className="bkd-panel" style={{ textAlign: 'center' }}>
      <h3>Sealed until the day</h3>
      <p className="bkd-note" style={{ maxWidth: '52ch', margin: '0 auto 1rem' }}>
        The Gauntlet runs live, together, on the day. The target box is powered down until the
        Warden opens it. Come back when it begins — your briefing and the connection details will
        appear here.
      </p>
      <button className="bkd-btn" disabled>Wait for the day</button>
      <p className="bkd-note" style={{ marginTop: '.8rem' }}>
        Already begun? <button className="bkd-btn bkd-btn-ghost" onClick={onRefresh}>Refresh</button>
      </p>
    </section>
  )
}

function Armed({ target }) {
  const host = target?.host || 'the target host'
  const web = target?.web || '80'
  const ssh = target?.ssh || '22'
  return (
    <>
      <section className="bkd-panel">
        <h3>The briefing</h3>
        <p>
          A forgotten admin box — the “Keep Admin Portal” — is back online and still carrying the
          sloppy habits of whoever built it. Somewhere on it is <code>root.txt</code>. Get there.
        </p>
        <p className="bkd-note">
          There is no single road. Recon will show you more than one way in, and the box is littered
          with <strong>decoy flags</strong> — wrong, but not useless. Submit one and the Keep will tell
          you what it means and where to look next. Different routes drop different decoys, so the hint
          you get matches the path you took. Only <code>root.txt</code> clears the Gauntlet.
        </p>
      </section>

      <section className="bkd-panel">
        <h3>Connect from your Kali VM</h3>
        <pre className="bkd-output" style={{ whiteSpace: 'pre-wrap' }}>{`# target host:   ${host}

# 1. recon — what's open?
nmap -sV ${host}

# 2. the web service (recon, enumeration, leaked files)
#    browse it, read the source, enumerate paths:
#    e.g.  gobuster dir -u http://${host}:${web} -w <wordlist>
#    look at   http://${host}:${web}/robots.txt   and anything it mentions

# 3. a foothold — the web leaks a login. Use it:
ssh gale@${host} -p ${ssh}

# 4. on the box: find the user flag, then escalate to root
#    (what can you run as root?  ->  sudo -l )
#    root's flag is the one you submit below.`}</pre>
        <p className="bkd-note">
          Stuck in the browser? Your own Kali already has everything (nmap, gobuster, curl, ssh). The
          platform only hands you the target and grades the flag.
        </p>
      </section>

      <section className="bkd-panel">
        <h3>Submit a flag</h3>
        <p className="bkd-note">Found something that looks like a flag? Submit it — even a decoy will point you onward.</p>
        <CapstoneFlag />
      </section>
    </>
  )
}

function CapstoneFlag() {
  const [flag, setFlag] = useState('')
  const [res, setRes] = useState(null) // {correct, hint}
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true); setRes(null)
    try {
      const r = await api.post('/flags/submit', { roomId: ROOM_ID, flag })
      setRes(r)
    } catch {
      setRes({ error: true })
    }
    setBusy(false)
  }
  return (
    <div>
      <div className="bkd-flag">
        <input
          placeholder="BK{...}"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        />
        <button className="bkd-btn" onClick={submit} disabled={busy || !flag.trim()}>
          {busy ? 'Checking…' : 'Submit'}
        </button>
      </div>
      {res?.correct && <p className="bkd-connected" style={{ marginTop: '.6rem' }}>● Root. The Gauntlet is yours — well done.</p>}
      {res && !res.correct && res.hint && (
        <p className="bkd-warn" style={{ marginTop: '.6rem' }}>Not the flag — but a lead: {res.hint}</p>
      )}
      {res && !res.correct && !res.hint && !res.error && (
        <p className="bkd-no" style={{ marginTop: '.6rem' }}>Not a flag this box knows. Keep enumerating.</p>
      )}
      {res?.error && <p className="bkd-no" style={{ marginTop: '.6rem' }}>Something went wrong — try again.</p>}
    </div>
  )
}
