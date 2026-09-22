import { registry } from './registry.js'
import { stopContainer } from './docker.js'

export function startIdleReaper() {
  const timeoutMs = (parseInt(process.env.IDLE_TIMEOUT_MIN || '30', 10)) * 60 * 1000
  setInterval(async () => {
    const now = Date.now()
    for (const [key, v] of registry.all()) {
      if (now - v.lastSeen > timeoutMs) {
        await stopContainer(v.name)
        const [s, r] = key.split(':')
        registry.del(s, r)
        console.log('[reaper] stopped idle', v.name)
      }
    }
  }, 60 * 1000)
}
