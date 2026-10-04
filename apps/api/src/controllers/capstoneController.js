import AccessConfig from '../models/AccessConfig.js'

// GET /api/labs/capstone  (session)
// Tells the capstone dungeon page whether the target box is armed, and if so,
// how to reach it. The student attacks it from their own Kali VM.
export async function getCapstone(req, res) {
  const cfg = await AccessConfig.get()
  const armed = !!cfg.capstoneArmed
  const host = process.env.CAPSTONE_TARGET_HOST || cfg.capstoneTargetHost || req.hostname
  const web = process.env.CAPSTONE_WEB_PORT || '8088'
  const ssh = process.env.CAPSTONE_SSH_PORT || '2222'
  const target = armed ? { host, web, ssh } : null
  return res.json({ armed, target, host, web, ssh })
}
