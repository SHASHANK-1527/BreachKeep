import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { submitFlag, getProgress } from '../controllers/flagController.js'
const r = Router()
r.post('/submit', requireAuth, submitFlag)
export default r
