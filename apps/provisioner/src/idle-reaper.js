import { registry } from './registry.js'
import { stopContainer, docker } from './docker.js'

export function startIdleReaper() {
  const timeoutMs = (parseInt(process.env.IDLE_TIMEOUT_MIN || '30', 10)) * 60 * 1000
  setInterval(async () => {
    const now = Date.now()

    // 1. Clean registry-tracked containers that timed out
    for (const [key, v] of registry.all()) {
      if (now - v.lastSeen > timeoutMs) {
        await stopContainer(v.name)
        const [s, r] = key.split(':')
        registry.del(s, r)
        console.log('[reaper] stopped idle', v.name)
      }
    }

    // 2. Clean orphaned bk_ containers not in registry (e.g. survived a provisioner restart)
    try {
      const containers = await docker.listContainers({ all: true })
      for (const c of containers) {
        const name = (c.Names || []).map((n) => n.replace(/^\//, '')).find((n) => n.startsWith('bk_') && n !== 'bk_capstone')
        if (name && !registry.byName(name)) {
          const createdMs = c.Created * 1000
          // If created more than 5 minutes ago and untracked, clean it up
          if (now - createdMs > 5 * 60 * 1000) {
            await stopContainer(name)
            console.log('[reaper] stopped orphaned container', name)
          }
        }
      }
    } catch (e) {
      console.error('[reaper] error checking orphaned containers:', e.message)
    }
  }, 60 * 1000)
}
