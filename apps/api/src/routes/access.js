import { Router } from 'express'
import { strictLimiter } from '../middleware/rateLimit.js'
import { resendDaily } from '../controllers/accessController.js'
const r = Router()
r.post('/resend-daily', strictLimiter, resendDaily)
export default r
