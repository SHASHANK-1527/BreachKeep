// Regression guards for the live-deployment bugs fixed on 2026-09-27.
//
// These run without a database on purpose, so `npm test` works anywhere.
// Each block names the symptom it prevents coming back.
//
//   node --test test/guards.test.js

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import jwt from 'jsonwebtoken'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(64)

describe('every student signed in as cadet@breachkeep.internal', () => {
  test('TEST_MODE=true is ignored when NODE_ENV=production', async () => {
    process.env.TEST_MODE = 'true'
    process.env.NODE_ENV = 'production'
    const { testMode } = await import('../src/config/testMode.js?guard1')
    assert.equal(testMode, false)
  })

  test('the Google mock is gated on that flag, not on raw process.env', async () => {
    const src = await readFile(new URL('../src/controllers/googleController.js', import.meta.url), 'utf8')
    assert.ok(src.includes("import { testMode } from '../config/testMode.js'"))
    assert.ok(src.includes('if (testMode && idToken =='))
    assert.ok(!src.includes("process.env.TEST_MODE === 'true'"),
      'reading process.env.TEST_MODE here is what shipped the shared account')
  })
})

describe('a wall of 404s in the network tab', () => {
  const app = express()
  app.use(cookieParser())

  test('no session cookie answers 401, not 404', async () => {
    const requireAuth = (await import('../src/middleware/requireAuth.js')).default
    app.get('/needs-session', requireAuth, (req, res) => res.json({ ok: true }))
    const r = await request(app).get('/needs-session')
    assert.equal(r.status, 401)
    assert.equal(r.body.error, 'unauthenticated')
  })

  test('an unreadable session cookie answers 401', async () => {
    const r = await request(app).get('/needs-session').set('Cookie', 'bk_session=not-a-jwt')
    assert.equal(r.status, 401)
  })
})

describe('the access gate', () => {
  const app = express()
  app.use(cookieParser())

  test('a missing gate answers 403 gate_required, not a bare 404', async () => {
    const { requireGate } = await import('../src/middleware/requireGate.js')
    app.post('/needs-gate', requireGate('register'), (req, res) => res.json({ ok: true }))
    const r = await request(app).post('/needs-gate')
    assert.equal(r.status, 403)
    assert.equal(r.body.error, 'gate_required')
    assert.equal(r.body.reason, 'missing')
  })

  test('a session-mode cookie cannot be used to register', async () => {
    const tok = jwt.sign({ mode: 'session' }, process.env.JWT_SECRET)
    const r = await request(app).post('/needs-gate').set('Cookie', `bk_gate=${tok}`)
    assert.equal(r.status, 403)
    assert.equal(r.body.reason, 'wrong_mode')
  })

  test('the right gate cookie passes', async () => {
    const tok = jwt.sign({ mode: 'register' }, process.env.JWT_SECRET)
    const r = await request(app).post('/needs-gate').set('Cookie', `bk_gate=${tok}`)
    assert.equal(r.status, 200)
  })
})

describe('codes', () => {
  test('the daily code is 8 unambiguous alphanumerics everywhere it is minted', async () => {
    const { generateSessionCode } = await import('../src/utils/auth.js')
    for (let i = 0; i < 200; i++) assert.match(generateSessionCode(), /^[A-HJ-NP-Z2-9]{8}$/)
    const seen = new Set(Array.from({ length: 500 }, generateSessionCode))
    assert.ok(seen.size > 490, 'daily codes must not collide')
  })

  test('the email verification code is 6 characters', async () => {
    const { generateCode } = await import('../src/utils/email.js')
    for (let i = 0; i < 200; i++) assert.match(generateCode(), /^[A-HJ-NP-Z2-9]{6}$/)
  })

  test('the daily code expires at the next midnight IST and never in the past', async () => {
    const { getMidnightISTExpiry } = await import('../src/utils/auth.js')
    const e = getMidnightISTExpiry()
    assert.ok(e > new Date(), `expiry must be in the future, got ${e.toISOString()}`)
    assert.ok(e.toISOString().endsWith('T18:30:00.000Z'), e.toISOString())
    assert.ok(e - Date.now() <= 24 * 3600 * 1000 + 1000)
  })
})

describe('emails sent from the server', () => {
  test('reset links point at the real site, never localhost', async () => {
    const src = await readFile(new URL('../src/utils/email.js', import.meta.url), 'utf8')
    assert.ok(!src.includes('http://localhost:3000/reset-password'))
    const { publicBaseUrl } = await import('../src/utils/email.js')
    process.env.PUBLIC_BASE_URL = 'https://example.duckdns.org/'
    assert.equal(publicBaseUrl(), 'https://example.duckdns.org')
    delete process.env.PUBLIC_BASE_URL
    process.env.DOMAIN = 'example.duckdns.org'
    assert.equal(publicBaseUrl(), 'https://example.duckdns.org')
  })
})

describe('production cookies', () => {
  test('the session cookie is Secure and httpOnly', async () => {
    process.env.NODE_ENV = 'production'
    const { cookieOpts } = await import('../src/config/env.js?guard2')
    const o = cookieOpts()
    assert.equal(o.secure, true)
    assert.equal(o.httpOnly, true)
    assert.equal(o.sameSite, 'lax')
  })
})

// ---------------------------------------------------------------------------
// Added 2026-09-27: the introduction scenes no longer ship their flags in the
// JS bundle. Each student's flag is derived per (account, room) and validated
// server-side, so these pin the properties the rooms now rely on.
// ---------------------------------------------------------------------------

describe('dynamic per-student intro flags', () => {
  test("the flag is shaped BK{...} and a classmate's does not validate", async () => {
    process.env.FLAG_HMAC_SECRET = process.env.FLAG_HMAC_SECRET || 'f'.repeat(64)
    const { flagFor, checkFlag } = await import('../src/utils/flags.js')
    assert.match(flagFor('aaaaaaaaaaaaaaaaaaaaaaaa', 'guestbook'), /^BK\{[a-z0-9_]+_[0-9a-f]{16}\}$/)
    const mine = 'aaaaaaaaaaaaaaaaaaaaaaaa'
    const theirs = 'bbbbbbbbbbbbbbbbbbbbbbbb'
    assert.equal(checkFlag(mine, 'guestbook', flagFor(mine, 'guestbook')), true)
    assert.equal(checkFlag(mine, 'guestbook', flagFor(theirs, 'guestbook')), false)
    assert.equal(checkFlag(mine, 'guestbook', ''), false)
    assert.equal(checkFlag(mine, 'guestbook', undefined), false)
  })

  test('the reveal endpoint only issues flags for the nine intro rooms', async () => {
    const src = await readFile(new URL('../src/controllers/flagController.js', import.meta.url), 'utf8')
    assert.ok(src.includes('REVEALABLE_ROOMS'), 'the room allow-list must gate the reveal')
    assert.ok(src.includes('new Set(INTRO_ROOMS)'),
      'only the intro scenes may have their flag handed out; dungeon flags live in the container')
    assert.ok(src.includes('flagFor(req.user._id.toString()'),
      'the userId must come from the session, never from the request')
    assert.ok(!/flagFor\(\s*req\.(params|body|query)/.test(src),
      'taking the userId from the request would let anyone mint any flag')
  })

  test('the reveal route requires a session', async () => {
    const src = await readFile(new URL('../src/routes/flags.js', import.meta.url), 'utf8')
    assert.match(src, /r\.get\('\/for-room\/:roomId', requireAuth, getRoomFlag\)/)
  })

  test('no intro scene ships a hardcoded flag in the bundle any more', async () => {
    const dir = new URL('../../web/src/features/introduction-module/rooms/', import.meta.url)
    const { readdir } = await import('node:fs/promises')
    const files = (await readdir(dir)).filter((f) => f.endsWith('.jsx'))
    assert.ok(files.length >= 9)
    for (const f of files) {
      const src = await readFile(new URL(f, dir), 'utf8')
      assert.ok(!/FLAG\{[^}]+\}/.test(src), `${f} still contains a literal flag`)
      assert.ok(!/BK\{[0-9a-f]{8}/.test(src), `${f} still contains a literal flag`)
    }
  })

  test('the demo wing is not one of the nine and awards nothing', async () => {
    const { INTRO_ROOMS } = await import('../src/controllers/introController.js')
    assert.equal(INTRO_ROOMS.length, 9)
    assert.ok(!INTRO_ROOMS.includes('demo-vulnerability'))
    const src = await readFile(
      new URL('../../web/src/features/introduction-module/rooms/DemoVulnRoom.jsx', import.meta.url), 'utf8')
    assert.ok(!src.includes('reportComplete'), 'the demo must not record progress')
    assert.ok(!src.includes('/flags/'), 'the demo must not issue or submit a flag')
    assert.ok(src.includes('sandbox="allow-scripts"'), 'the reflected-XSS frame must stay sandboxed')
    assert.ok(!/sandbox="[^"]*allow-same-origin/.test(src),
      'allow-same-origin would let the demo payload reach the real app')
  })
})
