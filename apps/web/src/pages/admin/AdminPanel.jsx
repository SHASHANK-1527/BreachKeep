import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../app/api.js'

const T = {
  bg: '#0a0403', panel: '#160806', panel2: '#1c0d09',
  border: 'rgba(255,122,0,0.22)', soft: 'rgba(255,122,0,0.12)',
  text: '#e9d9d1', dim: 'rgba(233,217,209,0.55)', accent: '#ff5a1f',
  cream: '#ffdca8', green: '#22c55e', red: '#ef4444', gold: '#e0a800',
}

const s = {
  shell: { minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'system-ui, sans-serif', display: 'flex' },
  side: { width: 210, flexShrink: 0, background: T.panel, borderRight: `1px solid ${T.soft}`, padding: '1.25rem 0.75rem', position: 'sticky', top: 0, height: '100vh' },
  sideTitle: { fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.dim, padding: '0 0.75rem', marginBottom: '0.5rem', fontWeight: 700 },
  tab: { display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.55rem 0.75rem', background: 'transparent', border: 'none', color: T.text, textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', marginBottom: 2, transition: 'all 160ms ease' },
  tabActive: { background: 'rgba(255,122,0,0.12)', color: T.accent },
  main: { flex: 1, padding: '2rem 2.25rem', maxWidth: 900, minWidth: 0 },
  h1: { fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.25rem' },
  sub: { color: T.dim, fontSize: '0.88rem', margin: '0 0 1.75rem' },
  card: { background: T.panel, border: `1px solid ${T.soft}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' },
  cardTitle: { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.accent, fontWeight: 700, marginBottom: '1rem' },
  input: { width: '100%', padding: '0.6rem 0.7rem', background: T.bg, border: `1px solid ${T.border}`, color: T.cream, borderRadius: 8, fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
  btn: { padding: '0.5rem 0.95rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'inherit' },
  btnGhost: { background: 'transparent', border: `1px solid ${T.border}`, color: T.accent },
  btnGreen: { background: T.green, color: '#fff' },
  btnRed: { background: T.red, color: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' },
  th: { textAlign: 'left', padding: '0.55rem 0.5rem', color: T.dim, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${T.soft}` },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' },
  pill: { display: 'inline-block', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, border: `1px solid ${T.border}`, color: T.accent },
  toast: { position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 90, background: T.panel2, border: `1px solid`, padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.85rem', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' },
}

const HOUSES = [
  { id: 'rimeguard', label: 'Rimeguard', color: '#7dd3fc' },
  { id: 'emberkeep', label: 'Emberkeep', color: '#fb923c' },
  { id: 'arcweave', label: 'Arcweave', color: '#c084fc' },
  { id: 'voltgrid', label: 'Voltgrid', color: '#facc15' },
]
const DUNGEONS = ['terminal-1', 'terminal-2', 'network', 'web', 'secure-coding', 'capstone']

function Icon({ name, size = 16, color = T.dim }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const d = {
    grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
    key: <><circle cx="7.5" cy="15.5" r="4.5" /><path d="M10.5 12.5 21 2m-4 4 3 3m-6 0 3 3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
    castle: <><path d="M3 21h18M5 21V8l3 2V8l4 2V8l4 2V8l3 2v11" /></>,
    power: <><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></>,
  }
  return <svg {...p}>{d[name]}</svg>
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.7rem 0', cursor: 'pointer' }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3, accentColor: T.accent }} />
      <span>
        <span style={{ display: 'block', fontSize: '0.92rem', color: T.cream }}>{label}</span>
        {hint && <span style={{ display: 'block', fontSize: '0.78rem', color: T.dim, marginTop: 2 }}>{hint}</span>}
      </span>
    </label>
  )
}

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  const [state, setState] = useState(null)
  const [overview, setOverview] = useState(null)
  const [roster, setRoster] = useState({ emails: [], total: 0 })
  const [rosterDraft, setRosterDraft] = useState('')
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState('')
  const [mMsg, setMMsg] = useState('')
  const [mEta, setMEta] = useState('')
  const [capHost, setCapHost] = useState('')
  const [testDungeon, setTestDungeon] = useState('terminal-1')

  const flash = useCallback((text, kind = 'ok') => setToast({ text, kind }), [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }, [toast])

  const loadState = useCallback(async () => { try { setState(await api.get('/admin/state')) } catch {} }, [])
  const loadOverview = useCallback(async () => { try { setOverview(await api.get('/admin/overview')) } catch (e) { flash(e.data?.error || 'Failed to load', 'err') } }, [flash])
  const loadRoster = useCallback(async () => { try { setRoster(await api.get('/admin/roster')) } catch (e) { flash(e.data?.error || 'Failed to load roster', 'err') } }, [flash])
  const loadStudents = useCallback(async (q = '') => {
    try { const r = await api.get(`/admin/students${q ? `?q=${encodeURIComponent(q)}` : ''}`); setStudents(r.students || []) }
    catch (e) { flash(e.data?.error || 'Failed to load students', 'err') }
  }, [flash])

  const load = useCallback(async () => {
    // /admin/state doubles as the "am I still an admin?" probe. Keep what it
    // returns — it carries the kill-switch and gate flags, and throwing it away
    // meant the panel refetched the same thing on the next tab change.
    try { setState(await api.get('/admin/state')); setAuthed(true) }
    catch { setState(null); setAuthed(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // Keep the kill-switch message/ETA and capstone host boxes in step with state.
  // MUST live here with the other hooks: React requires the same hooks to run
  // on every render, and there is an early `return` for the login screen below.
  useEffect(() => {
    if (!state) return
    setMMsg(state.maintenanceMessage || '')
    setMEta(state.maintenanceEta || '')
    setCapHost(state.capstoneTargetHost || '')
  }, [state?.maintenanceMessage, state?.maintenanceEta, state?.capstoneTargetHost])

  // Load the active tab's data on demand.
  useEffect(() => {
    if (!authed) return
    if (tab === 'overview') loadOverview()
    if (tab === 'access' || tab === 'dungeons' || tab === 'site' || tab === 'capstone' || tab === 'testing') loadState()
    if (tab === 'roster') loadRoster()
    if (tab === 'students' || tab === 'testing') loadStudents(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, authed])

  const login = async () => {
    setErr('')
    try { await api.post('/admin/login', { password }); await load() }
    catch (e) { setErr(e.data?.error || 'Wrong password') }
  }
  const logout = async () => { await api.post('/admin/logout'); setAuthed(false) }

  const act = async (fn, okMsg) => {
    setBusy(true)
    try { await fn(); if (okMsg) flash(okMsg) }
    catch (e) { flash(e.data?.error || 'Action failed', 'err') }
    finally { setBusy(false) }
  }

  if (!authed) {
    return (
      <div className="bk-admin-login" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: T.bg, color: T.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: 320 }}>
          <h1 style={{ fontFamily: "'Cinzel Decorative', serif", color: T.accent, textAlign: 'center' }}>Warden</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin password" style={s.input} onKeyDown={(e) => e.key === 'Enter' && login()} />
          {err && <div style={{ color: T.red, fontSize: '0.82rem', margin: '0.5rem 0' }}>{err}</div>}
          <button onClick={login} style={{ ...s.btn, ...s.btnGhost, width: '100%' }}>Enter</button>
        </div>
      </div>
    )
  }

  const down = !!state?.maintenance

  const setMaintenance = (enabled) =>
    act(async () => {
      await api.post('/admin/maintenance', { enabled, message: mMsg, eta: mEta })
      await loadState()
    }, enabled ? 'Site closed — students now see the maintenance page' : 'Site reopened')

  const liveSet = new Set((state?.dungeons || []).filter((d) => d.live).map((d) => d.dungeonId))
  const maxHouse = Math.max(1, ...Object.values(overview?.houses || {}))

  return (
    <div style={s.shell}>
      <aside style={s.side}>
        <div style={s.sideTitle}>Warden</div>
        {[
          ['overview', 'grid', 'Overview'],
          ['access', 'key', 'Access'],
          ['roster', 'users', 'Roster'],
          ['dungeons', 'castle', 'Dungeons'],
          ['students', 'users', 'Students'],
          ['site', 'power', 'Site'],
          ['capstone', 'castle', 'Capstone'],
          ['testing', 'power', 'Testing'],
        ].map(([id, icon, label]) => (
          <button key={id} style={{ ...s.tab, ...(tab === id ? s.tabActive : {}) }} onClick={() => setTab(id)}>
            <Icon name={icon} size={16} color={tab === id ? T.accent : T.dim} /> {label}
          </button>
        ))}
        <div style={{ marginTop: '1.5rem', padding: '0 0.75rem' }}>
          <button style={{ ...s.btn, ...s.btnGhost, width: '100%' }} onClick={logout}>Log out</button>
        </div>
      </aside>

      <main style={s.main}>
        {tab === 'overview' && (
          <>
            <h1 style={s.h1}>Overview</h1>
            <p style={s.sub}>Live state of the cohort.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.9rem', marginBottom: '1.25rem' }}>
              {[
                ['Students', overview?.students ?? '—'],
                ['Verified', overview?.verified ?? '—'],
                ['Unsorted', overview?.unsorted ?? '—'],
                ['Rooms solved', overview?.solved ?? '—'],
                ['Live dungeons', `${overview?.live ?? 0} / 2`],
              ].map(([k, v]) => (
                <div key={k} style={s.card}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.dim }}>{k}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: T.cream, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <div style={s.cardTitle}>House distribution</div>
              {HOUSES.map((h) => {
                const n = overview?.houses?.[h.id] || 0
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0' }}>
                    <span style={{ width: 90, fontSize: '0.85rem', color: T.cream }}>{h.label}</span>
                    <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${(n / maxHouse) * 100}%`, height: '100%', background: h.color, borderRadius: 999, transition: 'width 300ms ease' }} />
                    </div>
                    <span style={{ width: 28, textAlign: 'right', fontSize: '0.85rem', color: T.dim }}>{n}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'access' && (
          <>
            <h1 style={s.h1}>Access</h1>
            <p style={s.sub}>Control who may enter and register.</p>
            <div style={s.card}>
              <div style={s.cardTitle}>Gates</div>
              <Toggle
                checked={state?.dailyCodeEnabled !== false}
                onChange={(v) => act(async () => { await api.post('/admin/daily-code', { enabled: v }); await loadState() }, 'Daily code setting updated')}
                label="Daily session code required"
                hint="When off, users sign in directly without needing an emailed daily session code."
              />
              <Toggle
                checked={state?.commonCodeEnabled}
                onChange={(v) => act(async () => { await api.post('/admin/common-code', { enabled: v }); await loadState() }, 'Access updated')}
                label="First-time access code enabled"
                hint="When off, the common code on the landing page stops working."
              />
              <Toggle
                checked={state?.rosterGateEnabled}
                onChange={(v) => act(async () => { await api.post('/admin/roster-gate', { enabled: v }); await loadState() }, 'Roster gate updated')}
                label="Roster gate"
                hint="When on, only emails on the Roster tab may register."
              />
            </div>
          </>
        )}

        {tab === 'roster' && (
          <>
            <h1 style={s.h1}>Roster</h1>
            <p style={s.sub}>{roster.total} email{roster.total === 1 ? '' : 's'} allowed to register.</p>

            <div style={s.card}>
              <div style={s.cardTitle}>Add emails</div>
              <textarea
                value={rosterDraft}
                onChange={(e) => setRosterDraft(e.target.value)}
                placeholder={'one per line, or comma separated'}
                rows={5}
                style={{ ...s.input, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button disabled={busy || !rosterDraft.trim()} style={{ ...s.btn, ...s.btnGreen }}
                  onClick={() => act(async () => {
                    await api.post('/admin/roster', { emails: rosterDraft.split(/[\s,;]+/), mode: 'append' })
                    setRosterDraft(''); await loadRoster()
                  }, 'Roster updated')}>Add</button>
                <button disabled={busy || !rosterDraft.trim()} style={{ ...s.btn, ...s.btnRed }} onClick={() => {
                  if (!window.confirm('Replace the entire roster with these emails?')) return
                  act(async () => { await api.post('/admin/roster', { emails: rosterDraft.split(/[\s,;]+/), mode: 'replace' }); setRosterDraft(''); await loadRoster() }, 'Roster replaced')
                }}>Replace all</button>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardTitle}>Current roster</div>
              {!roster.emails.length && <div style={{ color: T.dim, fontSize: '0.85rem' }}>Empty — anyone may register while the roster gate is off.</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {roster.emails.map((e) => (
                  <span key={e} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: T.panel2, border: `1px solid ${T.soft}`, borderRadius: 999, padding: '0.3rem 0.4rem 0.3rem 0.75rem', fontSize: '0.8rem', color: T.cream }}>
                    {e}
                    <button title="Remove" onClick={() => act(async () => { await api.post('/admin/roster-remove', { emails: [e] }); await loadRoster() })} style={{ background: 'transparent', border: 'none', color: T.dim, cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: '2px 4px' }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'dungeons' && (
          <>
            <h1 style={s.h1}>Dungeons</h1>
            <p style={s.sub}>At most 2 may be live at once (enforced server-side).</p>
            <div style={s.card}>
              {DUNGEONS.map((d) => (
                <Toggle
                  key={d}
                  checked={liveSet.has(d)}
                  onChange={(v) => act(async () => { await api.post('/admin/dungeons', { dungeonId: d, live: v }); await loadState() })}
                  label={d}
                />
              ))}
            </div>
          </>
        )}

        {tab === 'capstone' && (
          <>
            <h1 style={s.h1}>Capstone</h1>
            <p style={s.sub}>Spawn the one shared target box on the day. Students attack it from their own Kali VMs.</p>

            <div style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={s.cardTitle}>Target box status</div>
                <span style={{
                  ...s.pill,
                  color: state?.capstoneRunning ? T.green : (state?.capstoneArmed ? T.gold : T.dim),
                  borderColor: state?.capstoneRunning ? T.green : (state?.capstoneArmed ? T.gold : T.border),
                  fontWeight: 600,
                }}>
                  {state?.capstoneRunning ? '● Container running' : (state?.capstoneArmed ? '○ Starting…' : '○ Powered down')}
                </span>
              </div>

              <Toggle
                checked={state?.capstoneArmed}
                onChange={(v) => act(async () => {
                  await api.post('/admin/capstone', { armed: v, host: capHost })
                  await loadState()
                }, v ? 'Target box armed — students see briefing & connect info' : 'Target box powered down')}
                label="Arm the capstone target box"
                hint="On: the target container starts and the capstone page reveals connection instructions and flag submission. Off: students see 'wait for the day'."
              />

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: `1px solid ${T.border}` }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: T.cream, fontWeight: 600, marginBottom: '0.4rem' }}>
                  Target host / IP address
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={capHost}
                    onChange={(e) => setCapHost(e.target.value)}
                    placeholder="e.g. 20.235.162.102 or breachkeep-elabs.duckdns.org"
                    style={{ ...s.input, flex: 1 }}
                  />
                  <button
                    disabled={busy}
                    style={{ ...s.btn, ...s.btnGhost }}
                    onClick={() => act(async () => {
                      await api.post('/admin/capstone', { host: capHost })
                      await loadState()
                    }, 'Target host updated')}
                  >
                    Save Host
                  </button>
                </div>
                <p style={{ fontSize: '0.78rem', color: T.dim, marginTop: '0.4rem' }}>
                  This IP or domain name is presented to students on the Capstone challenge page for nmap, web recon, and SSH access.
                </p>
              </div>

              <div style={{ marginTop: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
                <div style={{ background: T.bg, padding: '0.75rem', borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.72rem', color: T.dim, textTransform: 'uppercase' }}>Web Service Port</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: T.cream, marginTop: 4 }}>
                    :{state?.capstoneWebPort || '8088'}
                  </div>
                </div>
                <div style={{ background: T.bg, padding: '0.75rem', borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.72rem', color: T.dim, textTransform: 'uppercase' }}>SSH Service Port</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: T.cream, marginTop: 4 }}>
                    :{state?.capstoneSshPort || '2222'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'testing' && (
          <>
            <h1 style={s.h1}>Testing</h1>
            <p style={s.sub}>Dev tools for walking the flows yourself — grant an account the floating test panel, skip or restart the intro, wipe a dungeon's progress. Works on a chosen account.</p>

            <div style={s.card}>
              <div style={s.cardTitle}>Testing tools</div>
              <Toggle
                checked={state?.testingEnabled}
                onChange={(v) => act(async () => { await api.post('/admin/testing', { enabled: v }); await loadState() }, v ? 'Testing tools enabled' : 'Testing tools disabled')}
                label="Enable testing tools"
                hint="When off, the actions below are refused and no granted account sees the test panel. Turn on only while testing, off for class."
              />
            </div>

            {state?.testingEnabled && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadStudents(query)}
                    placeholder="Find the account to test on (name or email)…"
                    style={s.input}
                  />
                  <button style={{ ...s.btn, ...s.btnGhost, whiteSpace: 'nowrap' }} onClick={() => loadStudents(query)}>Search</button>
                </div>

                <div style={s.card}>
                  <div style={s.cardTitle}>Reset a dungeon's progress</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: T.dim }}>Dungeon:</span>
                    <select value={testDungeon} onChange={(e) => setTestDungeon(e.target.value)} style={{ ...s.input, width: 'auto' }}>
                      {DUNGEONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span style={{ fontSize: '0.78rem', color: T.dim }}>applies to the "Reset dungeon" button on each row below</span>
                  </div>
                </div>

                <div style={{ ...s.card, overflowX: 'auto' }}>
                  {!students.length && <div style={{ color: T.dim, fontSize: '0.85rem' }}>Search for an account above.</div>}
                  {students.map((u) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ flex: '1 1 180px', minWidth: 0 }}>
                        <span style={{ color: T.cream, fontSize: '0.9rem' }}>{u.username}</span>
                        <span style={{ color: T.dim, fontSize: '0.78rem', display: 'block' }}>{u.email}</span>
                      </span>
                      <span style={{ ...s.pill, color: u.introComplete ? T.green : T.dim, borderColor: u.introComplete ? T.green : T.border }}>
                        intro {u.introComplete ? 'done' : 'not done'}
                      </span>
                      <span style={{ ...s.pill, color: u.testingRights ? T.gold : T.dim, borderColor: u.testingRights ? T.gold : T.border }}>
                        {u.testingRights ? 'testing: granted' : 'testing: off'}
                      </span>
                      <button
                        style={{ ...s.btn, ...(u.testingRights ? s.btnRed : s.btnGreen) }}
                        onClick={() => act(async () => { await api.post('/admin/test/grant', { id: u.id, enabled: !u.testingRights }); await loadStudents(query) }, u.testingRights ? `${u.username}: testing revoked` : `${u.username}: testing granted — they see the panel`)}
                      >
                        {u.testingRights ? 'Revoke testing' : 'Grant testing'}
                      </button>
                      <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => act(async () => { await api.post('/admin/test/intro', { id: u.id, action: 'complete' }); await loadStudents(query) }, `${u.username}: intro skipped`)}>Skip intro</button>
                      <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => act(async () => { await api.post('/admin/test/intro', { id: u.id, action: 'reset' }); await loadStudents(query) }, `${u.username}: intro restarted`)}>Restart intro</button>
                      <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => act(async () => { await api.post('/admin/test/reset-dungeon', { id: u.id, dungeonId: testDungeon }); await loadStudents(query) }, `${u.username}: ${testDungeon} wiped`)}>Reset {testDungeon}</button>
                      <button style={{ ...s.btn, ...s.btnRed }} onClick={() => { if (!window.confirm(`Wipe ALL progress + intro for ${u.username}?`)) return; act(async () => { await api.post(`/admin/students/${u.id}/reset-progress`); await loadStudents(query) }, `${u.username}: all progress reset`) }}>Reset all</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'students' && (
          <>
            <h1 style={s.h1}>Students</h1>
            <p style={s.sub}>{students.length} shown.</p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadStudents(query)}
                placeholder="Search name or email…"
                style={s.input}
              />
              <button style={{ ...s.btn, ...s.btnGhost, whiteSpace: 'nowrap' }} onClick={() => loadStudents(query)}>Search</button>
            </div>

            <div style={{ ...s.card, overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Student</th>
                    <th style={s.th}>House</th>
                    <th style={s.th}>Solved</th>
                    <th style={s.th}>State</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((u) => (
                    <tr key={u.id}>
                      <td style={s.td}>
                        <div style={{ color: T.cream, fontWeight: 600 }}>{u.username}</div>
                        <div style={{ color: T.dim, fontSize: '0.76rem' }}>{u.email}{u.hasGoogle ? ' · google' : ''}</div>
                      </td>
                      <td style={s.td}>
                        <select
                          value={u.house || ''}
                          onChange={(e) => {
                            const house = e.target.value
                            act(async () => {
                              await api.post(`/admin/students/${u.id}/house`, { house })
                              await loadStudents(query)
                            }, `${u.username} → ${house || 'unsorted'}`)
                          }}
                          style={{ background: T.bg, color: T.cream, border: `1px solid ${T.border}`, borderRadius: 6, padding: '0.3rem 0.4rem', fontFamily: 'inherit', fontSize: '0.8rem' }}
                        >
                          <option value="">unsorted</option>
                          {HOUSES.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
                        </select>
                      </td>
                      <td style={{ ...s.td, color: T.cream }}>{u.solved}</td>
                      <td style={s.td}>
                        {!u.verified && <span style={{ ...s.pill, color: T.gold, borderColor: T.gold, marginRight: 6 }}>unverified</span>}
                        {u.sorted ? <span style={{ ...s.pill, color: T.green, borderColor: T.green }}>sorted</span> : <span style={s.pill}>unsorted</span>}
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button style={{ ...s.btn, ...s.btnGhost, marginRight: 6 }} onClick={() => {
                          if (!window.confirm(`Reset ${u.username}'s progress? This clears solved rooms and the intro.`)) return
                          act(async () => { await api.post(`/admin/students/${u.id}/reset-progress`); await loadStudents(query) }, 'Progress reset')
                        }}>Reset</button>
                        <button style={{ ...s.btn, ...s.btnRed }} onClick={() => {
                          if (!window.confirm(`Permanently delete ${u.username} and all their progress?`)) return
                          act(async () => { await api.post(`/admin/students/${u.id}/delete`); await loadStudents(query) }, 'Student deleted')
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!students.length && <div style={{ color: T.dim, fontSize: '0.85rem', padding: '0.5rem 0' }}>No students match.</div>}
            </div>
          </>
        )}

        {tab === 'site' && (
          <>
            <h1 style={s.h1}>Site</h1>
            <p style={s.sub}>Open or seal the Keep for everyone at once.</p>

            {/* Status banner */}
            <div style={{
              ...s.card,
              borderColor: down ? T.red : 'rgba(34,197,94,0.35)',
              background: down ? 'rgba(239,68,68,0.07)' : 'rgba(34,197,94,0.06)',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                background: down ? T.red : T.green,
                boxShadow: `0 0 12px ${down ? T.red : T.green}`,
              }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: down ? T.red : T.green }}>
                  {state ? (down ? 'Sealed — students see the maintenance page' : 'Open — students can enter') : 'Checking…'}
                </div>
                <div style={{ fontSize: '0.8rem', color: T.dim, marginTop: 3 }}>
                  {down
                    ? 'Regular students see the maintenance page. Accounts with Testing Rights and admins retain full access to test dungeons and features.'
                    : 'Everything is live. Anyone with the access code can register and work through the challenges.'}
                </div>
              </div>
            </div>

            {/* What students will read */}
            <div style={s.card}>
              <div style={s.cardTitle}>What students will read</div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: T.dim, marginBottom: '0.35rem' }}>
                Message (leave blank for the default notice)
              </label>
              <textarea
                value={mMsg}
                onChange={(e) => setMMsg(e.target.value)}
                rows={3}
                maxLength={400}
                placeholder="The Warden has closed the gates while the next dungeons are forged. Your progress is safe — nothing has been lost."
                style={{ ...s.input, resize: 'vertical', lineHeight: 1.55 }}
              />
              <label style={{ display: 'block', fontSize: '0.78rem', color: T.dim, margin: '0.9rem 0 0.35rem' }}>
                Reopens (optional — shown as a badge)
              </label>
              <input
                value={mEta}
                onChange={(e) => setMEta(e.target.value)}
                maxLength={120}
                placeholder="Saturday 6 PM"
                style={s.input}
              />
              {down && (
                <button
                  disabled={busy}
                  style={{ ...s.btn, ...s.btnGhost, marginTop: '0.9rem' }}
                  onClick={() => setMaintenance(true)}
                >
                  Update the notice
                </button>
              )}
            </div>

            {/* The switch itself */}
            <div style={{ ...s.card, borderColor: 'rgba(239,68,68,0.3)' }}>
              <div style={{ ...s.cardTitle, color: T.red }}>Kill switch</div>
              {down ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: T.dim, lineHeight: 1.6, margin: '0 0 1rem' }}>
                    The site is sealed for regular students. Accounts with testing rights (granted in the Testing tab)
                    and administrators can still log in, test dungeons, and access all features. Reopening takes effect
                    immediately.
                  </p>
                  <button
                    disabled={busy}
                    style={{ ...s.btn, ...s.btnGreen, padding: '0.7rem 1.4rem', fontSize: '0.92rem' }}
                    onClick={() => setMaintenance(false)}
                  >
                    Reopen the Keep
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: T.dim, lineHeight: 1.6, margin: '0 0 1rem' }}>
                    Closes the site for regular students immediately. Students mid-session are redirected to
                    the maintenance notice. Accounts with testing rights and administrators retain full access
                    to test and verify the site. No data or progress is lost.
                  </p>
                  <button
                    disabled={busy}
                    style={{ ...s.btn, ...s.btnRed, padding: '0.7rem 1.4rem', fontSize: '0.92rem' }}
                    onClick={() => {
                      if (!window.confirm('Close BreachKeep for regular students now?\n\nThey will see the maintenance page until you reopen it. Accounts with testing rights will still have access.')) return
                      setMaintenance(true)
                    }}
                  >
                    Close the site now
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </main>

      {toast && (
        <div style={{ ...s.toast, borderColor: toast.kind === 'err' ? T.red : T.green, color: toast.kind === 'err' ? T.red : T.cream }}>
          {toast.text}
        </div>
      )}
    </div>
  )
}
