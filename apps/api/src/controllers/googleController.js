import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import { issueSession, rosterAllows } from './authController.js'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// POST /api/auth/google  (gate: register OR session)
// body: { idToken }  (from Google Identity Services on the frontend)
export async function googleAuth(req, res) {
  try {
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ error: 'Missing Google token' })

    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    const email = (payload.email || '').toLowerCase()
    const sub = payload.sub
    if (!email || !payload.email_verified)
      return res.status(400).json({ error: 'Google account email not verified' })

    const mode = req.gate?.mode
    let user = await User.findOne({ email })

    if (mode === 'register') {
      if (user) return res.status(409).json({ error: 'Account exists — use the returning-student code instead' })
      if (!(await rosterAllows(email)))
        return res.status(403).json({ error: 'This email is not on the course roster' })
      user = await User.create({
        username: email.split('@')[0],
        email,
        googleId: sub,
        verified: true,
      })
    } else {
      // session mode: returning user, must match today's daily code
      if (!user) return res.status(404).json({ error: 'No account for this Google email' })
      const typed = req.gate?.code
      if (!typed || typed !== user.sessionCode || !user.sessionCodeExpires || user.sessionCodeExpires < new Date())
        return res.status(403).json({ error: "Today's access code does not match this account" })
      if (!user.googleId) { user.googleId = sub; await user.save() }
    }

    issueSession(res, user)
    return res.json({ ok: true, user: user.safe() })
  } catch (e) {
    console.error('googleAuth', e)
    return res.status(401).json({ error: 'Google sign-in failed' })
  }
}
