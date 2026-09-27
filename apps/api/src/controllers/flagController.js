import Progress from '../models/Progress.js'
import DungeonState from '../models/DungeonState.js'
import { checkFlag, flagFor } from '../utils/flags.js'
import { INTRO_ROOMS } from './introController.js'

// Rooms whose flag the server will hand to its owner on request. The nine
// introduction scenes are client-side teasers: there is no server-side proof
// that a student solved one, so the scene itself decides when to ask. What the
// endpoint guarantees is that the flag it returns belongs to *this* student and
// nobody else, so a flag passed across the room fails to submit.
//
// Real dungeon rooms are deliberately absent: their flag lives inside the
// container the student exploits, and is never issued by this API.
const REVEALABLE_ROOMS = new Set(INTRO_ROOMS)

// GET /api/flags/for-room/:roomId  (session)
// The caller's own flag for a revealable room. Never another student's: the
// userId in the HMAC is taken from the session, never from the request.
export async function getRoomFlag(req, res) {
  const { roomId } = req.params
  if (!REVEALABLE_ROOMS.has(roomId)) {
    return res.status(404).json({ error: 'no_flag_for_room' })
  }
  return res.json({ roomId, flag: flagFor(req.user._id.toString(), roomId) })
}

// POST /api/flags/submit  (session)
export async function submitFlag(req, res) {
  const { roomId, flag } = req.body
  if (!roomId || !flag) return res.status(400).json({ error: 'roomId and flag required' })
  const correct = checkFlag(req.user._id.toString(), roomId, flag)
  if (!correct) return res.json({ correct: false })
  await Progress.updateOne(
    { userId: req.user._id, roomId },
    { $setOnInsert: { solvedAt: new Date() } },
    { upsert: true }
  )

  // An introduction scene cleared by flag also counts toward introComplete, so
  // the scene does not need a second round trip to /api/intro/complete.
  if (INTRO_ROOMS.includes(roomId)) {
    const u = req.user
    if (!u.introRooms.includes(roomId)) u.introRooms.push(roomId)
    if (INTRO_ROOMS.every((r) => u.introRooms.includes(r))) u.introComplete = true
    await u.save()
    return res.json({
      correct: true,
      introRooms: u.introRooms,
      introComplete: u.introComplete,
    })
  }

  return res.json({ correct: true })
}

// GET /api/progress  (session)
export async function getProgress(req, res) {
  const solved = await Progress.find({ userId: req.user._id }).select('roomId -_id')
  const live = await DungeonState.find({ live: true }).select('dungeonId -_id')
  return res.json({
    solved: solved.map((s) => s.roomId),
    unlocked: live.map((d) => d.dungeonId),
  })
}
