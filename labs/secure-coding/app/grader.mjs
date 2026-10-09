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
import crypto from 'crypto'
import path from 'path'

const DIR = process.env.APP_DIR || (process.platform === 'win32' || !process.env.DOCKER ? path.resolve('labs/secure-coding/app') : '/app')
const ROOM = process.env.BK_ROOM || ''
const FLAG = process.env.BK_FLAG || 'BK{dev-secure}'

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(obj))
}

export function runHarness(targetRoom = ROOM, appDir = DIR) {
  return new Promise((resolve) => {
    const nonce = crypto.randomBytes(16).toString('hex')
    // Container uses setpriv to drop root privileges to 'runner' uid.
    // Outside container (or Windows), setpriv is stubbed/skipped.
    const useSetpriv = !process.env.NO_SETPRIV && process.platform !== 'win32' && !process.env.SKIP_SETPRIV
    const cmd = useSetpriv ? 'setpriv' : process.execPath
    const args = useSetpriv
      ? ['--reuid', 'runner', '--regid', 'runner', '--clear-groups', 'node', `${appDir}/secure-harness.mjs`, targetRoom]
      : [`${appDir}/secure-harness.mjs`, targetRoom]

    const child = spawn(cmd, args, {
      cwd: appDir,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME || '/tmp',
        HARNESS: '1',
        BK_ROOM: targetRoom,
        HARNESS_NONCE: nonce,
        TARGET_SERVER: process.env.TARGET_SERVER || `${appDir}/server.js`,
      },
    })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('close', (code) => resolve({ code, out, nonce }))
    child.on('error', (e) => resolve({ code: 1, out: String(e.message), nonce }))
  })
}

export async function evaluateSubmission(content, targetRoom = ROOM, appDir = DIR) {
  if (content) {
    await writeFile(`${appDir}/server.js`, content)
  }
  const { code, out, nonce } = await runHarness(targetRoom, appDir)
  let detail = null
  const lines = out.trim().split('\n').filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (line.startsWith('__HARNESS_RESULT__:')) {
      try {
        const parsed = JSON.parse(line.slice('__HARNESS_RESULT__:'.length))
        if (parsed && typeof parsed.pass === 'boolean' && parsed.nonce === nonce) {
          detail = parsed
          break
        }
      } catch {}
    }
  }
  let pass = false
  if (!detail || typeof detail.pass !== 'boolean') {
    detail = { pass: false, reason: 'process exited unexpectedly or forged result' }
  } else {
    pass = code === 0 && detail.pass === true
  }
  return { pass, detail, output: out.slice(-4000), flag: pass ? FLAG : undefined }
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
      const result = await evaluateSubmission(content, ROOM, DIR)
      return send(res, 200, result)
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
