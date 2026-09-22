import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { completeRoom, introStatus } from '../controllers/introController.js'
const r = Router()
r.post('/complete', requireAuth, completeRoom)
r.get('/status', requireAuth, introStatus)
export default r
