import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/AuthContext.jsx'
import { useCastle } from '../../app/CastleContext.jsx'
import HubProfileMenu from '../../shell/HubProfileMenu.jsx'
import { DOOR_ORDER, NUMERALS, hallFor, dungeonMeta } from './hall/hallConfig.js'
import './dungeons.css'

/**
 * The frame every dungeon page sits in: the student's own house hall, dimmed
 * behind the content, the house accent colour, a way back to the hall, and the
 * profile medallion (the global header is hidden on these pages).
 */
export default function DungeonShell({ dungeonId, children }) {
  const nav = useNavigate()
  const { user } = useAuth()
  const { setCastleView } = useCastle()
  const hall = hallFor(user?.house)
  const idx = DOOR_ORDER.indexOf(dungeonId)
  const meta = dungeonMeta(dungeonId)

  const backToHall = () => {
    setCastleView('gates') // land in the hall, not back outside the fortress
    nav('/dashboard')
  }

  return (
    <div
      className="bkd-scope"
      data-house={user?.house || undefined}
      style={{ '--bkd-accent': hall.accent, '--bkd-glow': hall.glow }}
    >
      <div className="bkd-backdrop" style={{ backgroundImage: `url(${hall.hallImg})` }} aria-hidden="true" />
      <div className="bkd-backdrop-shade" aria-hidden="true" />

      <div className="bkd-topbar">
        <button type="button" className="bkd-hall-btn" onClick={backToHall}>
          <span aria-hidden="true">←</span> The Hall
        </button>
        <span className="bkd-crumb">
          {hall.hallName}
          {idx >= 0 && <> <span aria-hidden="true">/</span> Door {NUMERALS[idx]} · {meta.title}</>}
        </span>
      </div>

      <HubProfileMenu user={user} />

      <div className="bkd-wrap">{children}</div>
    </div>
  )
}
