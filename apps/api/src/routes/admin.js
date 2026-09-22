import { Router } from 'express'
import requireAdmin from '../middleware/requireAdmin.js'
import { strictLimiter } from '../middleware/rateLimit.js'
import {
  adminLogin, adminLogout, adminWhere, adminState,
  setCommonCode, setRosterGate, setRoster, setDungeon,
} from '../controllers/adminController.js'

const r = Router()
r.post('/login', strictLimiter, adminLogin)
r.post('/logout', requireAdmin, adminLogout)
r.get('/where', requireAdmin, adminWhere)
r.get('/state', requireAdmin, adminState)
r.post('/common-code', requireAdmin, setCommonCode)
r.post('/roster-gate', requireAdmin, setRosterGate)
r.post('/roster', requireAdmin, setRoster)
r.post('/dungeons', requireAdmin, setDungeon)
export default r
