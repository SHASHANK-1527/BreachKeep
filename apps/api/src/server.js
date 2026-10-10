import express from 'express'
import mongoose from 'mongoose'
mongoose.set('sanitizeFilter', true)
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { loadEnv } from './config/env.js'
import { startDailyCodeJob } from './jobs/dailyCodeJob.js'
import maintenanceGate, { readMaintenance } from './middleware/maintenance.js'
import { testMode, announceTestMode } from './config/testMode.js'
import devRoutes from './routes/dev.js'

import jwt from 'jsonwebtoken'
import User from './models/User.js'
import AccessConfig from './models/AccessConfig.js'
import authRoutes from './routes/auth.js'
import accessRoutes from './routes/access.js'
import introRoutes from './routes/intro.js'
import flagRoutes from './routes/flags.js'
import progressRoutes from './routes/progress.js'
import houseRoutes from './routes/house.js'
import adminRoutes from './routes/admin.js'
import labsRoutes from './routes/labs.js'

const env = loadEnv()
const app = express()

// Number of reverse proxies in front of us. Without this, express sees every
// request as coming from the proxy, so the per-IP rate limiter puts the entire
// cohort in one bucket and locks everybody out.
//   1  = nginx only (the docker-compose / single-VM setup)
//   2  = Vercel rewrite -> Render (the split free-tier setup)
app.set('trust proxy', parseInt(process.env.TRUST_PROXY_HOPS || '1', 10))

// No ETags on the API. Express adds them to every JSON response, so the
// browser revalidates and can serve a cached admin/progress payload — which
// showed up as 304s on /api/admin/state. API state is never cacheable.
app.set('etag', false)

app.use(helmet())
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(
  cors({
    origin: env.isProd ? true : ['http://localhost:3000'],
    credentials: true,
  })
)

// Request logger for container log streams (Dozzle / docker logs)
app.use((req, res, next) => {
  // Filter out high-frequency internal health checks to keep logs readable
  if (req.path === '/api/health') return next()
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[api] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`)
  })
  next()
})

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'breachkeep-api' }))

// Public, ungated: both web bundles poll this so they can show the maintenance
// page instead of a broken app. Accounts with testing rights or admin cookie
// bypass maintenance so testers can verify the live app.
app.get('/api/status', async (req, res) => {
  const { maintenance, message, eta } = await readMaintenance()
  res.set('Cache-Control', 'no-store')

  let isTester = false
  try {
    const adminToken = req.cookies?.bk_admin
    if (adminToken) {
      const payload = jwt.verify(adminToken, process.env.JWT_SECRET)
      if (payload.scope === 'admin') isTester = true
    }
  } catch {}

  if (!isTester) {
    try {
      const sessToken = req.cookies?.bk_session
      if (sessToken) {
        const payload = jwt.verify(sessToken, process.env.JWT_SECRET)
        if (payload.uid) {
          const u = await User.findById(payload.uid).select('testingRights role')
          if (u && (u.testingRights || u.role === 'admin')) isTester = true
        }
      }
    } catch {}
  }

  let testingEnabled = false
  try {
    const cfg = await AccessConfig.get()
    testingEnabled = !!cfg.testingEnabled
  } catch {}

  return res.json({
    maintenance: isTester ? false : maintenance,
    siteMaintenance: maintenance,
    message,
    eta,
    testMode: testMode || isTester,
    testingEnabled,
    isTester,
  })
})

// Kill switch — must sit in front of every student-facing route.
app.use(maintenanceGate)

app.use('/api/auth', authRoutes)
app.use('/api/access', accessRoutes)
app.use('/api/intro', introRoutes)
app.use('/api/flags', flagRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/house', houseRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/labs', labsRoutes)

// Test tools. Always mounted, but every route inside is gated by requireTesting:
// allowed in local env test mode, OR when the Warden has testing enabled globally
// and this account has been granted testing rights. Everyone else gets a 404, so
// the tools still "do not exist" for ordinary users.
app.use('/api/dev', devRoutes)

// unknown /api -> 404 (never confirm structure)
app.use('/api', (req, res) => res.status(404).end())

async function start() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('[db] connected')
  announceTestMode()

  // Auto-verify any existing accounts that were blocked by dynamic DNS email delivery issues
  try {
    const updated = await User.updateMany({ verified: { $ne: true } }, { $set: { verified: true } })
    if (updated.modifiedCount > 0) {
      console.log(`[auth] Auto-verified ${updated.modifiedCount} unverified accounts in database`)
    }
  } catch (err) {
    console.warn('[auth] Auto-verify check skipped:', err.message)
  }

  startDailyCodeJob()
  app.listen(env.port, () => console.log(`[api] listening on :${env.port}`))
}

start().catch((e) => {
  console.error('Fatal startup error:', e)
  process.exit(1)
})

export default app
