import { useParams } from 'react-router-dom'
import { useAuth } from '../app/AuthContext.jsx'
import { getDungeon } from '../features/dungeons/index.js'
import DungeonView from '../features/dungeons/DungeonView.jsx'
import CapstoneView from '../features/dungeons/capstone/CapstoneView.jsx'
import FlagSubmit from '../components/FlagSubmit.jsx'

// A dungeon with built frontend content renders through DungeonView (room list,
// tiers, hints, terminal, flag). Capstone is a single shared target box, not a
// tiered room set, so it has its own view. Anything else keeps the old stub.
export default function Dungeon() {
  const { dungeonId } = useParams()
  const { user } = useAuth()

  if (dungeonId === 'capstone') return <CapstoneView />

  if (getDungeon(dungeonId)) {
    return <DungeonView dungeonId={dungeonId} />
  }

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
