import User from '../models/User.js'
import Progress from '../models/Progress.js'
import DungeonState from '../models/DungeonState.js'
import { INTRO_ROOMS } from './introController.js'

const HOUSES = ['rimeguard', 'emberkeep', 'arcweave', 'voltgrid']
const DUNGEONS = ['terminal-1', 'terminal-2', 'network', 'web', 'secure-coding', 'capstone']

// Everything the test panel needs to draw itself, in one call.
async function snapshot(user) {
  const solved = await Progress.find({ userId: user._id }).select('roomId -_id')
  const globalLive = await DungeonState.find({ live: true }).select('dungeonId -_id')
  const globalLiveIds = globalLive.map((d) => d.dungeonId)
  const userTestIds = user.testDungeons || []
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
      testDungeons: userTestIds,
    },
    introTotal: INTRO_ROOMS.length,
    introRooms: INTRO_ROOMS,
    // Which dashboard phase the frontend will land in, so the panel can show it.
    phase: !user.introComplete ? 'A — intro not finished'
      : !user.sorted ? 'B — sorting ceremony'
      : 'C — themed hub',
    solved: solved.map((s) => s.roomId),
    liveDungeons: userTestIds,
    globalLiveDungeons: globalLiveIds,
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
// Toggles a dungeon live ONLY for this account (test mode).
// Does NOT touch global DungeonState — global releases can only be made in the admin panel.
export async function devDungeon(req, res) {
  const { dungeonId, live } = req.body
  if (!DUNGEONS.includes(dungeonId)) return res.status(400).json({ error: 'unknown dungeon' })
  const u = req.user
  if (!Array.isArray(u.testDungeons)) u.testDungeons = []
  if (live) {
    if (!u.testDungeons.includes(dungeonId)) u.testDungeons.push(dungeonId)
  } else {
    u.testDungeons = u.testDungeons.filter((d) => d !== dungeonId)
  }
  await u.save()
  return res.json(await snapshot(u))
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
  u.testDungeons = []
  await u.save()
  return res.json(await snapshot(u))
}
