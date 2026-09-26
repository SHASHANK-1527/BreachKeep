import rateLimit from 'express-rate-limit'

// These are per-IP. A whole class on one campus network shares one public IP,
// so the student-facing limit has to be sized for the cohort, not for one
// person — a 30/15min limit locks out everyone after the 30th signup.
// Set AUTH_RATE_MAX in .env to the size of your class with headroom.
const AUTH_MAX = parseInt(process.env.AUTH_RATE_MAX || '400', 10)
const STRICT_MAX = parseInt(process.env.STRICT_RATE_MAX || '20', 10)

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again later' },
})

// Admin login and other sensitive endpoints — deliberately still tight.
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: STRICT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again later' },
})
