import express from 'express'
import dotenv from 'dotenv'
import { DUNGEONS } from './dungeons.js'
import { buildImage, runContainer, stopContainer, removeImage } from './docker.js'
import { registry } from './registry.js'
import { startIdleReaper } from './idle-reaper.js'
dotenv.config()

const app = express()
app.use(express.json())

// shared-secret auth on every call from the api service
app.use((req, res, next) => {
  if (req.headers['x-prov-secret'] !== process.env.PROVISIONER_SHARED_SECRET)
    return res.status(403).json({ error: 'forbidden' })
  next()
})

app.get('/health', (req, res) => res.json({ ok: true, service: 'provisioner' }))

// POST /provision { studentId, roomId, flag }
app.post('/provision', async (req, res) => {
  const { studentId, roomId, flag } = req.body
  try {
    const name = `bk_${studentId}_${roomId}`.replace(/[^a-zA-Z0-9_]/g, '')
    const existing = registry.get(studentId, roomId)
    if (existing) { registry.touch(studentId, roomId); return res.json({ url: `/labs/${name}` }) }
    const image = `breachkeep/${roomId}:latest`
    await runContainer({ image, name, env: [`BK_FLAG=${flag}`] })
    registry.set(studentId, roomId, name)
    return res.json({ url: `/labs/${name}` })
  } catch (e) {
    console.error('provision', e)
    return res.status(500).json({ error: 'provision failed', detail: e.message })
  }
})

// POST /stop { studentId, roomId }
app.post('/stop', async (req, res) => {
  const { studentId, roomId } = req.body
  const name = `bk_${studentId}_${roomId}`.replace(/[^a-zA-Z0-9_]/g, '')
  await stopContainer(name)
  registry.del(studentId, roomId)
  return res.json({ ok: true })
})

// POST /dungeon { dungeonId, live }  -> build images (live) or tear down (off)
app.post('/dungeon', async (req, res) => {
  const { dungeonId, live } = req.body
  const def = DUNGEONS[dungeonId]
  if (!def) return res.status(400).json({ error: 'unknown dungeon' })
  try {
    if (live) {
      for (const room of def.rooms) await buildImage(def.context, `breachkeep/${room}:latest`)
      return res.json({ ok: true, built: def.rooms })
    } else {
      for (const room of def.rooms) {
        for (const [s] of []) {} // (container cleanup handled by reaper + explicit stop)
        await removeImage(`breachkeep/${room}:latest`)
      }
      return res.json({ ok: true, removed: def.rooms })
    }
  } catch (e) {
    console.error('dungeon', e)
    return res.status(500).json({ error: 'dungeon op failed', detail: e.message })
  }
})

const PORT = parseInt(process.env.PROV_PORT || '6000', 10)
app.listen(PORT, () => { console.log(`[provisioner] internal-only on :${PORT}`); startIdleReaper() })
