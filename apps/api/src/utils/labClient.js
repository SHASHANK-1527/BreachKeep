// Thin HTTP client to the provisioner. The provisioner is the ONLY process
// allowed to talk to Docker; it is internal-only (never exposed by nginx).
const BASE = process.env.PROVISIONER_URL || 'http://provisioner:6000'
const SECRET = process.env.PROVISIONER_SHARED_SECRET || ''

async function call(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-prov-secret': SECRET },
    body: JSON.stringify(body || {}),
  })
  if (!res.ok) throw new Error(`provisioner ${path} -> ${res.status}`)
  return res.json()
}

export const labClient = {
  provision: (studentId, roomId, flag) => call('/provision', { studentId, roomId, flag }),
  stop: (studentId, roomId) => call('/stop', { studentId, roomId }),
  setDungeon: (dungeonId, live) => call('/dungeon', { dungeonId, live }),
  capstone: (action) => call('/capstone', { action }),
}
