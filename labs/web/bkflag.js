// Per-room flag gating for the Trading Post when it is used as a Web Dungeon
// target. Each web room runs its OWN container with BK_ROOM set to that room, so
// only the intended vulnerability yields the real flag; the other vulns return a
// decoy. When BK_ROOM is unset (local dev, or the Secure-Coding harness that
// imports this app), reward() returns the real flag exactly as before — so
// nothing about the vulnerabilities or the harness changes.
export const ROOM = process.env.BK_ROOM || ''
export const FLAG = process.env.BK_FLAG || 'BK{dev-web}'

export function reward(room) {
  if (!ROOM || ROOM === room) return FLAG
  return 'BK{wrong-room-keep-looking}'
}
