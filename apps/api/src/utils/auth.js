export function validatePassword(password) {
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters long' }
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain at least 1 number' }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, error: 'Password must contain at least 1 symbol' }
  if (!/[a-zA-Z]/.test(password)) return { valid: false, error: 'Password must contain letters' }
  return { valid: true }
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