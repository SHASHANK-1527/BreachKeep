import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import { issueSession, rosterAllows } from './authController.js'
import { generateCode, sendSessionCodeEmail } from '../utils/email.js'
import { getTodayIST, getMidnightISTExpiry } from '../utils/auth.js'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Google's tokeninfo endpoint occasionally resets the connection under load.
// Retry a couple of times before giving up so a transient blip doesn't look
// like a rejected login.
async function verifyWithRetry(idToken, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    } catch (e) {
      lastErr = e
      const transient = /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|network|socket/i.test(e?.message || '')
      if (!transient || i === attempts - 1) throw e
      await new Promise((r) => setTimeout(r, 400 * (i + 1)))
    }
  }
  throw lastErr
}

// POST /api/auth/google  (gate: register OR session)
// body: { idToken }  (from Google Identity Services on the frontend)
export async function googleAuth(req, res) {
  try {
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ error: 'Missing Google token' })

    const ticket = await verifyWithRetry(idToken)
    const payload = ticket.getPayload()
    const email = (payload.email || '').toLowerCase()
    const sub = payload.sub
    if (!email || !payload.email_verified)
      return res.status(400).json({ error: 'Google account email not verified' })

    const user = await User.findOne({ email })

    // "Continue with Google" is a single unified action, so it must not depend on
    // the gate mode. The gate cookie still says 'register' when the student typed
    // the common access code, which used to make the login tab behave like signup.
    // Decide purely from whether the account already exists.

    if (!user) {
      if (!(await rosterAllows(email)))
        return res.status(403).json({ error: 'This email is not on the course roster' })

      const created = await User.create({
        username: email.split('@')[0],
        email,
        googleId: sub,
        verified: true,
        sessionCode: generateCode(),
        sessionCodeExpires: getMidnightISTExpiry(),
        lastSessionDate: getTodayIST(),
      })

      // First sign-up of the day: no session code to prove.
      issueSession(res, created)
      return res.json({ ok: true, user: created.safe(), message: 'Account created successfully. Welcome!' })
    }

    if (!user.googleId) { user.googleId = sub; await user.save() }

    const today = getTodayIST()
    const codeStillValid =
      user.lastSessionDate === today && user.sessionCode && user.sessionCodeExpires > new Date()

    if (!codeStillValid) {
      const sessionCode = generateCode()
      user.sessionCode = sessionCode
      user.sessionCodeExpires = getMidnightISTExpiry()
      user.lastSessionDate = today
      await user.save()
      try { await sendSessionCodeEmail(user.email, sessionCode) } catch (err) { console.error('Session email error:', err.message) }
      return res.json({
        ok: true,
        requiresSessionCode: true,
        email,
        message: 'Session code sent to your email. Check your inbox.',
      })
    }

    issueSession(res, user)
    return res.json({ ok: true, user: user.safe() })
  } catch (e) {
    const msg = e?.message || ''
    console.error('googleAuth:', e?.code || '', msg)
    // Distinguish "Google was unreachable" from "this token is not valid",
    // otherwise a network blip looks like a wrong password to the student.
    if (/ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|network|socket|fetch failed/i.test(msg)) {
      return res.status(503).json({ error: 'Could not reach Google right now. Check your connection and try again.' })
    }
    if (/Invalid token|Token used too late|wrong audience|Wrong recipient|invalid_token/i.test(msg)) {
      return res.status(401).json({ error: 'Google sign-in expired or was rejected. Please try again.' })
    }
    return res.status(401).json({ error: 'Google sign-in failed' })
  }
}