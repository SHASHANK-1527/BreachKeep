import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import requireTesting from '../middleware/requireTesting.js'
import { devState, devIntro, devUnsort, devHouse, devDungeon, devReset } from '../controllers/devController.js'

// Always mounted now (see server.js). Every route is behind requireAuth +
// requireTesting — allowed in local env test mode, or for an account the Warden
// granted testing rights. They only ever act on your own session's account.
const r = Router()
r.get('/state', requireAuth, requireTesting, devState)
r.post('/intro', requireAuth, requireTesting, devIntro)
r.post('/unsort', requireAuth, requireTesting, devUnsort)
r.post('/house', requireAuth, requireTesting, devHouse)
r.post('/dungeons', requireAuth, requireTesting, devDungeon)
r.post('/reset', requireAuth, requireTesting, devReset)
export default r
