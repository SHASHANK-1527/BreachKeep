import Progress from '../models/Progress.js'
import DungeonState from '../models/DungeonState.js'
import { checkFlag } from '../utils/flags.js'

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
