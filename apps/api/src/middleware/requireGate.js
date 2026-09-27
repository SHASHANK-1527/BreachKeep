import jwt from 'jsonwebtoken'

// Verifies the access-gate cookie. Optionally requires a specific mode.
// mode 'register' -> came from the common code (signup only)
// mode 'session'  -> came from a personal daily code (login only)
export function requireGate(mode) {
  return (req, res, next) => {
    try {
      const token = req.cookies?.bk_gate
      if (!token) {
        if (process.env.NODE_ENV !== 'production') {
          req.gate = { mode: mode || 'register' }
          return next()
        }
        return res.status(404).end()
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      if (mode && payload.mode !== mode) return res.status(404).end()
      req.gate = payload
      next()
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        req.gate = { mode: mode || 'register' }
        return next()
      }
      return res.status(404).end()
    }
  }
}
