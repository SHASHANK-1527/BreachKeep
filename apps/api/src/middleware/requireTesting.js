import AccessConfig from '../models/AccessConfig.js'
import { testMode } from '../config/testMode.js'

// Gate for the /api/dev test tools. Allowed when ANY of the following:
//   - local env test mode is on (TEST_MODE=true && NODE_ENV!=production)
//   - this account was granted testing rights (req.user?.testingRights)
//   - this account has admin role or admin cookie
//   - testing is enabled globally and user is authenticated
export default async function requireTesting(req, res, next) {
  try {
    if (testMode) return next()
    if (req.user?.testingRights || req.user?.role === 'admin' || req.admin) return next()
    const cfg = await AccessConfig.get()
    if (cfg.testingEnabled && req.user) return next()
    return res.status(404).end()
  } catch {
    return res.status(404).end()
  }
}
