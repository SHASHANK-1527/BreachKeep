import User from '../models/User.js'
import Progress from '../models/Progress.js'
import DungeonState from '../models/DungeonState.js'
import { INTRO_ROOMS } from './introController.js'

const HOUSES = ['rimeguard', 'emberkeep', 'arcweave', 'voltgrid']
const DUNGEONS = ['terminal-1', 'terminal-2', 'network', 'web', 'secure-coding', 'capstone']

// Everything the test panel needs to draw itself, in one call.
async function snapshot(user) {
  const solved = await Progress.find({ userId: user._id }).select('roomId -_id')
  const live = await DungeonState.find({ live: true }).select('dungeonId -_id')
  const agg = await User.aggregate([
    { $match: { house: { $ne: null } } },
    { $group: { _id: '$house', n: { $sum: 1 } } },
  ])
  const houseCounts = Object.fromEntries(HOUSES.map((h) => [h, 0]))
  for (const row of agg) houseCounts[row._id] = row.n

  return {
    testMode: true,
    user: {
      username: user.username,
      email: user.email,
      house: user.house,
      sorted: user.sorted,
      introComplete: user.introComplete,
      introRooms: user.introRooms,
    },
    introTotal: INTRO_ROOMS.length,
    introRooms: INTRO_ROOMS,
    // Which dashboard phase the frontend will land in, so the panel can show it.
    phase: !user.introComplete ? 'A — intro not finished'
      : !user.sorted ? 'B — sorting ceremony'
      : 'C — themed hub',
    solved: solved.map((s) => s.roomId),
    liveDungeons: live.map((d) => d.dungeonId),
    houseCounts,
    houses: HOUSES,
    dungeons: DUNGEONS,
  }
}

// GET /api/dev/state
export async function devState(req, res) {
  return res.json(await snapshot(req.user))
}

// POST /api/dev/intro  { complete: true|false }
// Fills in or clears all nine intro rooms. Does NOT sort — that is the point,
// it leaves you sitting exactly at the ceremony.
export async function devIntro(req, res) {
  const u = req.user
  const complete = req.body.complete !== false
  u.introRooms = complete ? [...INTRO_ROOMS] : []
  u.introComplete = complete
  if (!complete) { u.house = null; u.sorted = false }
  await u.save()
  return res.json(await snapshot(u))
}

// POST /api/dev/unsort
// Keeps the intro finished, throws away the house. Reload the dashboard and the
// ceremony runs again from the top. Re-runnable as often as you like.
export async function devUnsort(req, res) {
  const u = req.user
  u.house = null
  u.sorted = false
  await u.save()
  return res.json(await snapshot(u))
}

// POST /api/dev/house  { house }
// Forces one house, skipping the draw — for looking at all four themes.
export async function devHouse(req, res) {
  const { house } = req.body
  if (!HOUSES.includes(house)) return res.status(400).json({ error: `house must be one of ${HOUSES.join(', ')}` })
  const u = req.user
  u.house = house
  u.sorted = true
  u.introComplete = true
  if (u.introRooms.length < INTRO_ROOMS.length) u.introRooms = [...INTRO_ROOMS]
  await u.save()
  return res.json(await snapshot(u))
}

// POST /api/dev/dungeons  { dungeonId, live }
// Writes DungeonState directly. The admin panel's version calls the provisioner
// and fails with a 502 when it isn't running, which it never is locally — this
// is how you get gates onto the themed hub.
export async function devDungeon(req, res) {
  const { dungeonId, live } = req.body
  if (!DUNGEONS.includes(dungeonId)) return res.status(400).json({ error: 'unknown dungeon' })
  await DungeonState.updateOne(
    { dungeonId },
    { $set: { live: !!live, updatedAt: new Date() } },
    { upsert: true }
  )
  return res.json(await snapshot(req.user))
}

// POST /api/dev/reset
// Back to a freshly verified account: no intro, no house, no solved rooms.
export async function devReset(req, res) {
  const u = req.user
  await Progress.deleteMany({ userId: u._id })
  u.introRooms = []
  u.introComplete = false
  u.house = null
  u.sorted = false
  await u.save()
  return res.json(await snapshot(u))
}
