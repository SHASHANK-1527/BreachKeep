import path from 'path'
import { spawn } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'

const appDir = path.resolve('labs/secure-coding/app')
const fixturesDir = path.resolve('labs/secure-coding/test-fixtures')
const refDir = path.join(fixturesDir, 'reference')

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

async function runMatrix() {
  console.log('='.repeat(80))
  console.log('SECURE CODING HARNESS VERIFICATION MATRIX')
  console.log('='.repeat(80))
  console.log('Room'.padEnd(15) + ' | ' + 'Fixture'.padEnd(25) + ' | ' + 'Expected'.padEnd(10) + ' | ' + 'Actual'.padEnd(10) + ' | ' + 'Status')
  console.log('-'.repeat(80))

  let mismatches = 0
  const rows = []

  // 1. Unpatched vulnerable server.js on all 8 rooms
  for (const r of rooms) {
    const res = await runHarnessWithFile(r, `${appDir}/server.js`)
    const actual = res.pass ? 'PASS' : 'FAIL'
    const expected = 'FAIL'
    const ok = actual === expected
    if (!ok) mismatches++
    console.log(r.padEnd(15) + ' | ' + 'unpatched server.js'.padEnd(25) + ' | ' + expected.padEnd(10) + ' | ' + actual.padEnd(10) + ' | ' + (ok ? 'OK' : 'MISMATCH'))
    rows.push({ room: r, fixture: 'unpatched server.js', expected, actual, ok })
  }

  // 2. Reference solutions on all 8 rooms
  for (const r of rooms) {
    const refFile = path.join(refDir, `ref-${r}.js`)
    const res = await runHarnessWithFile(r, refFile)
    const actual = res.pass ? 'PASS' : 'FAIL'
    const expected = 'PASS'
    const ok = actual === expected
    if (!ok) mismatches++
    console.log(r.padEnd(15) + ' | ' + `ref-${r}.js`.padEnd(25) + ' | ' + expected.padEnd(10) + ' | ' + actual.padEnd(10) + ' | ' + (ok ? 'OK' : 'MISMATCH'))
    rows.push({ room: r, fixture: `ref-${r}.js`, expected, actual, ok })
  }

  // 3. Sloppy fixes on corresponding rooms
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
    const res = await runHarnessWithFile(s.room, file)
    const actual = res.pass ? 'PASS' : 'FAIL'
    const expected = 'FAIL'
    const ok = actual === expected
    if (!ok) mismatches++
    console.log(s.room.padEnd(15) + ' | ' + s.fixture.padEnd(25) + ' | ' + expected.padEnd(10) + ' | ' + actual.padEnd(10) + ' | ' + (ok ? 'OK' : 'MISMATCH'))
    rows.push({ room: s.room, fixture: s.fixture, expected, actual, ok })
  }

  console.log('='.repeat(80))
  console.log(`Matrix completed: ${rows.length} tests, ${mismatches} mismatches.`)
  if (mismatches > 0) {
    process.exit(1)
  }
}

runMatrix()
