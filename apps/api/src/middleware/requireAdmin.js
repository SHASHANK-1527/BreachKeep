import jwt from 'jsonwebtoken'

// Verifies the admin cookie issued after the admin password check.
export default function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.bk_admin
    if (!token) return res.status(404).end()
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.scope !== 'admin') return res.status(404).end()
    req.admin = payload
    next()
  } catch {
    return res.status(404).end()
  }
}
