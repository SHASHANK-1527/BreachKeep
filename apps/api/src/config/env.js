import dotenv from 'dotenv'
dotenv.config()

// Fail fast: a misconfigured deploy should never boot half-working.
const REQUIRED = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FLAG_HMAC_SECRET',
  'COMMON_ACCESS_CODE',
  'ADMIN_LANDING_CODE',
  'ADMIN_SECRET_PATH',
]

// Only strictly required outside dev (email/google/admin hash), warn in dev.
const RECOMMENDED = [
  'EMAIL_USER', 'EMAIL_PASS', 'GOOGLE_CLIENT_ID',
  'ADMIN_PASSWORD_HASH', 'PROVISIONER_SHARED_SECRET',
]

export function loadEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k])
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }
  const isProd = process.env.NODE_ENV === 'production'
  const softMissing = RECOMMENDED.filter((k) => !process.env[k])
  if (softMissing.length) {
    const msg = `Missing recommended env vars: ${softMissing.join(', ')}`
    if (isProd) throw new Error(msg)
    console.warn(`[env] ${msg} (ok for local dev, some features disabled)`)
  }
  // Admin hash hardening. With `env_file: [.env]` docker-compose passes values
  // LITERALLY (no $-interpolation), so the bcrypt hash must keep single '$'.
  // A common mistake is doubling every '$' to '$$' (that escaping is only for
  // INLINE compose `environment:` values, not env_file). A valid bcrypt hash
  // never contains '$$', so collapse any doubles — this makes the correct and
  // the mistakenly-doubled forms both work.
  if (process.env.ADMIN_PASSWORD_HASH) {
    const raw = process.env.ADMIN_PASSWORD_HASH
    let h = raw
    while (h.includes('$$')) h = h.replace(/\$\$/g, '$')
    if (h !== raw) {
      process.env.ADMIN_PASSWORD_HASH = h
      console.warn('[env] ADMIN_PASSWORD_HASH had doubled "$$" — collapsed to single "$". In a .env file the bcrypt hash must use single "$".')
    }
    if (!/^\$2[aby]\$\d\d\$/.test(process.env.ADMIN_PASSWORD_HASH)) {
      console.warn('[env] ADMIN_PASSWORD_HASH does not look like a bcrypt hash ($2b$..). Admin login will fail until it is the output of: npm run hash-admin "yourpassword".')
    }
  }

  return {
    isProd,
    port: parseInt(process.env.PORT || '5000', 10),
    cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
    adminSecretPath: process.env.ADMIN_SECRET_PATH,
  }
}

export const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  domain: process.env.COOKIE_DOMAIN || undefined,
})
