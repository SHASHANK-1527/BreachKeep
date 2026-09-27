import { randomAlphanumeric } from './flags.js'

export function validatePassword(password) {
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters long' }
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain at least one number' }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, error: 'Password must contain at least one symbol' }
  if (!/[a-zA-Z]/.test(password)) return { valid: false, error: 'Password must contain at least one letter' }
  return { valid: true }
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function getTodayIST() {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const istTime = new Date(now.getTime() + istOffset)
  return istTime.toISOString().split('T')[0]
}

export function getMidnightISTExpiry() {
  const today = getTodayIST()
  const midnightIST = new Date(`${today}T18:30:00.000Z`)
  if (new Date() > midnightIST) {
    midnightIST.setDate(midnightIST.getDate() + 1)
  }
  return midnightIST
}
// The DAILY code: the one emailed at midnight IST, typed into the landing
// access box, and re-proven on the sign-in page. It is deliberately NOT the
// 6-digit numeric shape used for email verification — /api/auth/verify-access-code
// looks a code up across every user, so a 6-digit space is guessable for a
// cohort-sized user table. 8 unambiguous alphanumerics is ~10^12.
export function generateSessionCode() {
  return randomAlphanumeric(8)
}
