import http from 'http'
import crypto from 'crypto'
import express from 'express'
import dotenv from 'dotenv'
import httpProxy from 'http-proxy'
import { DUNGEONS, roomCaps } from './dungeons.js'
import {
  buildImage, runContainer, stopContainer, removeImage, ensureLabNetwork,
  startCapstone, stopCapstone,
} from './docker.js'
import { registry } from './registry.js'
import { startIdleReaper } from './idle-reaper.js'
dotenv.config()

const app = express()

// --- tiny cookie parser (avoids a dependency) ---
function parseCookies(header) {
  const out = {}
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return out
}

// Public-facing proxy routes (a student's browser reaches these through nginx).
//  - /labs/<name>  -> the ttyd terminal on :7681. ttyd runs with --base-path
//    /labs/<name>, so URLs pass through UNREWRITTEN (strip:false).
//  - /app/<name>   -> the room's web app (the Trading Post) on :8080. That app
//    is not path-aware, so we STRIP the /app/<name> prefix before forwarding.
// Both are authenticated by the per-session token minted at /provision (never
// the api<->prov shared secret). The first navigation carries ?token=...; we
// set a path-scoped cookie so follow-up asset/XHR/WS requests stay authorised.
const PROXY_ROUTES = [
  { prefix: 'labs', re: /^\/labs\/([A-Za-z0-9_]+)(?:\/.*)?$/, port: 7681, strip: false },
  { prefix: 'app',  re: /^\/app\/([A-Za-z0-9_]+)(?:\/.*)?$/,  port: 8080, strip: true },
]
const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true, xfwd: true })
proxy.on('error', (err, req, res) => {
  try {
    if (res && res.writeHead && !res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' })
    if (res && res.end) res.end('lab service unavailable')
  } catch {}
})

function matchRoute(urlpath) {
  for (const r of PROXY_ROUTES) {
    const m = r.re.exec(urlpath)
    if (m) return { route: r, name: m[1] }
  }
  return null
}

function authFor(req) {
  const mr = matchRoute((req.url || '').split('?')[0])
  if (!mr) return null
  const entry = registry.byName(mr.name)
  if (!entry) return null
  const url = new URL(req.url, 'http://x')
  const qToken = url.searchParams.get('token')
  const cToken = parseCookies(req.headers.cookie)[`bk_${mr.name}`]
  if (qToken !== entry.token && cToken !== entry.token) return null
  return { ...mr, entry }
}

app.use((req, res, next) => {
  const mr = matchRoute(req.path)
  if (!mr) return next() // not a lab path -> fall through to the secret-gated API
  const auth = authFor(req)
  if (!auth) return res.status(403).type('text/plain').send('forbidden')
  const { route, name, entry } = auth
  res.setHeader(
    'Set-Cookie',
    `bk_${name}=${entry.token}; Path=/${route.prefix}/${name}; HttpOnly; SameSite=Lax`
  )
  registry.touchByName(name)
  if (route.strip) {
    const p = `/${route.prefix}/${name}`
    if (req.url.startsWith(p)) req.url = req.url.slice(p.length) || '/'
  }
  proxy.web(req, res, { target: `http://${name}:${route.port}` })
})

// --- shared-secret auth on every (non-lab) call from the api service ---
app.use((req, res, next) => {
  if (req.headers['x-prov-secret'] !== process.env.PROVISIONER_SHARED_SECRET)
    return res.status(403).json({ error: 'forbidden' })
  next()
})

app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true, service: 'provisioner' }))

// POST /provision { studentId, roomId, flag } -> { url, token }
app.post('/provision', async (req, res) => {
  const { studentId, roomId, flag } = req.body
  try {
    const name = `bk_${studentId}_${roomId}`.replace(/[^a-zA-Z0-9_]/g, '')
    const existing = registry.get(studentId, roomId)
    if (existing) {
      registry.touch(studentId, roomId)
      return res.json({ url: `/labs/${name}`, token: existing.token })
    }
    const token = crypto.randomBytes(18).toString('hex')
    const { caps, noNewPriv } = roomCaps(roomId)
    const image = `breachkeep/${roomId}:latest`
    await runContainer({
      image,
      name,
      env: [`BK_FLAG=${flag}`, `BK_BASE=/labs/${name}`],
      caps,
      noNewPriv,
    })
    registry.set(studentId, roomId, name, token)
    return res.json({ url: `/labs/${name}`, token })
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

// POST /dungeon { dungeonId, live } -> build images (live) or tear down (off)
app.post('/dungeon', async (req, res) => {
  const { dungeonId, live } = req.body
  const def = DUNGEONS[dungeonId]
  if (!def) return res.status(400).json({ error: 'unknown dungeon' })
  try {
    if (live) {
      for (const room of def.rooms) await buildImage(def.context, room, `breachkeep/${room}:latest`)
      return res.json({ ok: true, built: def.rooms })
    } else {
      for (const room of def.rooms) await removeImage(`breachkeep/${room}:latest`)
      return res.json({ ok: true, removed: def.rooms })
    }
  } catch (e) {
    console.error('dungeon', e)
    return res.status(500).json({ error: 'dungeon op failed', detail: e.message })
  }
})

// POST /capstone { action: 'start' | 'stop' } -> run/stop the shared target box
app.post('/capstone', async (req, res) => {
  const { action } = req.body
  try {
    if (action === 'start') { const id = await startCapstone(); return res.json({ ok: true, started: id }) }
    if (action === 'stop') { await stopCapstone(); return res.json({ ok: true, stopped: true }) }
    return res.status(400).json({ error: 'bad action' })
  } catch (e) {
    console.error('capstone', e)
    return res.status(500).json({ error: 'capstone op failed', detail: e.message })
  }
})

const PORT = parseInt(process.env.PROV_PORT || '5050', 10)
const server = http.createServer(app)

// WebSocket upgrades (the ttyd terminal under /labs; any ws the web app might
// use under /app). Authorised by the scoped cookie the first HTTP load set.
server.on('upgrade', (req, socket, head) => {
  const mr = matchRoute((req.url || '').split('?')[0])
  if (!mr) return socket.destroy()
  const { route, name } = mr
  const entry = registry.byName(name)
  const cToken = parseCookies(req.headers.cookie)[`bk_${name}`]
  if (!entry || cToken !== entry.token) return socket.destroy()
  registry.touchByName(name)
  if (route.strip) {
    const p = `/${route.prefix}/${name}`
    if (req.url.startsWith(p)) req.url = req.url.slice(p.length) || '/'
  }
  proxy.ws(req, socket, head, { target: `http://${name}:${route.port}` })
})

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`[provisioner] internal-only on :${PORT}`)
  try { await ensureLabNetwork() } catch (e) { console.error('lab network setup failed:', e.message) }
  startIdleReaper()
})
