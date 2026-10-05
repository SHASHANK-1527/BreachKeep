import { useCallback, useEffect, useState } from 'react'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'

// A floating control panel for jumping the app into states that are slow to
// reach by hand. It draws itself ONLY when the server confirms test mode, so a
// stray VITE_TEST_MODE in a production build shows nothing: every button here
// depends on /api/dev/*, which does not exist unless the API allows it.

const T = {
  bg: '#12080699', panel: '#1C0D09', border: 'rgba(255,122,0,0.35)',
  text: '#E9D9D1', dim: '#A89489', accent: '#FF5A1F', cream: '#FFDCA8',
  green: '#22C55E', red: '#EF4444',
}

const s = {
  wrap: {
    position: 'fixed', right: 16, bottom: 16, zIndex: 99999,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12,
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto',
    padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
    background: T.panel, color: T.accent, border: `1px solid ${T.border}`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.55)', fontFamily: 'inherit', fontSize: 12,
    fontWeight: 700, letterSpacing: '0.08em',
  },
  card: {
    width: 320, maxHeight: '78vh', overflowY: 'auto', marginTop: 10,
    background: T.panel, color: T.text, border: `1px solid ${T.border}`,
    borderRadius: 14, padding: 14,
    boxShadow: '0 20px 60px rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
  },
  h: { fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.accent, fontWeight: 700, margin: '14px 0 7px' },
  row: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  btn: {
    flex: '1 1 auto', padding: '7px 9px', borderRadius: 7, cursor: 'pointer',
    background: 'transparent', color: T.cream, border: `1px solid ${T.border}`,
    fontFamily: 'inherit', fontSize: 11, whiteSpace: 'nowrap',
  },
  kv: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', lineHeight: 1.5 },
  k: { color: T.dim },
  pill: (on) => ({
    padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700,
    color: on ? T.green : T.dim, border: `1px solid ${on ? T.green : T.border}`,
  }),
}

export default function TestPanel() {
  const { user } = useAuth() || {}
  const [on, setOn] = useState(false)
  const [state, setState] = useState(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    // If the account has testing rights or admin role, or testMode
    try {
      const st = await api.get('/dev/state')
      setOn(true)
      setState(st)
      return
    } catch { /* not allowed or session not ready */ }

    // Fallback: check status endpoint
    try {
      const status = await api.get('/status')
      if (status?.testMode || status?.isTester) {
        setOn(true)
        setState(null)
        return
      }
    } catch {}

    if (user?.testingRights || user?.role === 'admin') {
      setOn(true)
    } else {
      setOn(false)
      setState(null)
    }
  }, [user])

  useEffect(() => { load() }, [load, user])

  // Ctrl+Shift+T toggles it, so it can stay out of the way while you look at a scene.
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'T' || e.key === 't')) { e.preventDefault(); setOpen((v) => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!on) return null

  const act = async (path, body, { reload = false } = {}) => {
    setBusy(true); setErr('')
    try {
      const next = await api.post(path, body)
      setState(next)
      if (reload) window.location.reload()
    } catch (e) {
      setErr(e.data?.error || e.message || 'failed')
    } finally { setBusy(false) }
  }

  const u = state?.user
  const done = u?.introRooms?.length || 0

  // Test mode is on, but there is no student session to act on.
  if (!state) {
    return (
      <div style={s.wrap}>
        {open ? (
          <div style={{ ...s.card, width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ color: T.accent, letterSpacing: '0.1em' }}>TEST MODE</b>
              <button onClick={() => setOpen(false)} style={{ ...s.btn, flex: '0 0 auto', padding: '2px 8px' }}>×</button>
            </div>
            <p style={{ color: T.dim, lineHeight: 1.6, margin: '12px 0 0' }}>
              Test mode is on, but these controls act on a logged-in student
              account and you don't have one in this tab.
            </p>
            <p style={{ color: T.dim, lineHeight: 1.6, margin: '10px 0 0' }}>
              Enter the access code, sign in as a student, then open this again.
            </p>
            <button style={{ ...s.btn, marginTop: 12 }} onClick={load}>Re-check</button>
          </div>
        ) : (
          <button style={{ ...s.tab, color: T.dim }} onClick={() => setOpen(true)}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.dim, display: 'inline-block' }} />
            TEST MODE — no session
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      {open && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ color: T.accent, letterSpacing: '0.1em' }}>TEST MODE</b>
            <button onClick={() => setOpen(false)} style={{ ...s.btn, flex: '0 0 auto', padding: '2px 8px' }}>×</button>
          </div>

          <div style={s.h}>This account</div>
          <div style={s.kv}><span style={s.k}>who</span><span>{u.username}</span></div>
          <div style={s.kv}><span style={s.k}>intro</span><span>{done} / {state.introTotal}</span></div>
          <div style={s.kv}><span style={s.k}>introComplete</span><span style={s.pill(u.introComplete)}>{String(u.introComplete)}</span></div>
          <div style={s.kv}><span style={s.k}>sorted</span><span style={s.pill(u.sorted)}>{String(u.sorted)}</span></div>
          <div style={s.kv}><span style={s.k}>house</span><span style={{ color: u.house ? T.cream : T.dim }}>{u.house || 'null'}</span></div>
          <div style={s.kv}><span style={s.k}>dashboard</span><span style={{ color: T.cream }}>{state.phase}</span></div>

          <div style={s.h}>Sorting</div>
          <div style={s.row}>
            <button style={s.btn} disabled={busy}
              onClick={() => act('/dev/intro', { complete: true }, { reload: true })}>
              Finish all {state.introTotal} → ceremony
            </button>
          </div>
          <div style={{ ...s.row, marginTop: 6 }}>
            <button style={s.btn} disabled={busy} onClick={() => act('/dev/unsort', {}, { reload: true })}>
              Re-run the draw
            </button>
            <button style={s.btn} disabled={busy} onClick={() => act('/dev/reset', {}, { reload: true })}>
              Reset account
            </button>
          </div>
          <p style={{ color: T.dim, margin: '7px 0 0', lineHeight: 1.5, fontSize: 10 }}>
            "Finish all" fills the nine rooms and leaves you unsorted, so the
            dashboard runs the ceremony on load. "Re-run the draw" throws the
            house away and keeps the intro done.
          </p>

          <div style={s.h}>Force a house (skips the draw)</div>
          <div style={s.row}>
            {state.houses.map((h) => (
              <button key={h} style={{ ...s.btn, ...(u.house === h ? { borderColor: T.accent, color: T.accent } : {}) }}
                disabled={busy} onClick={() => act('/dev/house', { house: h }, { reload: true })}>
                {h}
              </button>
            ))}
          </div>

          <div style={s.h}>Live dungeons (this account only)</div>
          <div style={s.row}>
            {state.dungeons.map((d) => {
              const on = state.liveDungeons.includes(d)
              const globalOn = state.globalLiveDungeons?.includes(d)
              return (
                <button
                  key={d}
                  style={{
                    ...s.btn,
                    ...(on || globalOn ? { borderColor: T.green, color: T.green } : {}),
                    ...(globalOn ? { opacity: 0.75 } : {}),
                  }}
                  disabled={busy || globalOn}
                  title={globalOn ? 'Live globally via Admin Panel' : on ? 'Enabled for your account only (click to disable)' : 'Click to enable for your account only'}
                  onClick={() => act('/dev/dungeons', { dungeonId: d, live: !on })}
                >
                  {globalOn ? '● ' : on ? '● ' : '○ '}{d}{globalOn ? ' (admin)' : ''}
                </button>
              )
            })}
          </div>
          <p style={{ color: T.dim, margin: '7px 0 0', lineHeight: 1.5, fontSize: 10 }}>
            {state.globalLiveDungeons?.length ? 'Dungeons marked (admin) are live globally for all students. ' : ''}
            Toggling a dungeon here enables it ONLY for this test account and does not affect other students.
            Reload the dashboard after toggling.
          </p>

          <div style={s.h}>House counts (drives the draw)</div>
          {state.houses.map((h) => (
            <div key={h} style={s.kv}><span style={s.k}>{h}</span><span>{state.houseCounts[h]}</span></div>
          ))}
          <p style={{ color: T.dim, margin: '7px 0 0', lineHeight: 1.5, fontSize: 10 }}>
            The draw picks at random among whichever houses are currently
            smallest — so with equal counts it is a free 1-in-4.
          </p>

          {err && <div style={{ color: T.red, marginTop: 10 }}>{err}</div>}
          <div style={{ color: T.dim, marginTop: 12, fontSize: 10 }}>Ctrl+Shift+T toggles this panel.</div>
        </div>
      )}

      {!open && (
        <button style={s.tab} onClick={() => setOpen(true)}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent, display: 'inline-block' }} />
          TEST MODE
        </button>
      )}
    </div>
  )
}
