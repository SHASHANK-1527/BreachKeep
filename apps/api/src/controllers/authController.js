import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Roster from '../models/Roster.js'
import AccessConfig from '../models/AccessConfig.js'
import { isValidEmailDomain } from '../utils/emailValidate.js'
import { validatePassword } from '../utils/auth.js'
import { generateCode, sendVerificationEmail } from '../utils/email.js'
import { cookieOpts } from '../config/env.js'

const SESSION_MAXAGE = 7 * 24 * 60 * 60 * 1000

function issueSession(res, user) {
  const token = jwt.sign({ uid: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
  res.cookie('bk_session', token, { ...cookieOpts(), maxAge: SESSION_MAXAGE })
}

async function rosterAllows(email) {
  const cfg = await AccessConfig.get()
  if (!cfg.rosterGateEnabled) return true
  const hit = await Roster.findOne({ email: email.toLowerCase() })
  return !!hit
}

// POST /api/auth/signup  (gate: register)
export async function signup(req, res) {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields required' })

    if (!(await isValidEmailDomain(email)))
      return res.status(400).json({ error: 'Enter a valid, reachable email address' })

    const pw = validatePassword(password)
    if (!pw.valid) return res.status(400).json({ error: pw.error })

    // roster check disabled to match reference behavior
    // if (!(await rosterAllows(email)))
    //   return res.status(403).json({ error: 'This email is not on the course roster' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' })

    const hash = await bcrypt.hash(password, 12)
    const code = generateCode()
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hash,
      verificationCode: code,
      verificationExpires: new Date(Date.now() + 10 * 60 * 1000),
    })
    await sendVerificationEmail(user.email, code)
    return res.status(201).json({ ok: true, email: user.email })
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Username or email already taken' })
    console.error('signup', e)
    return res.status(500).json({ error: 'Signup failed' })
  }
}

// POST /api/auth/verify  (gate: register)
export async function verify(req, res) {
  const { email, code } = req.body
  const user = await User.findOne({ email: (email || '').toLowerCase() })
  if (!user || !user.verificationCode) return res.status(400).json({ error: 'Invalid code' })
  if (user.verificationExpires < new Date()) return res.status(400).json({ error: 'Code expired' })
  if (user.verificationCode !== code) return res.status(400).json({ error: 'Invalid code' })

  user.verified = true
  user.verificationCode = undefined
  user.verificationExpires = undefined
  await user.save()
  issueSession(res, user)
  return res.json({ ok: true, user: user.safe() })
}

// POST /api/auth/login  (gate: session, carrying the typed daily code)
export async function login(req, res) {
  const { email, password } = req.body
  const user = await User.findOne({ email: (email || '').toLowerCase() })
  const generic = () => res.status(401).json({ error: 'Invalid credentials' })

  if (!user || !user.password) return generic()
  if (user.lockUntil && user.lockUntil > new Date())
    return res.status(423).json({ error: 'Account temporarily locked. Try again later.' })
  if (!user.verified) return res.status(403).json({ error: 'Please verify your email first' })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    user.failedLogins += 1
    if (user.failedLogins >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
      user.failedLogins = 0
    }
    await user.save()
    return generic()
  }

  // daily-code match: the code typed on the landing page must be THIS user's current code
  const typed = req.gate?.code
  if (!typed || typed !== user.sessionCode || !user.sessionCodeExpires || user.sessionCodeExpires < new Date())
    return res.status(403).json({ error: "Today's access code does not match this account" })

  user.failedLogins = 0
  user.lockUntil = undefined
  await user.save()
  issueSession(res, user)
  return res.json({ ok: true, user: user.safe() })
}

// GET /api/auth/me  (session)
export async function me(req, res) {
  return res.json({ user: req.user.safe() })
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.clearCookie('bk_session', cookieOpts())
  return res.json({ ok: true })
}

// ---- account routes: identity from req.user, never the body (IDOR fix) ----
export async function updateUsername(req, res) {
  try {
    req.user.username = req.body.username
    await req.user.save()
    return res.json({ ok: true, user: req.user.safe() })
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Username taken' })
    return res.status(500).json({ error: 'Update failed' })
  }
}

export async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  if (!req.user.password) return res.status(400).json({ error: 'Account has no password set' })
  const ok = await bcrypt.compare(currentPassword || '', req.user.password)
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' })
  const pw = validatePassword(newPassword)
  if (!pw.valid) return res.status(400).json({ error: pw.error })
  req.user.password = await bcrypt.hash(newPassword, 12)
  await req.user.save()
  return res.json({ ok: true })
}

export async function updateAvatar(req, res) {
  req.user.avatar = req.body.avatar
  await req.user.save()
  return res.json({ ok: true, user: req.user.safe() })
}

export async function deleteAccount(req, res) {
  await req.user.deleteOne()
  res.clearCookie('bk_session', cookieOpts())
  return res.json({ ok: true })
}

export { issueSession, rosterAllows }
