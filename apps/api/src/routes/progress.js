import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { getProgress } from '../controllers/flagController.js'
const r = Router()
r.get('/', requireAuth, getProgress)
export default r
