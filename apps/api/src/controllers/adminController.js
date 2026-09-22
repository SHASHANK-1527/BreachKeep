import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import AccessConfig from '../models/AccessConfig.js'
import Roster from '../models/Roster.js'
import DungeonState from '../models/DungeonState.js'
import { labClient } from '../utils/labClient.js'
import { houseCounts as _houseCounts } from './houseController.js'
import { cookieOpts } from '../config/env.js'

const MAX_LIVE = 2

// POST /api/admin/login  { password }
export async function adminLogin(req, res) {
  const { password } = req.body
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) return res.status(500).json({ error: 'Admin password not configured' })
  const ok = await bcrypt.compare(password || '', hash)
  if (!ok) return res.status(401).json({ error: 'Wrong password' })
  const token = jwt.sign({ scope: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' })
  res.cookie('bk_admin', token, { ...cookieOpts(), maxAge: 8 * 60 * 60 * 1000 })
  return res.json({ ok: true })
}

export async function adminLogout(req, res) {
  res.clearCookie('bk_admin', cookieOpts())
  return res.json({ ok: true })
}

// GET /api/admin/where  -> the secret path (only after admin login)
export async function adminWhere(req, res) {
  return res.json({ path: process.env.ADMIN_SECRET_PATH })
}

// GET /api/admin/state
export async function adminState(req, res) {
  const cfg = await AccessConfig.get()
  const dungeons = await DungeonState.find().select('dungeonId live -_id')
  const agg = await import('../models/User.js').then(async ({ default: User }) => {
    const rows = await User.aggregate([
      { $match: { house: { $ne: null } } },
      { $group: { _id: '$house', n: { $sum: 1 } } },
    ])
    return Object.fromEntries(rows.map((r) => [r._id, r.n]))
  })
  return res.json({
    commonCodeEnabled: cfg.commonCodeEnabled,
    rosterGateEnabled: cfg.rosterGateEnabled,
    dungeons,
    houseCounts: agg,
  })
}

// POST /api/admin/common-code  { enabled }
export async function setCommonCode(req, res) {
  const cfg = await AccessConfig.get()
  cfg.commonCodeEnabled = !!req.body.enabled
  cfg.updatedAt = new Date()
  await cfg.save()
  return res.json({ ok: true, commonCodeEnabled: cfg.commonCodeEnabled })
}

// POST /api/admin/roster-gate  { enabled }
export async function setRosterGate(req, res) {
  const cfg = await AccessConfig.get()
  cfg.rosterGateEnabled = !!req.body.enabled
  cfg.updatedAt = new Date()
  await cfg.save()
  return res.json({ ok: true, rosterGateEnabled: cfg.rosterGateEnabled })
}

// POST /api/admin/roster  { emails: [], mode: 'replace'|'append' }
export async function setRoster(req, res) {
  const emails = (req.body.emails || []).map((e) => String(e).toLowerCase().trim()).filter(Boolean)
  if (req.body.mode === 'replace') await Roster.deleteMany({})
  let added = 0
  for (const email of emails) {
    try { await Roster.updateOne({ email }, { $setOnInsert: { addedAt: new Date() } }, { upsert: true }); added++ }
    catch {}
  }
  const total = await Roster.countDocuments()
  return res.json({ ok: true, added, total })
}

// POST /api/admin/dungeons  { dungeonId, live }
export async function setDungeon(req, res) {
  const { dungeonId, live } = req.body
  if (!dungeonId) return res.status(400).json({ error: 'dungeonId required' })

  if (live) {
    const liveCount = await DungeonState.countDocuments({ live: true, dungeonId: { $ne: dungeonId } })
    if (liveCount >= MAX_LIVE)
      return res.status(400).json({ error: `At most ${MAX_LIVE} dungeons can be live at once` })
  }

  await DungeonState.updateOne(
    { dungeonId },
    { $set: { live: !!live, updatedAt: new Date() } },
    { upsert: true }
  )

  // tell the provisioner to build or tear down (best-effort; report failure)
  try {
    await labClient.setDungeon(dungeonId, !!live)
  } catch (e) {
    return res.status(502).json({ error: 'Saved, but provisioner did not respond', detail: String(e.message) })
  }
  return res.json({ ok: true, dungeonId, live: !!live })
}
