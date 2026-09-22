import express from 'express'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { loadEnv } from './config/env.js'
import { startDailyCodeJob } from './jobs/dailyCodeJob.js'

import authRoutes from './routes/auth.js'
import accessRoutes from './routes/access.js'
import introRoutes from './routes/intro.js'
import flagRoutes from './routes/flags.js'
import progressRoutes from './routes/progress.js'
import houseRoutes from './routes/house.js'
import adminRoutes from './routes/admin.js'

const env = loadEnv()
const app = express()

app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(
  cors({
    origin: env.isProd ? true : ['http://localhost:3000'],
    credentials: true,
  })
)

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'breachkeep-api' }))

app.use('/api/auth', authRoutes)
app.use('/api/access', accessRoutes)
app.use('/api/intro', introRoutes)
app.use('/api/flags', flagRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/house', houseRoutes)
app.use('/api/admin', adminRoutes)

// unknown /api -> 404 (never confirm structure)
app.use('/api', (req, res) => res.status(404).end())

async function start() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('[db] connected')
  startDailyCodeJob()
  app.listen(env.port, () => console.log(`[api] listening on :${env.port}`))
}

start().catch((e) => {
  console.error('Fatal startup error:', e)
  process.exit(1)
})

export default app
