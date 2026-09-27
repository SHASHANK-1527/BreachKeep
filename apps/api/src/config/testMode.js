// Test mode.
//
// Turned on with TEST_MODE=true in apps/api/.env. It unlocks /api/dev/*, a set
// of endpoints that let you jump the app into states that normally take a long
// time to reach by hand — all nine intro scenes finished, an unsorted account
// ready for the ceremony, a specific house, live dungeons without a provisioner.
//
// It is FORCED OFF when NODE_ENV=production, no matter what the environment
// says. These endpoints rewrite a student's progress from their own session and
// would be a straightforward privilege escalation if they ever shipped.

const requested = String(process.env.TEST_MODE || '').toLowerCase() === 'true'
const isProd = process.env.NODE_ENV === 'production'

export const testMode = requested && !isProd

export function announceTestMode() {
  if (requested && isProd) {
    console.warn('[test-mode] TEST_MODE=true was IGNORED because NODE_ENV=production.')
    return
  }
  if (testMode) {
    console.warn('')
    console.warn('  ┌────────────────────────────────────────────────┐')
    console.warn('  │  TEST MODE IS ON — /api/dev/* is open          │')
    console.warn('  │  Any logged-in account can rewrite its own     │')
    console.warn('  │  progress. Never run this facing real students.│')
    console.warn('  └────────────────────────────────────────────────┘')
    console.warn('')
  }
}
