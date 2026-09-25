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
  const isTestMode = process.env.TEST_MODE === 'true'
  if (!isTestMode) {
    const missing = REQUIRED.filter((k) => !process.env[k])
    if (missing.length) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`)
    }
  } else {
    console.warn('[env] TEST_MODE is active. Bypassing required env checks.')
  }
  const isProd = process.env.NODE_ENV === 'production'
  const softMissing = RECOMMENDED.filter((k) => !process.env[k])
  if (softMissing.length && !isTestMode) {
    const msg = `Missing recommended env vars: ${softMissing.join(', ')}`
    if (isProd) throw new Error(msg)
    console.warn(`[env] ${msg} (ok for local dev, some features disabled)`)
  }
  return {
    isProd,
    isTestMode,
    port: parseInt(process.env.PORT || '5000', 10),
    cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
    adminSecretPath: process.env.ADMIN_SECRET_PATH || '/keep-warden-7f3a9c',
  }
}

export const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  domain: process.env.COOKIE_DOMAIN || undefined,
})
