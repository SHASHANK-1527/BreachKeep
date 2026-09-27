import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'
import HubShell from '../shell/HubShell.jsx'
import QuestMapHub from '../shell/QuestMapHub.jsx'
import SortingCeremony from '../shell/SortingCeremony.jsx'
import ParticleField from '../sanctum/ParticleField.jsx'
import StoneGate from '../sanctum/StoneGate.jsx'
import ThemeStage from '../shell/styles/themes/ThemeStage.jsx'
import DungeonsComing from '../shell/DungeonsComing.jsx'

// State machine:
//  A) introComplete=false            -> sanctum scene with the Oni gate
//  B) introComplete=true, sorted=false, returning -> run sorting ceremony
//  C) sorted=true                    -> full house-themed hub
export default function Dashboard() {
  const nav = useNavigate()
  const { user, refresh, setUser } = useAuth()
  const [progress, setProgress] = useState({ solved: [], unlocked: [] })
  const [phase, setPhase] = useState('loading')
  const [assignedHouse, setAssignedHouse] = useState(null)
  const [loadError, setLoadError] = useState('')

  // One in-flight load at a time, and never a second bounce to /enter. The old
  // version treated ANY failure of /intro/status as "you are logged out": it
  // cleared the session and navigated, the route guard sent the browser back
  // here, and the whole thing repeated several times a second — the flood of
  // 404s in the network tab. Only a real 401 signs anyone out now.
  const inFlight = useRef(false)
  const bounced = useRef(false)

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    let status
    try {
      status = await api.get('/intro/status')
    } catch (e) {
      if (e?.status === 401) {
        if (bounced.current) { inFlight.current = false; return }
        bounced.current = true
        sessionStorage.removeItem('bk_has_access')
        if (setUser) setUser(null)
        nav('/enter', { replace: true })
      } else {
        // Network blip, 5xx, mid-deploy 404 — keep the session and say so.
        setPhase('error')
        setLoadError(e?.message || 'Could not reach the Keep')
      }
      inFlight.current = false
      return
    }
    const prog = await api.get('/progress').catch(() => ({ solved: [], unlocked: [] }))
    setProgress(prog)
    setLoadError('')
    if (!status.introComplete) { setPhase('A') }
    else if (!user?.sorted) { setPhase('B') }
    else { setPhase('C') }
    inFlight.current = false
  }, [user?.sorted, nav, setUser])

  useEffect(() => { load() }, [load])

  // set the house theme once sorted
  useEffect(() => {
    if (user?.house) document.body.dataset.house = user.house
  }, [user?.house])

  // Phase B: trigger the sorting ceremony
  const runCeremony = useCallback(async () => {
    const { house } = await api.post('/house/assign')
    setAssignedHouse(house)
    // reveal, then after 5s set theme + reload so themed hub loads cleanly
    setTimeout(async () => {
      document.body.dataset.house = house
      await refresh()
      window.location.reload()
    }, 5000)
  }, [refresh])

  if (phase === 'error') {
    return (
      <div className="bk-loading" style={{ flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
        <div>{loadError}</div>
        <button
          className="bk-code-btn"
          onClick={() => { setPhase('loading'); setLoadError(''); load() }}
        >
          Try again
        </button>
      </div>
    )
  }

  if (phase === 'loading') return <div className="bk-loading">Entering the keep…</div>

  if (phase === 'B') {
    return <SortingCeremony house={assignedHouse} onStart={runCeremony} />
  }

  if (phase === 'C' && user?.house) {
    return (
      <div className="bk-dashboard" data-house={user.house}>
        <ThemeStage house={user.house}>
          <HubShell user={user}>
            <div className="bk-gates">
              {progress.unlocked.length === 0 ? (
                <DungeonsComing house={user.house} />
              ) : (
                <div className="unlocked-gates-grid">
                  {progress.unlocked.map((dungeonId) => (
                    <div
                      key={dungeonId}
                      className="gate-card active-gate thaw-in"
                      onClick={() => nav(`/dungeons/${dungeonId}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') nav(`/dungeons/${dungeonId}`) }}
                    >
                      <StoneGate status={progress.solved.includes(dungeonId) ? 'open' : 'unlocking'} />
                      <span className="gate-name">{dungeonId}</span>
                      <span className="gate-status-pill">
                        {progress.solved.includes(dungeonId) ? 'Conquered' : 'Enter Chamber'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </HubShell>
        </ThemeStage>
      </div>
    )
  }

  if (phase === 'A') {
    return (
      <div className="bk-dashboard">
        <QuestMapHub user={user} />
      </div>
    )
  }

  // Fallback: sorted but no house on the user object yet (mid-refresh).
  return (
    <div className="bk-dashboard" data-house={user?.house || undefined}>
      <ParticleField mode="cavern" />
      <HubShell user={user}>
        {phase === 'C' && (
          <div className="bk-gates">
            {progress.unlocked.length === 0 && <DungeonsComing house={user?.house} />}
          </div>
        )}
      </HubShell>
    </div>
  )
}
