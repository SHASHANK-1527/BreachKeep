import { useParams } from 'react-router-dom'
import { useAuth } from '../app/AuthContext.jsx'
import FlagSubmit from '../components/FlagSubmit.jsx'

// Room list + room view for a dungeon. Per-room content is built weekly under
// features/dungeons/<id>/. This is the shared shell each room plugs into.
export default function Dungeon() {
  const { dungeonId } = useParams()
  const { user } = useAuth()
  return (
    <div className="bk-dungeon" data-house={user?.house || undefined}>
      <h1 className="bk-dungeon-title">{dungeonId}</h1>
      <p className="bk-note">
        Rooms for this dungeon are added under <code>features/dungeons/{dungeonId}</code>.
        Each room renders a scenario + a terminal/app + the shared flag box below.
      </p>
      <FlagSubmit roomId={`${dungeonId}-sample`} />
    </div>
  )
}
