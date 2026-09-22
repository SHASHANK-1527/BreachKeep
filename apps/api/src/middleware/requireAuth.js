import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Verifies the session cookie and attaches req.user.
// Identity ALWAYS comes from here, never from the request body.
export default async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.bk_session
    if (!token) return res.status(404).end()          // 404, not 403: don't confirm route exists
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.uid)
    if (!user) return res.status(404).end()
    req.user = user
    next()
  } catch {
    return res.status(404).end()
  }
}
