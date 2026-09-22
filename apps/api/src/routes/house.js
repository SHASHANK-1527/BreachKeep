import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { assignHouse } from '../controllers/houseController.js'
const r = Router()
r.post('/assign', requireAuth, assignHouse)
export default r
