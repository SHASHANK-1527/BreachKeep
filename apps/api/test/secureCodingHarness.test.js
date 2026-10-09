import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'path'
import { spawn } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'

const appDir = path.resolve('../../labs/secure-coding/app')
const fixturesDir = path.resolve('../../labs/secure-coding/test-fixtures')
const refDir = path.join(fixturesDir, 'reference')

function runHarnessWithFile(targetRoom, filePath) {
  return new Promise((resolve) => {
    const nonce = crypto.randomBytes(16).toString('hex')
    const child = spawn(process.execPath, [`${appDir}/secure-harness.mjs`, targetRoom], {
      cwd: appDir,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME || '/tmp',
        HARNESS: '1',
        BK_ROOM: targetRoom,
        HARNESS_NONCE: nonce,
        TARGET_SERVER: path.resolve(filePath),
      },
    })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('close', (code) => {
      let detail = null
      const lines = out.trim().split('\n').filter(Boolean)
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]
        if (line.startsWith('__HARNESS_RESULT__:')) {
          try {
            const parsed = JSON.parse(line.slice('__HARNESS_RESULT__:'.length))
            if (parsed && typeof parsed.pass === 'boolean' && parsed.nonce === nonce) {
              detail = parsed
              break
            }
          } catch {}
        }
      }
      let pass = false
      if (!detail || typeof detail.pass !== 'boolean') {
        detail = { pass: false, reason: 'process exited unexpectedly or forged result' }
      } else {
        pass = code === 0 && detail.pass === true
      }
      resolve({ code, pass, detail, out })
    })
    child.on('error', (e) => resolve({ code: 1, pass: false, detail: { error: e.message } }))
  })
}

const rooms = [
  'sqli',
  'xss',
  'idor',
  'client',
  'headers',
  'rate-limit',
  'hide-secret',
  'full-review',
]

test('secure-coding harness fails on unpatched server.js across all rooms', async () => {
  for (const r of rooms) {
    const res = await runHarnessWithFile(r, `${appDir}/server.js`)
    assert.equal(res.pass, false, `unpatched server.js must fail ${r}`)
  }
})

test('secure-coding harness passes on all reference solutions', async () => {
  for (const r of rooms) {
    const refFile = path.join(refDir, `ref-${r}.js`)
    assert.ok(fs.existsSync(refFile), `reference fixture exists for ${r}`)
    const res = await runHarnessWithFile(r, refFile)
    assert.equal(res.pass, true, `reference solution must pass ${r}`)
  }
})

test('secure-coding harness fails on sloppy fixes and attack fixtures', async () => {
  const sloppy = [
    { room: 'sqli', fixture: 'sqli-blacklist.js' },
    { room: 'xss', fixture: 'xss-strip-script.js' },
    { room: 'idor', fixture: 'idor-hardcode-1337.js' },
    { room: 'client', fixture: 'client-zero-only.js' },
    { room: 'hide-secret', fixture: 'hide-secret-partial.js' },
    { room: 'rate-limit', fixture: 'rate-limit-no-reset.js' },
    { room: 'sqli', fixture: 'exit-zero.js' },
    { room: 'sqli', fixture: 'forged-result.js' },
    { room: 'full-review', fixture: 'forged-result.js' },
  ]
  for (const s of sloppy) {
    const file = path.join(fixturesDir, s.fixture)
    assert.ok(fs.existsSync(file), `fixture exists: ${s.fixture}`)
    const res = await runHarnessWithFile(s.room, file)
    assert.equal(res.pass, false, `sloppy fixture ${s.fixture} must fail ${s.room}`)
  }
})
