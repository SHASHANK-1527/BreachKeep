import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { submitFlag, getRoomFlag } from '../controllers/flagController.js'
const r = Router()
r.get('/for-room/:roomId', requireAuth, getRoomFlag)
r.post('/submit', requireAuth, submitFlag)
export default r
