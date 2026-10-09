import crypto from 'crypto'
import assert from 'node:assert/strict'
import { DUNGEON_ROOMS } from '../apps/api/src/controllers/labController.js'
import { INTRO_ROOMS } from '../apps/api/src/controllers/introController.js'
import { formatFor, wrapFlag } from '../apps/shared/flagFormats.js'
import { ROOM_SLUGS, flagFor, checkFlag } from '../apps/api/src/utils/flags.js'
import { judgeCapstone } from '../apps/api/src/config/capstone.js'

process.env.FLAG_HMAC_SECRET = 'migration-test-secret-12345'
const testStudent = 'student_test_migration_42'
const allRooms = [...Object.values(DUNGEON_ROOMS).flat(), ...INTRO_ROOMS, 'capstone-gauntlet']

console.log('=== TEST SUITE 1: Without FLAG_MIGRATION_COMPAT (strict current format) ===')
delete process.env.FLAG_MIGRATION_COMPAT

let passCount = 0
for (const roomId of allRooms) {
  const currentFmt = formatFor(roomId)
  const slug = ROOM_SLUGS[roomId] || String(roomId || 'room').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  const mac = crypto
    .createHmac('sha256', process.env.FLAG_HMAC_SECRET)
    .update(`${testStudent}:${roomId}`)
    .digest('hex')
    .slice(0, 16)
  const inner = `${slug}_${mac}`
  const newFlag = wrapFlag(inner, currentFmt)
  const oldBkFlag = `BK{${inner}}`

  // Current flag MUST be accepted
  assert.equal(checkFlag(testStudent, roomId, newFlag), true, `new flag accepted for ${roomId}`)

  // Old BK flag behavior:
  if (currentFmt.prefix === 'BK') {
    // Rooms still on BK{} accept it because it is their current format
    assert.equal(checkFlag(testStudent, roomId, oldBkFlag), true)
  } else {
    // Rooms whose format changed MUST reject old BK flag without migration env var
    assert.equal(checkFlag(testStudent, roomId, oldBkFlag), false, `old BK flag rejected for changed ${roomId}`)
  }
  passCount++
}
console.log(`Passed ${passCount}/${allRooms.length} strict checks without migration env var.`)

console.log('\n=== TEST SUITE 2: With FLAG_MIGRATION_COMPAT=1 (migration window) ===')
process.env.FLAG_MIGRATION_COMPAT = '1'

let migrationPassCount = 0
for (const roomId of allRooms) {
  const currentFmt = formatFor(roomId)
  const slug = ROOM_SLUGS[roomId] || String(roomId || 'room').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  const mac = crypto
    .createHmac('sha256', process.env.FLAG_HMAC_SECRET)
    .update(`${testStudent}:${roomId}`)
    .digest('hex')
    .slice(0, 16)
  const inner = `${slug}_${mac}`
  const newFlag = wrapFlag(inner, currentFmt)
  const oldBkFlag = `BK{${inner}}`

  // Both current and old BK flags MUST be accepted for non-capstone rooms
  assert.equal(checkFlag(testStudent, roomId, newFlag), true)
  if (roomId === 'capstone-gauntlet') {
    // Capstone MUST STILL REJECT BK flag even during migration window!
    assert.equal(checkFlag(testStudent, roomId, oldBkFlag), false, 'capstone must reject BK even with migration compat')
    assert.equal(judgeCapstone(oldBkFlag, testStudent).correct, false, 'judgeCapstone must reject BK')
  } else {
    assert.equal(checkFlag(testStudent, roomId, oldBkFlag), true, `old BK flag accepted under migration compat for ${roomId}`)
  }
  migrationPassCount++
}

// Special test for terminal-1-pipes hand-reassignment: WARD[[p1p3_...]] accepted during migration window
const pipesSlug = ROOM_SLUGS['terminal-1-pipes']
const pipesMac = crypto
  .createHmac('sha256', process.env.FLAG_HMAC_SECRET)
  .update(`${testStudent}:terminal-1-pipes`)
  .digest('hex')
  .slice(0, 16)
const wardPipesFlag = `WARD[[${pipesSlug}_${pipesMac}]]`
assert.equal(checkFlag(testStudent, 'terminal-1-pipes', wardPipesFlag), true, 'WARD flag accepted for terminal-1-pipes during migration window')

// Turn off migration and verify WARD flag on terminal-1-pipes is now rejected
delete process.env.FLAG_MIGRATION_COMPAT
assert.equal(checkFlag(testStudent, 'terminal-1-pipes', wardPipesFlag), false, 'WARD flag rejected for terminal-1-pipes when migration off')

console.log(`Passed ${migrationPassCount}/${allRooms.length} checks with migration window.`)
console.log('All migration compatibility assertions PASSED successfully!')
