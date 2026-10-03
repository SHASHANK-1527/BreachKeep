import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { openLab, stopLab } from '../controllers/labController.js'
import { getCapstone } from '../controllers/capstoneController.js'
const r = Router()
r.post('/open', requireAuth, openLab)
r.post('/stop', requireAuth, stopLab)
r.get('/capstone', requireAuth, getCapstone)
export default r
