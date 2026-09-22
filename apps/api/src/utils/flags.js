import crypto from 'crypto'

// Per-student unforgeable flag. No flag list is ever stored server-side.
// The flag for (student, room) is deterministic from a server secret.
export function flagFor(userId, roomId) {
  const mac = crypto
    .createHmac('sha256', process.env.FLAG_HMAC_SECRET)
    .update(`${userId}:${roomId}`)
    .digest('hex')
    .slice(0, 24)
  return `BK{${mac}}`
}

export function checkFlag(userId, roomId, submitted) {
  const expected = flagFor(userId, roomId)
  const a = Buffer.from(expected)
  const b = Buffer.from(String(submitted || ''))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function randomAlphanumeric(n = 8) {
  // Unambiguous set: no 0/O, 1/I/L
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(n)
  let out = ''
  for (let i = 0; i < n; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

// constant-time string compare for access codes
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''))
  const bb = Buffer.from(String(b || ''))
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}
