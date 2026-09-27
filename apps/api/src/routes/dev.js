import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { devState, devIntro, devUnsort, devHouse, devDungeon, devReset } from '../controllers/devController.js'

// Mounted ONLY when test mode is on (see server.js). Still behind requireAuth —
// these act on your own session's account, never on someone else's.
const r = Router()
r.get('/state', requireAuth, devState)
r.post('/intro', requireAuth, devIntro)
r.post('/unsort', requireAuth, devUnsort)
r.post('/house', requireAuth, devHouse)
r.post('/dungeons', requireAuth, devDungeon)
r.post('/reset', requireAuth, devReset)
export default r
