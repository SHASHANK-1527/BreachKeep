import { Router } from 'express'
import { requireGate } from '../middleware/requireGate.js'
import requireAuth from '../middleware/requireAuth.js'
import { authLimiter } from '../middleware/rateLimit.js'
import {
  signup, verify, login, me, logout,
  updateUsername, updatePassword, updateAvatar, deleteAccount,
} from '../controllers/authController.js'
import { googleAuth } from '../controllers/googleController.js'
import { verifyAccessCode } from '../controllers/accessController.js'

const r = Router()

r.post('/verify-access-code', authLimiter, verifyAccessCode)

r.post('/signup', requireGate('register'), authLimiter, signup)
r.post('/verify', requireGate('register'), authLimiter, verify)
r.post('/login', requireGate('session'), authLimiter, login)
r.post('/google', requireGate(), authLimiter, googleAuth) // mode checked inside controller

r.get('/me', requireAuth, me)
r.post('/logout', requireAuth, logout)

r.post('/update-username', requireAuth, updateUsername)
r.post('/update-password', requireAuth, updatePassword)
r.post('/update-avatar', requireAuth, updateAvatar)
r.post('/delete-account', requireAuth, deleteAccount)

export default r
