import crypto from 'crypto'
import User from '../models/User.js'

const HOUSES = ['rimeguard', 'emberkeep', 'arcweave', 'voltgrid']

// POST /api/house/assign  (session) — balanced, server-authoritative, idempotent
export async function assignHouse(req, res) {
  const u = req.user
  if (u.sorted && u.house) return res.json({ house: u.house })          // never re-sort
  if (!u.introComplete) return res.status(409).json({ error: 'Finish the introduction module first' })

  const agg = await User.aggregate([
    { $match: { house: { $ne: null } } },
    { $group: { _id: '$house', n: { $sum: 1 } } },
  ])
  const counts = Object.fromEntries(HOUSES.map((h) => [h, 0]))
  for (const row of agg) counts[row._id] = row.n

  const min = Math.min(...HOUSES.map((h) => counts[h]))
  const candidates = HOUSES.filter((h) => counts[h] === min)
  const chosen = candidates[crypto.randomInt(candidates.length)]

  u.house = chosen
  u.sorted = true
  await u.save()
  return res.json({ house: chosen })
}

// GET /api/house/counts  (admin)
export async function houseCounts(req, res) {
  const agg = await User.aggregate([
    { $match: { house: { $ne: null } } },
    { $group: { _id: '$house', n: { $sum: 1 } } },
  ])
  const counts = Object.fromEntries(HOUSES.map((h) => [h, 0]))
  for (const row of agg) counts[row._id] = row.n
  return res.json({ counts })
}
