// ⚠️ DELIBERATELY VULNERABLE. Web Dungeon target + Secure Coding subject.
// Each vulnerability is tagged // VULN: <room>. The Secure Coding harness reruns
// these exploits; a fix passes when the exploit fails and the app still works.
//
// Flags are per-room via reward() (see bkflag.js): in the Web Dungeon each room
// runs with BK_ROOM set so only its intended vuln yields the real flag. With
// BK_ROOM unset (local dev / Secure-Coding harness) every reward() returns the
// real flag, exactly as before — the vulnerabilities themselves are unchanged.
import express from 'express'
import cookieParser from 'cookie-parser'
import crypto from 'crypto'
import { makeDb } from './seed.js'
import { reward } from './bkflag.js'

const db = makeDb()
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

const FLAG = process.env.BK_FLAG || 'BK{dev-web}'

// ---- in-memory state for the stored/reflected XSS rooms ----
const solved = {}                 // room -> true once a payload has reported in
const NONCE = crypto.randomBytes(6).toString('hex')  // embedded in pages; the
// injected script reads it and sends it back, so a blind curl to /xss-report
// (without rendering the page) is not the intended path.
const guestbook = []              // stored comments (rendered unescaped)

// Room 1 — recon: robots and sitemap disclose site navigation structure
app.get('/robots.txt', (_req, res) =>
  res.type('text/plain').send('User-agent: *\nDisallow: /portal-8f2c/\nDisallow: /keep-backup/\nDisallow: /keep-admin/\n\nSitemap: /sitemap.xml\n'))

app.get('/sitemap.xml', (_req, res) =>
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc></url>
  <url><loc>/account</loc></url>
  <url><loc>/vault</loc></url>
  <url><loc>/search</loc></url>
  <url><loc>/guestbook</loc></url>
</urlset>`))

app.get('/', (_req, res) => res.send(
  `<!-- hint: check /robots.txt and /sitemap.xml --><h1>Trading Post</h1><p>Welcome to the Trading Post. Check our <a href="/sitemap.xml">sitemap.xml</a> for our public directory index.</p>`))

// Room: recon — the "hidden" path from robots.txt
app.get('/keep-backup', (_req, res) =>
  res.type('text/plain').send(`internal backup index\n(nothing sensitive here except this) ${reward('recon')}\n`))

// Room: devtools — the token rides in a response HEADER, invisible on the page
app.get('/account', (_req, res) => {
  res.set('X-Keep-Token', Buffer.from(reward('devtools')).toString('base64'))
  res.type('text/plain').send('Account OK. Your session token is returned in the response headers, not the page body. (DevTools → Network, or curl -i)')
})

// Room: headers — the admin panel only answers if you SEND the right header
app.get('/admin-panel', (req, res) => {
  if ((req.headers['x-keep-role'] || '') === 'admin')
    return res.type('text/plain').send(`admin panel unlocked. ${reward('headers')}`)
  res.status(403).type('text/plain').send("forbidden: this panel trusts a client-supplied signal this application shouldn't trust. Inspect how your request is evaluated.")
})

// Room 3 — cookie tampering: server trusts the role cookie (VULN)
app.get('/vault', (req, res) => {
  // VULN: cookie-tamper — trusts client-set role
  if (req.cookies.role === 'admin') return res.send(`Welcome, warden. ${reward('cookie-trust')}`)
  res.status(403).send('Members only.')
})

// Room 4 — price tampering: trusts client price (VULN)
app.post('/checkout', (req, res) => {
  // VULN: client-trust — price comes from the request
  const price = Number(req.body.price)
  if (price <= 0) return res.send(`Free order accepted. ${reward('client-trust')}`)
  res.send(`Charged ${price}.`)
})

// Room 5 — IDOR: no ownership check (VULN)
app.get('/order', (req, res) => {
  // VULN: idor — any id readable
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  res.send(`Order ${row.id}: ${row.item} — ${row.secret}`)
})

// Room 7/8 — SQL injection: string-concatenated query (VULN)
app.post('/portal-8f2c/login', (req, res) => {
  const { username, password } = req.body
  // VULN: sqli — concatenated query
  const q = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
  try {
    const row = db.prepare(q).get()
    if (row) return res.send(`Logged in as ${row.username}. ${reward('sqli')}`)
    res.status(401).send('Bad credentials')
  } catch (e) { res.status(500).send('Query error: ' + e.message) }
})

// Room 9 — reflected XSS: unescaped reflection (VULN)
app.get('/search', (req, res) => {
  // VULN: xss — reflects input unescaped
  const q = req.query.q || ''
  res.cookie('keep_nonce', NONCE, { path: '/', sameSite: 'lax', httpOnly: false })
  res.send(`<h1>Results for ${q}</h1>
<p>No products matched. (reflected search)</p>`)
})

// Stored XSS — guestbook renders comments unescaped (VULN)
app.get('/guestbook', (_req, res) => {
  const items = guestbook.map((c) => `<li>${c}</li>`).join('\n')
  res.cookie('keep_nonce', NONCE, { path: '/', sameSite: 'lax', httpOnly: false })
  res.send(`<h1>Guestbook</h1>
<ul>${items}</ul>
<form method="POST" action="guestbook"><input name="comment"><button>Post</button></form>`)
})
app.post('/guestbook', (req, res) => {
  // VULN: stored-xss — comment stored and later rendered unescaped
  guestbook.push(String(req.body.comment || ''))
  res.redirect('guestbook')
})

// XSS callback: a payload that actually executed in the page reads document.cookie / keep_nonce
// and reports here. /xss-status then reveals that room's flag.
// TODO(breachkeep-fix): replace Sec-Fetch-Mode check with headless bot verification
app.get('/xss-report', (req, res) => {
  const room = String(req.query.r || '')
  const secFetchMode = req.headers['sec-fetch-mode']
  if (!secFetchMode || (secFetchMode !== 'cors' && secFetchMode !== 'no-cors')) {
    return res.status(403).type('text/plain').send('forbidden: script execution required (Sec-Fetch-Mode header missing or invalid)')
  }
  const nonce = req.query.nonce || req.cookies.keep_nonce
  if (nonce !== NONCE) return res.status(400).type('text/plain').send('missing/incorrect page nonce — this must run from the injected page')
  if (room === 'reflected-xss' || room === 'stored-xss') solved[room] = true
  res.type('text/plain').send('reported')
})
app.get('/xss-status', (req, res) => {
  const room = String(req.query.r || '')
  if (solved[room]) return res.type('text/plain').send(`solved. ${reward(room)}`)
  res.type('text/plain').send('not solved yet — land a payload that calls /xss-report from the page')
})

// Room: chain — recon (find /keep-admin) + cookie-trust (become admin)
app.get('/keep-admin/vault', (req, res) => {
  if (req.cookies.role === 'admin')
    return res.type('text/plain').send(`chained to the inner vault. ${reward('chain')}`)
  res.status(403).type('text/plain').send('forbidden: admin only (how did the vault room get in?)')
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`[trading-post] VULNERABLE app on :${PORT} room=${process.env.BK_ROOM || '(all)'}`))
export default app
