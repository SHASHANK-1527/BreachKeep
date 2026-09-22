// DEV ONLY — never run against a production database.
// Creates a ready-to-use test account and a fixed "daily code" so you can log
// in immediately without email, roster, or waiting for the midnight-IST cron.
//
// Usage:  cd apps/api && npm run seed:dev
//
// Then:
//   1. Landing page -> enter access code:  DEVLOGIN1
//   2. You're sent to /enter -> "Returning" tab
//   3. Log in with:  tester@dev.local / Test1234!
//
// Re-run any time to refresh the code's expiry or reset the password.

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import User from '../models/User.js'
import AccessConfig from '../models/AccessConfig.js'

dotenv.config()

const EMAIL = 'tester@dev.local'
const PASSWORD = 'Test1234!'
const DAILY_CODE = 'DEVLOGIN1'

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)

  // Signup's roster/email checks don't apply here — we're writing the user
  // directly, the same way the cron would after the account already exists.
  const hash = await bcrypt.hash(PASSWORD, 12)
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  const user = await User.findOneAndUpdate(
    { email: EMAIL },
    {
      $setOnInsert: { username: 'tester', email: EMAIL },
      $set: {
        password: hash,
        verified: true,
        sessionCode: DAILY_CODE,
        sessionCodeExpires: farFuture,
      },
    },
    { upsert: true, new: true }
  )

  // Also relax the roster gate so normal signup works too, if you want to test that path.
  const cfg = await AccessConfig.get()
  cfg.rosterGateEnabled = false
  await cfg.save()

  console.log('Dev account ready:')
  console.log('  email:   ', EMAIL)
  console.log('  password:', PASSWORD)
  console.log('  daily code (use on the landing page):', DAILY_CODE)
  console.log('Roster gate disabled — normal signup will also work now.')
  console.log(`(introComplete=${user.introComplete}, sorted=${user.sorted}, house=${user.house})`)

  await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
