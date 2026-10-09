import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.FLAG_HMAC_SECRET = 'test-flag-secret'
const { flagFor, checkFlag, randomAlphanumeric, safeEqual, parseFlag } = await import('../src/utils/flags.js')

test('HMAC flags are per-student and stable', () => {
  const a = flagFor('userA', 'terminal-1')
  assert.equal(a, flagFor('userA', 'terminal-1'))
  assert.notEqual(a, flagFor('userB', 'terminal-1'))
  assert.ok(parseFlag(a) !== null)
})
test("checkFlag rejects another student's flag", () => {
  const aFlag = flagFor('userA', 'terminal-1')
  assert.equal(checkFlag('userA', 'terminal-1', aFlag), true)
  assert.equal(checkFlag('userB', 'terminal-1', aFlag), false)
  assert.equal(checkFlag('userA', 'terminal-1', 'BK{wrong}'), false)
})
test('randomAlphanumeric avoids ambiguous chars', () => {
  for (let i = 0; i < 100; i++) {
    const c = randomAlphanumeric(8)
    assert.equal(c.length, 8)
    assert.ok(!/[O01IL]/.test(c))
  }
})
test('safeEqual correctness', () => {
  assert.equal(safeEqual('abc', 'abc'), true)
  assert.equal(safeEqual('abc', 'abd'), false)
  assert.equal(safeEqual('abc', 'abcd'), false)
})

// house sorting math (pure, no DB): balanced pick with random tie-break
import crypto from 'crypto'
function pickHouse(counts) {
  const HOUSES = ['rimeguard','emberkeep','arcweave','voltgrid']
  const min = Math.min(...HOUSES.map(h => counts[h]||0))
  const cands = HOUSES.filter(h => (counts[h]||0) === min)
  return cands[crypto.randomInt(cands.length)]
}
test('sorting keeps houses within 1 of each other', () => {
  const counts = { rimeguard:0, emberkeep:0, arcweave:0, voltgrid:0 }
  for (let i=0;i<400;i++) counts[pickHouse(counts)]++
  const vals = Object.values(counts)
  assert.ok(Math.max(...vals)-Math.min(...vals) <= 1, JSON.stringify(counts))
})

test('format diversification assigns varied formats and decoys never reuse room format', async () => {
  const { formatFor, getDecoyFormats } = await import('../../shared/flagFormats.js')
  const rooms = ['terminal-1-hidden', 'terminal-1-finding', 'network-ports', 'terminal-2-env']
  for (const r of rooms) {
    const fmt = formatFor(r)
    const decoys = getDecoyFormats(r, 3)
    assert.ok(decoys.every((d) => d.index !== fmt.index), `decoys in ${r} must not reuse room format`)
  }
})

test('rate limiting returns 429 on 7th rapid submission', async () => {
  const { submitFlag } = await import('../src/controllers/flagController.js')
  const req = {
    user: { _id: 'ratelimituser1' },
    body: { roomId: 'terminal-1-hidden', flag: 'WRONG_FLAG' }
  }
  const responses = []
  for (let i = 0; i < 7; i++) {
    let statusCode = 200
    let jsonBody = null
    const res = {
      status(code) { statusCode = code; return this },
      json(data) { jsonBody = data; return this }
    }
    await submitFlag(req, res)
    responses.push({ statusCode, jsonBody })
  }
  // Attempts 0-5 (first 6) return 200 with { correct: false }
  for (let i = 0; i < 6; i++) {
    assert.equal(responses[i].statusCode, 200)
    assert.equal(responses[i].jsonBody.correct, false)
    assert.equal(responses[i].jsonBody.hint, undefined, 'no decoy oracle hint on standard rooms')
  }
  // 7th attempt returns 429
  assert.equal(responses[6].statusCode, 429)
  assert.ok(responses[6].jsonBody.error.includes('slow down'))
})

test('capstone real-flag format is not BK', async () => {
  const { formatFor } = await import('../../shared/flagFormats.js')
  const { CAPSTONE_ROOM } = await import('../src/config/capstone.js')
  const rootFmt = formatFor(CAPSTONE_ROOM)
  assert.notEqual(rootFmt.prefix, 'BK', 'capstone real-flag prefix must not be BK')
  assert.notEqual(rootFmt.index, 0, 'capstone real-flag format index must not be 0')
  assert.equal(rootFmt.prefix, 'WARD')
})

test('capstone real-flag format is not in the capstone decoy format set', async () => {
  const { formatFor, getDecoyFormats } = await import('../../shared/flagFormats.js')
  const { CAPSTONE_ROOM } = await import('../src/config/capstone.js')
  const rootFmt = formatFor(CAPSTONE_ROOM)
  const decoyFormats = getDecoyFormats(CAPSTONE_ROOM, 6)
  assert.ok(decoyFormats.every((d) => d.index !== rootFmt.index), 'root format must not be in decoy format set')
  assert.ok(decoyFormats.every((d) => d.prefix !== 'BK'), 'no capstone decoy uses BK')
})

test('all 7 capstone formats are pairwise distinct', async () => {
  const { formatFor } = await import('../../shared/flagFormats.js')
  const { CAPSTONE_ROOM, CAPSTONE_DECOYS } = await import('../src/config/capstone.js')
  const rootFmt = formatFor(CAPSTONE_ROOM)
  const plantedDecoyKeys = Object.keys(CAPSTONE_DECOYS)
  assert.equal(plantedDecoyKeys.length, 6, 'exactly 6 decoys in CAPSTONE_DECOYS')
  const allSevenFormats = [rootFmt.prefix, ...plantedDecoyKeys.map((k) => k.split(/[\[<(/\~|:]/)[0])]
  const uniqueFormats = new Set(allSevenFormats)
  assert.equal(uniqueFormats.size, 7, 'all 7 capstone formats must be pairwise distinct')
})

test('WARD is returned by formatFor only for capstone-gauntlet and for no other room id in the room registry', async () => {
  const { formatFor } = await import('../../shared/flagFormats.js')
  const { DUNGEON_ROOMS } = await import('../src/controllers/labController.js')
  const { INTRO_ROOMS } = await import('../src/controllers/introController.js')
  const allRooms = [...Object.values(DUNGEON_ROOMS).flat(), ...INTRO_ROOMS, 'capstone-gauntlet']
  assert.ok(allRooms.length >= 40, 'room registry contains all challenge rooms')
  for (const roomId of allRooms) {
    const fmt = formatFor(roomId)
    if (roomId === 'capstone-gauntlet') {
      assert.equal(fmt.prefix, 'WARD', `capstone-gauntlet must be WARD, got ${fmt.prefix}`)
    } else {
      assert.notEqual(fmt.prefix, 'WARD', `room ${roomId} must not be WARD, got ${fmt.prefix}`)
    }
  }
})

test('flagFor for two different students on capstone-gauntlet differs and both use the WARD wrapper', async () => {
  const { flagFor } = await import('../src/utils/flags.js')
  const { CAPSTONE_ROOM } = await import('../src/config/capstone.js')
  const flag1 = flagFor('student_1', CAPSTONE_ROOM)
  const flag2 = flagFor('student_2', CAPSTONE_ROOM)
  assert.notEqual(flag1, flag2)
  assert.ok(flag1.startsWith('WARD[[') && flag1.endsWith(']]'), 'flag1 uses WARD wrapper')
  assert.ok(flag2.startsWith('WARD[[') && flag2.endsWith(']]'), 'flag2 uses WARD wrapper')
})

test('submitting a BK{...} string to the capstone judge returns { correct: false }', async () => {
  const { judgeCapstone } = await import('../src/config/capstone.js')
  assert.equal(judgeCapstone('BK{dev-capstone-root-flag}').correct, false)
  assert.equal(judgeCapstone('BK{any_fake_string}').correct, false)
  assert.equal(judgeCapstone('BK{robots_said_no}').correct, false)
})

test('each of the 6 capstone decoys, in its assigned format, triggers its hint', async () => {
  const { judgeCapstone, CAPSTONE_DECOYS } = await import('../src/config/capstone.js')
  for (const [decoyString, expectedHint] of Object.entries(CAPSTONE_DECOYS)) {
    const res = judgeCapstone(decoyString)
    assert.equal(res.correct, false)
    assert.equal(res.hint, expectedHint, `decoy hint must fire for ${decoyString}`)
  }
})

test('submitting the capstone decoys in the OLD BK format returns no hint', async () => {
  const { judgeCapstone } = await import('../src/config/capstone.js')
  const oldDecoys = [
    'BK{robots_said_no}',
    'BK{backup_left_in_webroot}',
    'BK{env_file_exposed}',
    'BK{html_source_comment}',
    'BK{user_flag_on_the_box}',
    'BK{almost_there_check_sudo}',
  ]
  for (const oldDecoy of oldDecoys) {
    const res = judgeCapstone(oldDecoy)
    assert.equal(res.correct, false)
    assert.equal(res.hint, undefined, `old BK format decoy ${oldDecoy} must not trigger a hint`)
  }
})

test('SIMULATED: entrypoint.sh flag-planting simulation plants WARD root flag and 6 non-BK decoys', async () => {
  const { testEntrypointPlantedFiles } = await import('../../../scripts/test-entrypoint-sim.mjs')
  assert.equal(testEntrypointPlantedFiles(), true)
})

test('flag migration safety: backward compatibility gated on FLAG_MIGRATION_COMPAT and capstone excluded', async () => {
  const { DUNGEON_ROOMS } = await import('../src/controllers/labController.js')
  const { INTRO_ROOMS } = await import('../src/controllers/introController.js')
  const { formatFor, wrapFlag } = await import('../../shared/flagFormats.js')
  const { ROOM_SLUGS, checkFlag } = await import('../src/utils/flags.js')
  const { judgeCapstone } = await import('../src/config/capstone.js')

  const testStudent = 'student_test_migration_42'
  const allRooms = [...Object.values(DUNGEON_ROOMS).flat(), ...INTRO_ROOMS, 'capstone-gauntlet']

  // 1. Without FLAG_MIGRATION_COMPAT: strict matching only
  delete process.env.FLAG_MIGRATION_COMPAT
  for (const roomId of allRooms) {
    const currentFmt = formatFor(roomId)
    const slug = ROOM_SLUGS[roomId] || String(roomId || 'room').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const mac = crypto.createHmac('sha256', process.env.FLAG_HMAC_SECRET).update(`${testStudent}:${roomId}`).digest('hex').slice(0, 16)
    const inner = `${slug}_${mac}`
    const newFlag = wrapFlag(inner, currentFmt)
    const oldBkFlag = `BK{${inner}}`

    assert.equal(checkFlag(testStudent, roomId, newFlag), true)
    if (currentFmt.prefix !== 'BK') {
      assert.equal(checkFlag(testStudent, roomId, oldBkFlag), false, `old BK rejected for ${roomId}`)
    }
  }

  // 2. With FLAG_MIGRATION_COMPAT: accepts both wrappers for standard rooms, strictly excludes capstone
  process.env.FLAG_MIGRATION_COMPAT = '1'
  try {
    for (const roomId of allRooms) {
      const currentFmt = formatFor(roomId)
      const slug = ROOM_SLUGS[roomId] || String(roomId || 'room').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      const mac = crypto.createHmac('sha256', process.env.FLAG_HMAC_SECRET).update(`${testStudent}:${roomId}`).digest('hex').slice(0, 16)
      const inner = `${slug}_${mac}`
      const newFlag = wrapFlag(inner, currentFmt)
      const oldBkFlag = `BK{${inner}}`

      assert.equal(checkFlag(testStudent, roomId, newFlag), true)
      if (roomId === 'capstone-gauntlet') {
        assert.equal(checkFlag(testStudent, roomId, oldBkFlag), false, 'capstone must reject BK even with migration compat')
        assert.equal(judgeCapstone(oldBkFlag, testStudent).correct, false)
      } else {
        assert.equal(checkFlag(testStudent, roomId, oldBkFlag), true, `old BK accepted under migration compat for ${roomId}`)
      }
    }
  } finally {
    delete process.env.FLAG_MIGRATION_COMPAT
  }
})


