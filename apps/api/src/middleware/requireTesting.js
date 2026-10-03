import AccessConfig from '../models/AccessConfig.js'
import { testMode } from '../config/testMode.js'

// Gate for the /api/dev test tools. Allowed when EITHER:
//   - local env test mode is on (TEST_MODE=true && NODE_ENV!=production), or
//   - the Warden has testing enabled globally AND this account was granted
//     testing rights from the admin panel.
// Anyone else gets a 404, so the tools still "do not exist" for ordinary users.
// Runs after requireAuth, so req.user is set.
export default async function requireTesting(req, res, next) {
  try {
    if (testMode) return next()
    const cfg = await AccessConfig.get()
    if (cfg.testingEnabled && req.user?.testingRights) return next()
    return res.status(404).end()
  } catch {
    return res.status(404).end()
  }
}
