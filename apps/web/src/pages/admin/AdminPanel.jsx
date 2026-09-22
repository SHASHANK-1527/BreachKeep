import { useEffect, useState } from 'react'
import { api } from '../../app/api.js'

// Rendered only at ADMIN_SECRET_PATH. Requires the admin password (separate cookie).
export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [state, setState] = useState(null)
  const [err, setErr] = useState('')

  const load = async () => {
    try { setState(await api.get('/admin/state')); setAuthed(true) } catch { setAuthed(false) }
  }
  useEffect(() => { load() }, [])

  const login = async () => {
    setErr('')
    try { await api.post('/admin/login', { password }); await load() }
    catch (e) { setErr(e.data?.error || 'Wrong password') }
  }

  const toggleCommon = async (enabled) => { await api.post('/admin/common-code', { enabled }); load() }
  const toggleRoster = async (enabled) => { await api.post('/admin/roster-gate', { enabled }); load() }
  const setDungeon = async (dungeonId, live) => {
    try { await api.post('/admin/dungeons', { dungeonId, live }); load() }
    catch (e) { alert(e.data?.error || 'Failed') }
  }

  if (!authed) {
    return (
      <div className="bk-admin-login">
        <h1>Warden</h1>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin password" />
        {err && <div className="sn-error">{err}</div>}
        <button onClick={login}>Enter</button>
      </div>
    )
  }

  const ALL_DUNGEONS = ['terminal-1','terminal-2','network','web','secure-coding','capstone']
  const liveSet = new Set((state?.dungeons || []).filter(d => d.live).map(d => d.dungeonId))

  return (
    <div className="bk-admin">
      <h1>BreachKeep — Warden Panel</h1>
      <section>
        <h2>Access</h2>
        <label><input type="checkbox" checked={!!state?.commonCodeEnabled} onChange={(e) => toggleCommon(e.target.checked)} /> First-time access code enabled</label>
        <label><input type="checkbox" checked={!!state?.rosterGateEnabled} onChange={(e) => toggleRoster(e.target.checked)} /> Roster gate (only allow-listed emails may register)</label>
      </section>
      <section>
        <h2>Live dungeons (max 2)</h2>
        {ALL_DUNGEONS.map((d) => (
          <label key={d}>
            <input type="checkbox" checked={liveSet.has(d)} onChange={(e) => setDungeon(d, e.target.checked)} /> {d}
          </label>
        ))}
      </section>
      <section>
        <h2>Houses</h2>
        <pre>{JSON.stringify(state?.houseCounts || {}, null, 2)}</pre>
      </section>
    </div>
  )
}
