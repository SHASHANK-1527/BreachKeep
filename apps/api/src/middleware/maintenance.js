import AccessConfig from '../models/AccessConfig.js'

// The kill switch.
//
// When maintenance is on, every student-facing /api route answers 503 with
// { error: 'maintenance' } so nobody can register, log in, submit a flag or
// keep an existing session alive. The admin surface stays reachable so the
// switch can be turned back off, and /api/status stays public so the two web
// bundles can render the maintenance page.
//
// The flag is read from Mongo at most once every CACHE_MS — with 150 students
// polling we do not want a database round trip per request.

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
    // If the database is unreachable, do not lock everyone out on a guess —
    // keep whatever we last knew.
    cache.at = now
  }
  return cache.value
}

// Called by the admin controller so a flip takes effect immediately.
export function invalidateMaintenanceCache() {
  cache.at = 0
}

// Paths that keep working while the site is down.
const ALWAYS_OPEN = [
  '/api/status',
  '/api/health',
]

export default async function maintenanceGate(req, res, next) {
  const path = req.path || req.originalUrl || ''
  if (ALWAYS_OPEN.includes(path)) return next()
  if (path.startsWith('/api/admin')) return next()

  const { maintenance, message, eta } = await readMaintenance()
  if (!maintenance) return next()

  res.set('Retry-After', '3600')
  return res.status(503).json({ error: 'maintenance', message, eta })
}
