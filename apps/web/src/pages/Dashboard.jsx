import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'
import HubShell from '../shell/HubShell.jsx'
import IntroButton from '../shell/IntroButton.jsx'
import CagedGates from '../shell/CagedGates.jsx'
import SortingCeremony from '../shell/SortingCeremony.jsx'
import ParticleField from '../sanctum/ParticleField.jsx'
import StoneGate from '../sanctum/StoneGate.jsx'
import ThemeStage from '../shell/styles/themes/ThemeStage.jsx'

// State machine:
//  A) introComplete=false            -> intro button + caged, dulled gates
//  B) introComplete=true, sorted=false, returning -> run sorting ceremony
//  C) sorted=true                    -> full house-themed hub
export default function Dashboard() {
  const nav = useNavigate()
  const { user, refresh } = useAuth()
  const [progress, setProgress] = useState({ solved: [], unlocked: [] })
  const [phase, setPhase] = useState('loading')
  const [assignedHouse, setAssignedHouse] = useState(null)

  const load = useCallback(async () => {
    let status
    try {
      status = await api.get('/intro/status')
    } catch {
      // Session is gone (account deleted, cookie expired, logged out in another
      // tab). Without this the rejection left phase stuck on 'loading' forever.
      sessionStorage.removeItem('bk_has_access')
      nav('/enter', { replace: true })
      return
    }
    const prog = await api.get('/progress').catch(() => ({ solved: [], unlocked: [] }))
    setProgress(prog)
    if (!status.introComplete) { setPhase('A'); return }
    if (status.introComplete && !user?.sorted) { setPhase('B'); return }
    setPhase('C')
  }, [user?.sorted, nav])

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
                <div className="bk-no-dungeons-card thaw-in">
                  <h3 style={{ margin: '0 0 0.5rem', color: 'var(--house-accent, #ffdca8)', letterSpacing: '0.06em' }}>
                    Chambers Awaiting Trial
                  </h3>
                  <p className="bk-note" style={{ margin: 0 }}>
                    No dungeons are live yet. Check back before class.
                  </p>
                </div>
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

  return (
    <div className="bk-dashboard" data-house={user?.house || undefined}>
      <ParticleField mode="cavern" />
      <HubShell user={user}>
        {phase === 'A' && (
          <>
            <IntroButton onClick={() => nav('/dashboard/introduction')} />
            <CagedGates />
          </>
        )}
        {phase === 'C' && (
          <div className="bk-gates">
            {progress.unlocked.length === 0 && <p className="bk-note">No dungeons are live yet. Check back before class.</p>}
          </div>
        )}
      </HubShell>
    </div>
  )
}
