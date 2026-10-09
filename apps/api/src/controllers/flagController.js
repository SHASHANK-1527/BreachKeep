import Progress from '../models/Progress.js'
import DungeonState from '../models/DungeonState.js'
import { checkFlag, flagFor, isDecoyFlag } from '../utils/flags.js'
import { INTRO_ROOMS } from './introController.js'
import { judgeCapstone, CAPSTONE_ROOM } from '../config/capstone.js'

// Rooms whose flag the server will hand to its owner on request. The nine
// introduction scenes are client-side teasers: there is no server-side proof
// that a student solved one, so the scene itself decides when to ask. What the
// endpoint guarantees is that the flag it returns belongs to *this* student and
// nobody else, so a flag passed across the room fails to submit.
//
// Real dungeon rooms are deliberately absent: their flag lives inside the
// container the student exploits, and is never issued by this API.
const REVEALABLE_ROOMS = new Set(INTRO_ROOMS)

// Server-side rate limiting: max 6 attempts per 60 seconds per student per room
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const MAX_ATTEMPTS_PER_WINDOW = 6
const submissionHistory = new Map() // key: `${userId}:${roomId}` -> [timestamp, ...]

function isSubmissionRateLimited(userId, roomId) {
  const key = `${userId}:${roomId}`
  const now = Date.now()
  const history = submissionHistory.get(key) || []
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const recent = history.filter((ts) => ts > windowStart)
  if (recent.length >= MAX_ATTEMPTS_PER_WINDOW) {
    return true
  }
  recent.push(now)
  submissionHistory.set(key, recent)
  return false
}

// GET /api/flags/for-room/:roomId  (session)
// The caller's own flag for a revealable room. Never another student's: the
// userId in the HMAC is taken from the session, never from the request.
export function getRoomFlag(req, res) {
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

  const userId = req.user._id.toString()
  if (isSubmissionRateLimited(userId, roomId)) {
    return res.status(429).json({ error: 'Too many flag submission attempts. Please slow down and try again shortly.' })
  }

  // Capstone target box: supports both fixed CAPSTONE_FLAG and per-student/team
  // HMAC flags, and known decoy flags return path-aware hints.
  if (roomId === CAPSTONE_ROOM) {
    const r = judgeCapstone(flag, userId)
    if (r.correct) {
      await Progress.updateOne(
        { userId: req.user._id, roomId },
        { $setOnInsert: { solvedAt: new Date() } },
        { upsert: true }
      )
      return res.json({ correct: true })
    }
    return res.json({ correct: false, hint: r.hint })
  }
  const correct = checkFlag(req.user._id.toString(), roomId, flag)
  if (!correct) {
    // Decoy flags in standard challenge rooms return generic false (no oracle hint)
    return res.json({ correct: false })
  }
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
  const globalUnlocked = live.map((d) => d.dungeonId)
  const userTestUnlocked = req.user?.testDungeons || []
  const unlocked = Array.from(new Set([...globalUnlocked, ...userTestUnlocked]))
  return res.json({
    solved: solved.map((s) => s.roomId),
    unlocked,
  })
}
