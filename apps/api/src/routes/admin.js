import { Router } from 'express'
import requireAdmin from '../middleware/requireAdmin.js'
import { strictLimiter } from '../middleware/rateLimit.js'
import {
  adminLogin, adminLogout, adminWhere, adminState, adminOverview,
  setCommonCode, setRosterGate, setRoster, getRoster, removeFromRoster, setDungeon,
  adminStudents, adminStudentDetail, adminAssignHouse, adminResetProgress, adminDeleteStudent,
} from '../controllers/adminController.js'

const r = Router()
r.post('/login', strictLimiter, adminLogin)
r.post('/logout', requireAdmin, adminLogout)
r.get('/where', requireAdmin, adminWhere)
r.get('/state', requireAdmin, adminState)
r.get('/overview', requireAdmin, adminOverview)
r.post('/common-code', requireAdmin, setCommonCode)
r.post('/roster-gate', requireAdmin, setRosterGate)
r.get('/roster', requireAdmin, getRoster)
r.post('/roster', requireAdmin, setRoster)
r.post('/roster-remove', requireAdmin, removeFromRoster)
r.post('/dungeons', requireAdmin, setDungeon)

// students (declared after /roster* so no path is shadowed)
r.get('/students', requireAdmin, adminStudents)
r.get('/students/:id', requireAdmin, adminStudentDetail)
r.post('/students/:id/house', requireAdmin, adminAssignHouse)
r.post('/students/:id/reset-progress', requireAdmin, adminResetProgress)
r.post('/students/:id/delete', requireAdmin, adminDeleteStudent)

export default r
