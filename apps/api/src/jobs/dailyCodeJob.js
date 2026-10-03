import cron from 'node-cron'
import User from '../models/User.js'
import { getTodayIST, getMidnightISTExpiry, generateSessionCode } from '../utils/auth.js'
import { sendSessionCodeEmail } from '../utils/email.js'

// Runs at 00:00 IST (18:30 UTC). Issues a fresh daily code to every verified user.
export function startDailyCodeJob() {
  cron.schedule('30 18 * * *', runDailyCodes, { timezone: 'Etc/UTC' })
  console.log('[cron] daily code job scheduled for 18:30 UTC (00:00 IST)')
}

export async function runDailyCodes() {
  const users = await User.find({ verified: true }).select('email sessionCode sessionCodeExpires lastSessionDate')
  const today = getTodayIST()
  const expiry = getMidnightISTExpiry()
  let sent = 0, failed = 0
  for (const u of users) {
    try {
      u.sessionCode = generateSessionCode()
      u.sessionCodeExpires = expiry
      u.lastSessionDate = today
      u.verifiedToday = false
      await u.save()
      await sendSessionCodeEmail(u.email, u.sessionCode)
      sent++
    } catch (e) {
      failed++
      console.error('[cron] failed for', u.email, e.message)
    }
  }
  console.log(`[cron] daily codes: ${sent} sent, ${failed} failed`)
  return { sent, failed }
}
