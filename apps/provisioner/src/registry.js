// Tracks live per-(student,room) containers and last-touch time for idle reaping.
const live = new Map() // key: `${studentId}:${roomId}` -> { name, lastSeen }

export const registry = {
  key: (s, r) => `${s}:${r}`,
  set(s, r, name) { live.set(this.key(s, r), { name, lastSeen: Date.now() }) },
  touch(s, r) { const v = live.get(this.key(s, r)); if (v) v.lastSeen = Date.now() },
  get(s, r) { return live.get(this.key(s, r)) },
  del(s, r) { live.delete(this.key(s, r)) },
  all() { return [...live.entries()] },
}
