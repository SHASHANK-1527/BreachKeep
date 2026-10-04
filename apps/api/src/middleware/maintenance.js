import AccessConfig from '../models/AccessConfig.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'

// The kill switch.
//
// When maintenance is on, student-facing /api routes answer 503 with
// { error: 'maintenance' } so ordinary students cannot register, log in,
// submit flags, or access the active site.
//
// Admins (bk_admin) and accounts granted testing rights (testingRights: true)
// bypass this gate so they can verify challenges, inspect state, and test
// features without disruption while the public is locked out.

const CACHE_MS = 5000
let cache = { at: 0, value: { maintenance: false, message: '', eta: '' } }

export async function readMaintenance(force = false) {
  const now = Date.now()
  if (!force && now - cache.at < CACHE_MS) return cache.value
  try {
    const cfg = await AccessConfig.get()
    cache = {
      at: now,
      value: {
        maintenance: !!cfg.maintenance,
        message: cfg.maintenanceMessage || '',
        eta: cfg.maintenanceEta || '',
      },
    }
  } catch {
    // If the database is unreachable, keep whatever was last cached
    cache.at = now
  }
  return cache.value
}

// Called by the admin controller so a flip takes effect immediately.
export function invalidateMaintenanceCache() {
  cache.at = 0
}

// Paths that stay open for everyone while the site is sealed.
const ALWAYS_OPEN = [
  '/api/status',
  '/api/health',
  '/status',
  '/health',
]

export default async function maintenanceGate(req, res, next) {
  const path = req.path || req.originalUrl || ''
  if (ALWAYS_OPEN.includes(path)) return next()
  if (path.startsWith('/api/admin') || path.startsWith('/admin')) return next()

  const { maintenance, message, eta } = await readMaintenance()
  if (!maintenance) return next()

  // 1. Admin cookie bypass
  try {
    const adminToken = req.cookies?.bk_admin
    if (adminToken) {
      const payload = jwt.verify(adminToken, process.env.JWT_SECRET)
      if (payload.scope === 'admin') return next()
    }
  } catch {}

  // 2. Student session cookie with testing rights or admin role
  try {
    const sessToken = req.cookies?.bk_session
    if (sessToken) {
      const payload = jwt.verify(sessToken, process.env.JWT_SECRET)
      if (payload.uid) {
        const u = await User.findById(payload.uid).select('testingRights role')
        if (u && (u.testingRights || u.role === 'admin')) {
          req.user = u
          return next()
        }
      }
    }
  } catch {}

  // 3. Allow login verification for testers/admins
  const isAuthPath =
    path === '/api/auth/login' || path === '/auth/login' ||
    path === '/api/auth/verify-session' || path === '/auth/verify-session' ||
    path === '/api/auth/google' || path === '/auth/google'
  if (isAuthPath) {
    const email = (req.body?.email || '').toLowerCase().trim()
    if (email) {
      try {
        const u = await User.findOne({ email }).select('testingRights role')
        if (u && (u.testingRights || u.role === 'admin')) return next()
      } catch {}
    } else if (path.includes('google')) {
      // Let googleAuth verify token and check tester status
      return next()
    }
  }

  res.set('Retry-After', '3600')
  return res.status(503).json({ error: 'maintenance', message, eta })
}
