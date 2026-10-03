import { Router } from 'express'
import requireAdmin from '../middleware/requireAdmin.js'
import { strictLimiter } from '../middleware/rateLimit.js'
import {
  adminLogin, adminLogout, adminWhere, adminState, adminOverview,
  setCommonCode, setRosterGate, setMaintenance, setRoster, getRoster, removeFromRoster, setDungeon, setCapstone,
  adminStudents, adminStudentDetail, adminAssignHouse, adminResetProgress, adminDeleteStudent,
  setTesting, testIntro, testResetDungeon, setTestingGrant,
} from '../controllers/adminController.js'

const r = Router()
r.post('/login', strictLimiter, adminLogin)
r.post('/logout', requireAdmin, adminLogout)
r.get('/where', requireAdmin, adminWhere)
r.get('/state', requireAdmin, adminState)
r.get('/overview', requireAdmin, adminOverview)
r.post('/common-code', requireAdmin, setCommonCode)
r.post('/roster-gate', requireAdmin, setRosterGate)
r.post('/maintenance', requireAdmin, setMaintenance)
r.get('/roster', requireAdmin, getRoster)
r.post('/roster', requireAdmin, setRoster)
r.post('/roster-remove', requireAdmin, removeFromRoster)
r.post('/dungeons', requireAdmin, setDungeon)
r.post('/capstone', requireAdmin, setCapstone)
r.post('/testing', requireAdmin, setTesting)
r.post('/test/intro', requireAdmin, testIntro)
r.post('/test/reset-dungeon', requireAdmin, testResetDungeon)
r.post('/test/grant', requireAdmin, setTestingGrant)

// students (declared after /roster* so no path is shadowed)
r.get('/students', requireAdmin, adminStudents)
r.get('/students/:id', requireAdmin, adminStudentDetail)
r.post('/students/:id/house', requireAdmin, adminAssignHouse)
r.post('/students/:id/reset-progress', requireAdmin, adminResetProgress)
r.post('/students/:id/delete', requireAdmin, adminDeleteStudent)

export default r
