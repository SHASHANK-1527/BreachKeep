import jwt from 'jsonwebtoken'

// Verifies the access-gate cookie. Optionally requires a specific mode.
// mode 'register' -> came from the common code (signup only)
// mode 'session'  -> came from a personal daily code (login only)
//
// A missing or wrong-mode gate answers 403 with a machine-readable reason. It
// used to answer a bare 404, which reached the sign-in page as "HTTP 404" and
// looked to students like the site was broken rather than like their access
// code had expired.
const denied = (res, reason) =>
  res.status(403).json({ error: 'gate_required', reason })

export function requireGate(mode) {
  return (req, res, next) => {
    const devFallback = () => {
      // Local development only. In production a missing gate is always a denial.
      if (process.env.NODE_ENV !== 'production') {
        req.gate = { mode: mode || 'register' }
        return next()
      }
      return null
    }

    try {
      const token = req.cookies?.bk_gate
      if (!token) return devFallback() ?? denied(res, 'missing')
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      if (mode && payload.mode !== mode) {
        return devFallback() ?? denied(res, 'wrong_mode')
      }
      req.gate = payload
      next()
    } catch {
      return devFallback() ?? denied(res, 'expired')
    }
  }
}
