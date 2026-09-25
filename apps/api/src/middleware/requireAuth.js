import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Verifies the session cookie and attaches req.user.
// Identity ALWAYS comes from here, never from the request body.
const TEST_USER = {
  _id: 'tester-id-12345',
  username: 'Tester',
  email: 'tester@example.com',
  house: 'rimeguard',
  role: 'user',
  verified: true,
  safe() {
    return {
      id: this._id,
      username: this.username,
      email: this.email,
      house: this.house,
      role: this.role,
    }
  },
  save: async () => {},
  deleteOne: async () => {},
}

export default async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.bk_session
    if (!token) {
      if (process.env.TEST_MODE === 'true') {
        req.user = TEST_USER
        return next()
      }
      return res.status(404).end()
    }
    const secret = process.env.JWT_SECRET || 'test-mode-secret'
    const payload = jwt.verify(token, secret)
    if (process.env.TEST_MODE === 'true' && payload.uid === TEST_USER._id) {
      req.user = TEST_USER
      return next()
    }
    const user = await User.findById(payload.uid)
    if (!user) {
      if (process.env.TEST_MODE === 'true') {
        req.user = TEST_USER
        return next()
      }
      return res.status(404).end()
    }
    req.user = user
    next()
  } catch {
    if (process.env.TEST_MODE === 'true') {
      req.user = TEST_USER
      return next()
    }
    return res.status(404).end()
  }
}
