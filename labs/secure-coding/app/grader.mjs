// Per-room grader for the Secure Coding dungeon. Serves the editable file to
// the BreachKeep room page, writes the student's edits, reruns the room's
// harness, and reveals the flag ONLY on a genuine pass. Reached through the
// provisioner's /app/<name> proxy (prefix stripped), so it sees /files, /save.
//
// The flag lives in THIS process's env and is passed to the harness child as
// empty, so student-edited code can never read or print it — the grader alone
// releases it, and only when the exploit fails and the app still works.
import http from 'http'
import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { spawn } from 'child_process'

const DIR = '/app'
const ROOM = process.env.BK_ROOM || ''
const FLAG = process.env.BK_FLAG || 'BK{dev-secure}'

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(obj))
}

function runHarness() {
  return new Promise((resolve) => {
    // The grader runs as root and holds the flag in its env. The student's
    // edited code must NOT run as the same uid, or it could read the flag from
    // /proc/<grader>/environ and print it (harness stdout is returned to them).
    // So drop the harness to an unprivileged 'runner' uid via setpriv, with no
    // BK_FLAG anywhere in its environment.
    const child = spawn('setpriv', [
      '--reuid', 'runner', '--regid', 'runner', '--clear-groups',
      'node', `${DIR}/secure-harness.mjs`, ROOM,
    ], {
      cwd: DIR,
      env: { PATH: process.env.PATH, HOME: '/tmp', HARNESS: '1', BK_ROOM: ROOM },
    })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('close', (code) => resolve({ code, out }))
    child.on('error', (e) => resolve({ code: 1, out: String(e.message) }))
  })
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x')
  try {
    if (req.method === 'GET' && u.pathname === '/files') {
      const content = await readFile(`${DIR}/server.js`, 'utf8').catch(() => '')
      return send(res, 200, { room: ROOM, filename: 'server.js', content })
    }
    if (req.method === 'POST' && u.pathname === '/reset') {
      const orig = await readFile(`${DIR}/.orig/server.js`, 'utf8')
      await writeFile(`${DIR}/server.js`, orig)
      return send(res, 200, { ok: true })
    }
    if (req.method === 'POST' && u.pathname === '/save') {
      let body = ''
      for await (const c of req) { body += c; if (body.length > 200000) return send(res, 413, { error: 'too large' }) }
      let content
      try { content = JSON.parse(body).content } catch { return send(res, 400, { error: 'bad json' }) }
      if (typeof content !== 'string' || !content.trim()) return send(res, 400, { error: 'empty content' })
      await writeFile(`${DIR}/server.js`, content)
      const { code, out } = await runHarness()
      let detail = {}
      try { detail = JSON.parse(out.trim().split('\n').filter(Boolean).pop()) } catch {}
      const pass = code === 0
      return send(res, 200, { pass, detail, output: out.slice(-4000), flag: pass ? FLAG : undefined })
    }
    send(res, 404, { error: 'not found' })
  } catch (e) {
    send(res, 500, { error: String(e.message) })
  }
})

// Stash a pristine copy for /reset on first boot.
;(async () => {
  try {
    await mkdir(`${DIR}/.orig`, { recursive: true })
    await access(`${DIR}/.orig/server.js`).catch(async () => {
      await writeFile(`${DIR}/.orig/server.js`, await readFile(`${DIR}/server.js`, 'utf8'))
    })
  } catch {}
  server.listen(8080, () => console.log(`[grader] on :8080 room=${ROOM}`))
})()
