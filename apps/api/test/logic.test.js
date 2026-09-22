import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.FLAG_HMAC_SECRET = 'test-flag-secret'
const { flagFor, checkFlag, randomAlphanumeric, safeEqual } = await import('../src/utils/flags.js')

test('HMAC flags are per-student and stable', () => {
  const a = flagFor('userA', 'terminal-1')
  assert.equal(a, flagFor('userA', 'terminal-1'))
  assert.notEqual(a, flagFor('userB', 'terminal-1'))
  assert.ok(a.startsWith('BK{'))
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
