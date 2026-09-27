import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Verifies the session cookie and attaches req.user.
// Identity ALWAYS comes from here, never from the request body.
//
// These routes answer 401 when there is no valid session. This used to be a 404
// ("don't confirm the route exists"), but the route list is public anyway — it
// ships inside the app bundle — so the only thing the 404 hid was the truth from
// our own frontend, which could not tell "your session expired" apart from "that
// endpoint is gone" and reacted by bouncing between /dashboard and /enter,
// firing a request each time.
const unauthorized = (res) =>
  res.status(401).json({ error: 'unauthenticated' })

export default async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.bk_session
    if (!token) return unauthorized(res)
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.uid)
    if (!user) return unauthorized(res)
    req.user = user
    next()
  } catch {
    return unauthorized(res)
  }
}
