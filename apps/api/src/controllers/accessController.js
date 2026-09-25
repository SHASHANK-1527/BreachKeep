import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AccessConfig from '../models/AccessConfig.js'
import { safeEqual } from '../utils/flags.js'
import { getMidnightISTExpiry } from '../utils/auth.js'
import { sendSessionCodeEmail } from '../utils/email.js'
import { cookieOpts } from '../config/env.js'

function setGate(res, payload) {
  const secret = process.env.JWT_SECRET || 'test-mode-secret'
  const token = jwt.sign(payload, secret, { expiresIn: '16h' })
  res.cookie('bk_gate', token, { ...cookieOpts(), maxAge: 16 * 60 * 60 * 1000 })
}

// POST /api/auth/verify-access-code  (no gate)
export async function verifyAccessCode(req, res) {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Enter an access code' })

  if (process.env.TEST_MODE === 'true') {
    setGate(res, { mode: 'register' })
    return res.json({ ok: true, next: '/enter' })
  }

  // 1. admin landing code -> redirect target (no gate cookie)
  if (safeEqual(code, process.env.ADMIN_LANDING_CODE)) {
    return res.json({ redirect: process.env.ADMIN_SECRET_PATH })
  }

  // 2. common code (only if enabled) -> register mode
  try {
    const cfg = await AccessConfig.get()
    if (cfg.commonCodeEnabled && safeEqual(code, process.env.COMMON_ACCESS_CODE)) {
      setGate(res, { mode: 'register' })
      return res.json({ ok: true, next: '/enter' })
    }
  } catch (e) {
    console.warn('AccessConfig lookup failed:', e.message)
  }

  // 3. a personal daily code -> session mode
  try {
    const user = await User.findOne({ sessionCode: code, sessionCodeExpires: { $gt: new Date() } })
    if (user) {
      setGate(res, { mode: 'session', code })
      return res.json({ ok: true, next: '/enter' })
    }
  } catch (e) {
    console.warn('User sessionCode lookup failed:', e.message)
  }

  return res.status(403).json({ error: 'Invalid access code' })
}

// POST /api/access/resend-daily  (no gate, rate-limited, non-enumerating)
export async function resendDaily(req, res) {
  const { email } = req.body
  const generic = { ok: true }
  try {
    const user = await User.findOne({ email: (email || '').toLowerCase(), verified: true })
    if (user && user.sessionCode && user.sessionCodeExpires > new Date()) {
      await sendSessionCodeEmail(user.email, user.sessionCode)
    }
  } catch (e) {
    console.error('resendDaily', e)
  }
  return res.json(generic) // identical response whether or not the account exists
}
