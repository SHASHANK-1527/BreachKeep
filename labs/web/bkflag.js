// Per-room flag gating for the Trading Post when it is used as a Web Dungeon
// target. Each web room runs its OWN container with BK_ROOM set to that room, so
// only the intended vulnerability yields the real flag; the other vulns return a
// decoy. When BK_ROOM is unset (local dev, or the Secure-Coding harness that
// imports this app), reward() returns the real flag exactly as before.
import { formatFor, wrapFlag, getDecoyFormats } from '../../apps/shared/flagFormats.js'

export const ROOM = process.env.BK_ROOM || ''
const roomFmt = formatFor(ROOM || 'web-recon')
export const FLAG = process.env.BK_FLAG || wrapFlag('dev_web_flag_placeholder', roomFmt)

export function reward(room) {
  if (!ROOM || ROOM === room) return FLAG
  const decoyFmt = getDecoyFormats(ROOM || 'web-recon', 1)[0] || { prefix: 'KEEP', open: '[', close: ']' }
  return wrapFlag('wrong_room_keep_looking', decoyFmt)
}
