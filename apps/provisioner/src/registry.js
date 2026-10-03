// Tracks live per-(student,room) containers: last-touch time for idle reaping,
// the container name, and the per-session token that authorises the terminal
// proxy. Indexed both by (student,room) and by container name (the proxy only
// knows the name from the URL).
const live = new Map()   // key `${studentId}:${roomId}` -> { name, token, lastSeen }
const byName = new Map() // name -> same object

export const registry = {
  key: (s, r) => `${s}:${r}`,
  set(s, r, name, token) {
    const rec = { name, token, lastSeen: Date.now() }
    live.set(this.key(s, r), rec)
    byName.set(name, rec)
  },
  touch(s, r) { const v = live.get(this.key(s, r)); if (v) v.lastSeen = Date.now() },
  touchByName(name) { const v = byName.get(name); if (v) v.lastSeen = Date.now() },
  get(s, r) { return live.get(this.key(s, r)) },
  byName(name) { return byName.get(name) },
  del(s, r) {
    const v = live.get(this.key(s, r))
    if (v) byName.delete(v.name)
    live.delete(this.key(s, r))
  },
  all() { return [...live.entries()] },
}
