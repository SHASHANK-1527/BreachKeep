import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Verifies the session cookie and attaches req.user.
// Identity ALWAYS comes from here, never from the request body.
const unauthorized = (res) =>
  res.status(401).json({ error: 'unauthenticated' })

export default async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.bk_session
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(payload.uid)
      if (user) {
        req.user = user
        return next()
      }
    }

    // Allow admin cookie as fallback (e.g. for /api/dev/state in admin testing)
    const adminToken = req.cookies?.bk_admin
    if (adminToken) {
      const payload = jwt.verify(adminToken, process.env.JWT_SECRET)
      if (payload.scope === 'admin') {
        let adminUser = await User.findOne({ role: 'admin' })
        if (!adminUser) adminUser = await User.findOne()
        if (adminUser) {
          req.user = adminUser
          req.admin = payload
          return next()
        }
      }
    }

    return unauthorized(res)
  } catch {
    return unauthorized(res)
  }
}
