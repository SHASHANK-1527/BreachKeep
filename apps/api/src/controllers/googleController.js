import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import AccessConfig from '../models/AccessConfig.js'
import { testMode } from '../config/testMode.js'
import { issueSession, rosterAllows } from './authController.js'
import { sendSessionCodeEmail } from '../utils/email.js'
import { getTodayIST, getMidnightISTExpiry, generateSessionCode } from '../utils/auth.js'
import { readMaintenance } from '../middleware/maintenance.js'

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
// body: { idToken } or { accessToken } (from Google OAuth on the frontend)
export async function googleAuth(req, res) {
  try {
    const { idToken, accessToken } = req.body
    if (!idToken && !accessToken) return res.status(400).json({ error: 'Missing Google token' })

    let email, sub, name
    if (accessToken) {
      // Validate the access token's audience first using tokeninfo
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`)
      if (!tokenInfoRes.ok) {
        return res.status(401).json({ error: 'Failed to verify Google access token audience' })
      }
      const tokenInfo = await tokenInfoRes.json()
      if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).json({ error: 'Google access token audience mismatch' })
      }

      const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!gRes.ok) {
        return res.status(401).json({ error: 'Failed to verify Google access token' })
      }
      const data = await gRes.json()
      email = (data.email || '').toLowerCase()
      sub = data.sub
      name = data.name || data.given_name
      if (!email || !data.email_verified)
        return res.status(400).json({ error: 'Google account email not verified' })
    } else if (idToken) {
      if (testMode && idToken === 'mock-google-token') {
        email = 'cadet@breachkeep.internal'
        sub = 'dev-google-cadet'
        name = 'Cadet'
      } else {
        const ticket = await verifyWithRetry(idToken)
        const payload = ticket.getPayload()
        email = (payload.email || '').toLowerCase()
        sub = payload.sub
        name = payload.name || payload.given_name
        if (!email || !payload.email_verified)
          return res.status(400).json({ error: 'Google account email not verified' })
      }
    }

    const user = await User.findOne({ email })

    if (!user) {
      const username = email === 'cadet@breachkeep.internal'
        ? 'Initiate'
        : (name ? name.replace(/\s+/g, '_').toLowerCase().slice(0, 20) : email.split('@')[0])

      const { maintenance, message, eta } = await readMaintenance()
      if (maintenance) {
        return res.status(503).json({ error: 'maintenance', message, eta })
      }

      const created = await User.create({
        username,
        email,
        googleId: sub,
        verified: true,
        sessionCode: generateSessionCode(),
        sessionCodeExpires: getMidnightISTExpiry(),
        lastSessionDate: getTodayIST(),
        verifiedToday: true,
      })

      issueSession(res, created)
      return res.json({ ok: true, user: created.safe(), message: 'Account created successfully. Welcome!' })
    }

    const { maintenance, message, eta } = await readMaintenance()
    if (maintenance && !user.testingRights && user.role !== 'admin') {
      return res.status(503).json({ error: 'maintenance', message, eta })
    }

    if (!user.googleId) { user.googleId = sub; await user.save() }

    const cfg = await AccessConfig.get()
    const dailyCodeRequired = process.env.REQUIRE_DAILY_SESSION_CODE !== 'false' && cfg.dailyCodeEnabled !== false

    if (dailyCodeRequired) {
      const today = getTodayIST()
      const expired = user.sessionCodeExpires && new Date() > user.sessionCodeExpires
      if (user.lastSessionDate !== today || expired) {
        user.verifiedToday = false
      }

      if (!user.verifiedToday) {
        const sessionCode = generateSessionCode()
        user.sessionCode = sessionCode
        user.sessionCodeExpires = getMidnightISTExpiry()
        user.lastSessionDate = today
        user.verifiedToday = false
        await user.save()
        try { await sendSessionCodeEmail(user.email, sessionCode) } catch (err) { console.error('Session email error:', err.message) }
        return res.json({
          ok: true,
          requiresSessionCode: true,
          email,
          message: 'Session code sent to your email. Check your inbox.',
        })
      }
    }

    issueSession(res, user)
    return res.json({ ok: true, user: user.safe() })
  } catch (e) {
    const msg = e?.message || ''
    console.error('googleAuth:', e?.code || '', msg)
    if (/ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|network|socket|fetch failed/i.test(msg)) {
      return res.status(503).json({ error: 'Could not reach Google right now. Check your connection and try again.' })
    }
    if (/Invalid token|Token used too late|wrong audience|Wrong recipient|invalid_token/i.test(msg)) {
      return res.status(401).json({ error: 'Google sign-in expired or was rejected. Please try again.' })
    }
    return res.status(401).json({ error: 'Google sign-in failed' })
  }
}
