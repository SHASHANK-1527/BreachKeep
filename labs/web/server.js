// ⚠️ DELIBERATELY VULNERABLE. Web Dungeon target + Secure Coding subject.
// Each vulnerability is tagged // VULN: <room>. The Secure Coding harness reruns
// these exploits; a fix passes when the exploit fails and the app still works.
import express from 'express'
import cookieParser from 'cookie-parser'
import { makeDb } from './seed.js'

const db = makeDb()
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

const FLAG = process.env.BK_FLAG || 'BK{dev-web}'

// Room 1 — view source / robots
app.get('/robots.txt', (_req, res) => res.type('text/plain').send('User-agent: *\nDisallow: /portal-8f2c/'))
app.get('/', (_req, res) => res.send(`<!-- hint: try /robots.txt --><h1>Trading Post</h1>`))

// Room 3 — cookie tampering: server trusts the role cookie (VULN)
app.get('/vault', (req, res) => {
  // VULN: cookie-tamper — trusts client-set role
  if (req.cookies.role === 'admin') return res.send(`Welcome, warden. ${FLAG}`)
  res.status(403).send('Members only. (role cookie = user)')
})

// Room 4 — price tampering: trusts client price (VULN)
app.post('/checkout', (req, res) => {
  // VULN: client-trust — price comes from the request
  const price = Number(req.body.price)
  if (price <= 0) return res.send(`Free order accepted. ${FLAG}`)
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
    if (row) return res.send(`Logged in as ${row.username}. ${FLAG}`)
    res.status(401).send('Bad credentials')
  } catch (e) { res.status(500).send('Query error: ' + e.message) }
})

// Room 9 — reflected XSS: unescaped reflection (VULN)
app.get('/search', (req, res) => {
  // VULN: xss — reflects input unescaped
  res.send(`<h1>Results for ${req.query.q || ''}</h1>`)
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`[trading-post] VULNERABLE app on :${PORT}`))
export default app
