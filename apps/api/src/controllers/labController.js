import DungeonState from '../models/DungeonState.js'
import { flagFor } from '../utils/flags.js'
import { labClient } from '../utils/labClient.js'

// Which dungeon a room belongs to. Mirrors apps/provisioner/src/dungeons.js.
// Used to (a) reject unknown rooms and (b) refuse to boot a container for a
// dungeon the Warden has not made live.
const DUNGEON_ROOMS = {
  'terminal-1': [
    'terminal-1-first-steps', 'terminal-1-reading', 'terminal-1-hidden',
    'terminal-1-finding', 'terminal-1-grep', 'terminal-1-pipes',
    'terminal-1-archives', 'terminal-1-strings', 'terminal-1-log-detective',
    'terminal-1-needle',
  ],
  'terminal-2': [
    'terminal-2-perms', 'terminal-2-groups', 'terminal-2-env',
    'terminal-2-scripts', 'terminal-2-escalation', 'terminal-2-cron-watch',
    'terminal-2-path-order', 'terminal-2-suid-audit',
    'terminal-2-misconfig-chain', 'terminal-2-audit-report',
  ],
  'network': [
    'network-ports', 'network-scan', 'network-banner', 'network-capture',
    'network-dns', 'network-http', 'network-protocol-id', 'network-firewall',
    'network-pcap-forensics', 'network-pivot',
  ],
  'web': [
    'web-recon', 'web-devtools', 'web-cookie-trust', 'web-client-trust',
    'web-idor', 'web-sqli', 'web-reflected-xss', 'web-headers',
    'web-stored-xss', 'web-chain',
  ],
  'secure-coding': [
    'secure-sqli', 'secure-xss', 'secure-idor', 'secure-client',
    'secure-headers', 'secure-rate-limit', 'secure-hide-secret',
    'secure-full-review',
  ],
}
const ROOM_DUNGEON = {}
for (const [d, rooms] of Object.entries(DUNGEON_ROOMS)) for (const r of rooms) ROOM_DUNGEON[r] = d

// POST /api/labs/open { roomId } -> { url }
// Boots (or reuses) this student's container for the room and returns the
// tokened terminal URL. The flag is derived per-student and injected into the
// container; it is never sent to the browser.
export async function openLab(req, res) {
  const { roomId } = req.body
  if (!roomId) return res.status(400).json({ error: 'roomId required' })
  const dungeonId = ROOM_DUNGEON[roomId]
  if (!dungeonId) return res.status(400).json({ error: 'unknown_room' })

  const live = await DungeonState.findOne({ dungeonId, live: true })
  if (!live) return res.status(409).json({ error: 'dungeon_not_live' })

  const sid = req.user._id.toString()
  const flag = flagFor(sid, roomId)
  try {
    const r = await labClient.provision(sid, roomId, flag)
    const token = r.token
    const url = token ? `${r.url}?token=${token}` : r.url
    // r.url is /labs/<name>; the same container's web app (web rooms) is at /app/<name>.
    const name = String(r.url || '').replace(/^\/labs\//, '')
    const appUrl = name ? (token ? `/app/${name}?token=${token}` : `/app/${name}`) : null
    // name + token let the secure-coding editor call the room's grader at
    // /app/<name>/files and /app/<name>/save with the per-session token.
    return res.json({ url, appUrl, name, token })
  } catch (e) {
    const detail = e?.cause?.message ? `${e.message} (${e.cause.message})` : String(e.message)
    console.error(`[labController] openLab failed for room ${roomId}:`, e)
    return res.status(502).json({ error: 'lab_unavailable', detail })
  }
}

// POST /api/labs/stop { roomId }
export async function stopLab(req, res) {
  const { roomId } = req.body
  if (!roomId) return res.status(400).json({ error: 'roomId required' })
  try { await labClient.stop(req.user._id.toString(), roomId) } catch { /* best effort */ }
  return res.json({ ok: true })
}
