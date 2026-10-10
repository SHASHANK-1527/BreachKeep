import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AccessConfig from '../models/AccessConfig.js'
import { safeEqual } from '../utils/flags.js'
import { getMidnightISTExpiry, getTodayIST, generateSessionCode } from '../utils/auth.js'
import { sendSessionCodeEmail } from '../utils/email.js'
import { cookieOpts } from '../config/env.js'

function setGate(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '16h' })
  res.cookie('bk_gate', token, { ...cookieOpts(), maxAge: 16 * 60 * 60 * 1000 })
}

// POST /api/auth/verify-access-code  (no gate)
export async function verifyAccessCode(req, res) {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Enter an access code' })

  // 1. admin landing code -> redirect target (no gate cookie)
  if (safeEqual(code, process.env.ADMIN_LANDING_CODE)) {
    return res.json({ redirect: process.env.ADMIN_SECRET_PATH })
  }

  // 2. common code (only if enabled) -> register mode
  const cfg = await AccessConfig.get()
  if (cfg.commonCodeEnabled && safeEqual(code, process.env.COMMON_ACCESS_CODE)) {
    setGate(res, { mode: 'register' })
    return res.json({ ok: true, next: '/enter' })
  }

  // 3. if an existing student email is entered -> allow access to /enter
  const existingUser = await User.findOne({ email: code.trim().toLowerCase() })
  if (existingUser) {
    setGate(res, { mode: 'session' })
    return res.json({ ok: true, next: '/enter' })
  }

  // 4. a personal daily code -> session mode
  // mongoose.trusted(): server.js enables sanitizeFilter, which would otherwise
  // turn this operator into a literal match and silently break the query.
  const user = await User.findOne({ sessionCode: code.trim().toUpperCase(), sessionCodeExpires: mongoose.trusted({ $gt: new Date() }) })
  if (user) {
    setGate(res, { mode: 'session', code })
    return res.json({ ok: true, next: '/enter' })
  }

  return res.status(403).json({ error: 'Invalid access code' })
}

// POST /api/access/resend-daily  (no gate, rate-limited, non-enumerating)
export async function resendDaily(req, res) {
  const { email } = req.body
  const generic = { ok: true }
  try {
    const user = await User.findOne({ email: (email || '').toLowerCase(), verified: true })
    if (user) {
      // Mint a fresh code when today's has lapsed. Previously this endpoint
      // only ever re-sent an already-valid code, so a student who missed the
      // midnight email — or whose code expired mid-class — had no way back in.
      const valid = user.sessionCode && user.sessionCodeExpires > new Date()
      if (!valid) {
        user.sessionCode = generateSessionCode()
        user.sessionCodeExpires = getMidnightISTExpiry()
        user.lastSessionDate = getTodayIST()
        await user.save()
      }
      await sendSessionCodeEmail(user.email, user.sessionCode)
    }
  } catch (e) {
    console.error('resendDaily', e)
  }
  return res.json(generic) // identical response whether or not the account exists
}
