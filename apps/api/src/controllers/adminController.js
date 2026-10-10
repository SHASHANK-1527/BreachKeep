import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import AccessConfig from '../models/AccessConfig.js'
import Roster from '../models/Roster.js'
import DungeonState from '../models/DungeonState.js'
import User from '../models/User.js'
import Progress from '../models/Progress.js'
import { labClient } from '../utils/labClient.js'
import { houseCounts as _houseCounts } from './houseController.js'
import { cookieOpts } from '../config/env.js'
import { invalidateMaintenanceCache } from '../middleware/maintenance.js'
import { INTRO_ROOMS } from './introController.js'

const MAX_LIVE = 2

// POST /api/admin/login  { password }
export async function adminLogin(req, res) {
  const { password } = req.body
  let hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) return res.status(500).json({ error: 'Admin password not configured' })
  // collapse $$ -> $ in case the hash was doubled in .env (see config/env.js)
  while (hash.includes('$$')) hash = hash.replace(/\$\$/g, '$')
  let ok = false
  try { ok = await bcrypt.compare(password || '', hash) } catch { ok = false }
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
  const agg = await User.aggregate([
    { $match: { house: { $ne: null } } },
    { $group: { _id: '$house', n: { $sum: 1 } } },
  ])

  let capstoneRunning = false
  if (cfg.capstoneArmed) {
    try {
      const capStatus = await labClient.capstone('status')
      capstoneRunning = !!capStatus?.running
    } catch {}
  }

  return res.json({
    commonCodeEnabled: cfg.commonCodeEnabled,
    dailyCodeEnabled: !!cfg.dailyCodeEnabled,
    rosterGateEnabled: cfg.rosterGateEnabled,
    maintenance: !!cfg.maintenance,
    capstoneArmed: !!cfg.capstoneArmed,
    capstoneTargetHost: cfg.capstoneTargetHost || '',
    capstoneWebPort: process.env.CAPSTONE_WEB_PORT || '8088',
    capstoneSshPort: process.env.CAPSTONE_SSH_PORT || '2222',
    capstoneRunning,
    testingEnabled: !!cfg.testingEnabled,
    maintenanceMessage: cfg.maintenanceMessage || '',
    maintenanceEta: cfg.maintenanceEta || '',
    dungeons,
    houseCounts: Object.fromEntries(agg.map((r) => [r._id, r.n])),
  })
}

// ---- students ----

// Escape user input before building a RegExp, so a query like "a(" cannot
// throw or match everything.
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const STUDENT_FIELDS = '-password -googleId -sessionCode -sessionCodeExpires -resetToken -resetTokenExpires'

// GET /api/admin/students?q=
export async function adminStudents(req, res) {
  const q = String(req.query.q || '').trim()
  const filter = q
    ? { $or: [{ username: new RegExp(escapeRegex(q), 'i') }, { email: new RegExp(escapeRegex(q), 'i') }] }
    : {}

  const users = await User.find(filter).select(STUDENT_FIELDS).sort({ createdAt: -1 }).limit(300)

  // Attach solve counts in one aggregation instead of N per-user queries.
  const solvedBy = await Progress.aggregate([
    { $match: { userId: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$userId', n: { $sum: 1 } } },
  ])
  const nBy = new Map(solvedBy.map((r) => [String(r._id), r.n]))

  return res.json({
    total: users.length,
    students: users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      house: u.house,
      sorted: u.sorted,
      introComplete: u.introComplete,
      verified: u.verified,
      hasGoogle: !!u.googleId,
      testingRights: !!u.testingRights,
      solved: nBy.get(String(u._id)) || 0,
      createdAt: u.createdAt,
    })),
  })
}

// GET /api/admin/students/:id
export async function adminStudentDetail(req, res) {
  const user = await User.findById(req.params.id).select(STUDENT_FIELDS)
  if (!user) return res.status(404).json({ error: 'Student not found' })
  const progress = await Progress.find({ userId: user._id }).sort({ solvedAt: 1 })
  return res.json({
    student: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      house: user.house,
      sorted: user.sorted,
      introComplete: user.introComplete,
      verified: user.verified,
      hasGoogle: !!user.googleId,
      testingRights: !!user.testingRights,
      createdAt: user.createdAt,
    },
    progress: progress.map((p) => ({ roomId: p.roomId, solvedAt: p.solvedAt })),
  })
}

// POST /api/admin/students/:id/house  { house }
export async function adminAssignHouse(req, res) {
  const { house } = req.body
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Student not found' })

  if (!house || house === 'unsorted') {
    user.house = null
    user.sorted = false
    await user.save()
    return res.json({ ok: true, house: null, sorted: false, introComplete: user.introComplete })
  }

  if (!['rimeguard', 'emberkeep', 'arcweave', 'voltgrid'].includes(house))
    return res.status(400).json({ error: 'house must be rimeguard, emberkeep, arcweave, voltgrid or unsorted' })

  user.house = house
  user.sorted = true
  // Sorting normally implies the intro was done; keep the two consistent.
  user.introComplete = true
  await user.save()
  return res.json({ ok: true, house, sorted: true, introComplete: true })
}

// POST /api/admin/students/:id/reset-progress
export async function adminResetProgress(req, res) {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Student not found' })
  const { deletedCount } = await Progress.deleteMany({ userId: user._id })
  user.introRooms = []
  user.introComplete = false
  await user.save()
  return res.json({ ok: true, removed: deletedCount })
}

// POST /api/admin/students/:id/delete
export async function adminDeleteStudent(req, res) {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Student not found' })
  await Promise.all([Progress.deleteMany({ userId: user._id }), user.deleteOne()])
  return res.json({ ok: true })
}

// POST /api/admin/common-code  { enabled }
export async function setCommonCode(req, res) {
  const cfg = await AccessConfig.get()
  cfg.commonCodeEnabled = !!req.body.enabled
  cfg.updatedAt = new Date()
  await cfg.save()
  return res.json({ ok: true, commonCodeEnabled: cfg.commonCodeEnabled })
}

// POST /api/admin/daily-code  { enabled }
export async function setDailyCode(req, res) {
  const cfg = await AccessConfig.get()
  cfg.dailyCodeEnabled = !!req.body.enabled
  cfg.updatedAt = new Date()
  await cfg.save()
  return res.json({ ok: true, dailyCodeEnabled: cfg.dailyCodeEnabled })
}

// POST /api/admin/maintenance  { enabled, message?, eta? }
// The kill switch. Flipping this on makes every student-facing API route answer
// 503 and both web bundles render the maintenance page. Admin stays reachable.
export async function setMaintenance(req, res) {
  const cfg = await AccessConfig.get()
  cfg.maintenance = !!req.body.enabled
  if (typeof req.body.message === 'string') cfg.maintenanceMessage = req.body.message.slice(0, 400)
  if (typeof req.body.eta === 'string') cfg.maintenanceEta = req.body.eta.slice(0, 120)
  cfg.updatedAt = new Date()
  await cfg.save()
  invalidateMaintenanceCache()
  console.log(`[admin] maintenance ${cfg.maintenance ? 'ON — site closed' : 'OFF — site open'}`)
  return res.json({
    ok: true,
    maintenance: cfg.maintenance,
    maintenanceMessage: cfg.maintenanceMessage,
    maintenanceEta: cfg.maintenanceEta,
  })
}

// POST /api/admin/roster-gate  { enabled }
export async function setRosterGate(req, res) {
  const cfg = await AccessConfig.get()
  cfg.rosterGateEnabled = !!req.body.enabled
  cfg.updatedAt = new Date()
  await cfg.save()
  return res.json({ ok: true, rosterGateEnabled: cfg.rosterGateEnabled })
}

// GET /api/admin/roster
export async function getRoster(req, res) {
  const emails = await Roster.find().select('email -_id').sort({ email: 1 })
  return res.json({ total: emails.length, emails: emails.map((e) => e.email) })
}

// POST /api/admin/roster-remove  { emails: [] }
export async function removeFromRoster(req, res) {
  const emails = (req.body.emails || []).map((e) => String(e).toLowerCase().trim()).filter(Boolean)
  if (!emails.length) return res.status(400).json({ error: 'No emails given' })
  const { deletedCount } = await Roster.deleteMany({ email: mongoose.trusted({ $in: emails }) })
  return res.json({ ok: true, removed: deletedCount })
}

// GET /api/admin/overview
export async function adminOverview(req, res) {
  const [students, verified, sorted, live, solved, unsorted] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ verified: true }),
    User.countDocuments({ sorted: true }),
    DungeonState.countDocuments({ live: true }),
    Progress.countDocuments({}),
    User.countDocuments({ sorted: false }),
  ])

  const houseAgg = await User.aggregate([
    { $match: { house: { $ne: null } } },
    { $group: { _id: '$house', n: { $sum: 1 } } },
  ])

  return res.json({
    students, verified, sorted, unsorted, live, solved,
    houses: Object.fromEntries(houseAgg.map((r) => [r._id, r.n])),
  })
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
    const liveCount = await DungeonState.countDocuments({ live: true, dungeonId: mongoose.trusted({ $ne: dungeonId }) })
    if (liveCount >= MAX_LIVE)
      return res.status(400).json({ error: `At most ${MAX_LIVE} dungeons can be live at once` })
  }

  await DungeonState.updateOne(
    { dungeonId },
    { $set: { live: !!live, updatedAt: new Date() } },
    { upsert: true }
  )

  // notify provisioner (best-effort; non-blocking failure)
  try {
    await labClient.setDungeon(dungeonId, !!live)
  } catch (e) {
    console.warn(`[admin] provisioner notification for dungeon ${dungeonId} warning:`, e.message)
  }
  return res.json({ ok: true, dungeonId, live: !!live })
}

// POST /api/admin/capstone  { armed?, host? }
// Arms/disarms the capstone target box: flips the state the dungeon page reads,
// and tells the provisioner to start/stop the single shared target container.
export async function setCapstone(req, res) {
  const cfg = await AccessConfig.get()
  if (typeof req.body.armed === 'boolean') cfg.capstoneArmed = req.body.armed
  if (typeof req.body.host === 'string') cfg.capstoneTargetHost = req.body.host.trim().slice(0, 200)
  cfg.updatedAt = new Date()
  await cfg.save()

  let capRunning = false
  try {
    const r = await labClient.capstone(cfg.capstoneArmed ? 'start' : 'stop')
    capRunning = cfg.capstoneArmed ? !!r?.started : false
  } catch (e) {
    console.warn('[admin] capstone container control warning:', e.message)
  }
  console.log(`[admin] capstone ${cfg.capstoneArmed ? 'ARMED — target box up' : 'disarmed — target box down'}`)
  return res.json({
    ok: true,
    capstoneArmed: cfg.capstoneArmed,
    capstoneTargetHost: cfg.capstoneTargetHost,
    capstoneRunning: capRunning,
  })
}

// ---- testing tools (Warden) ----
const DUNGEON_ROOM_PREFIX = {
  'terminal-1': 'terminal-1-', 'terminal-2': 'terminal-2-', 'network': 'network-',
  'web': 'web-', 'secure-coding': 'secure-', 'capstone': 'capstone-',
}

async function testingGate(res) {
  const cfg = await AccessConfig.get()
  if (!cfg.testingEnabled) { res.status(403).json({ error: 'Testing tools are disabled' }); return null }
  return cfg
}

// POST /api/admin/testing { enabled }
export async function setTesting(req, res) {
  const cfg = await AccessConfig.get()
  cfg.testingEnabled = !!req.body.enabled
  cfg.updatedAt = new Date()
  await cfg.save()
  return res.json({ ok: true, testingEnabled: cfg.testingEnabled })
}

// POST /api/admin/test/intro { id, action: 'complete'|'reset' }
export async function testIntro(req, res) {
  if (!(await testingGate(res))) return
  const { id, action } = req.body
  const user = await User.findById(id)
  if (!user) return res.status(404).json({ error: 'Student not found' })
  if (action === 'complete') { user.introComplete = true; user.introRooms = [...INTRO_ROOMS] }
  else if (action === 'reset') {
    // Full restart: clear the intro AND send them back before the sorting
    // ceremony, so the dashboard actually returns to the introduction (phase A)
    // instead of staying on the themed hub.
    user.introComplete = false
    user.introRooms = []
    user.house = null
    user.sorted = false
  }
  else return res.status(400).json({ error: "action must be 'complete' or 'reset'" })
  await user.save()
  return res.json({ ok: true, introComplete: user.introComplete })
}

// POST /api/admin/test/reset-dungeon { id, dungeonId }
export async function testResetDungeon(req, res) {
  if (!(await testingGate(res))) return
  const { id, dungeonId } = req.body
  const prefix = DUNGEON_ROOM_PREFIX[dungeonId]
  if (!prefix) return res.status(400).json({ error: 'unknown dungeon' })
  const user = await User.findById(id)
  if (!user) return res.status(404).json({ error: 'Student not found' })
  const { deletedCount } = await Progress.deleteMany({ userId: user._id, roomId: new RegExp('^' + prefix) })
  return res.json({ ok: true, removed: deletedCount })
}

// POST /api/admin/test/grant { id, enabled }
// Grant or revoke a particular account's testing rights. While the Warden has
// testing enabled, a granted account sees the floating test panel (lower-right)
// on the live site. Revoking (or turning global testing off) hides it again.
export async function setTestingGrant(req, res) {
  if (!(await testingGate(res))) return
  const { id, enabled } = req.body
  const user = await User.findById(id)
  if (!user) return res.status(404).json({ error: 'Student not found' })
  user.testingRights = !!enabled
  await user.save()
  return res.json({ ok: true, testingRights: user.testingRights })
}
