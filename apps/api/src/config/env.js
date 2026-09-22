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
