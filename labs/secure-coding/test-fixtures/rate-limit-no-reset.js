// ⚠️ DELIBERATELY VULNERABLE — this is the code the student FIXES in the
// Secure Coding dungeon. Each room's grader reruns one exploit + a functional
// test against this file; the room clears when the exploit fails and the app
// still works. Vulnerabilities are tagged // VULN: <room>.
import express from 'express'
import cookieParser from 'cookie-parser'
import { makeDb } from '../app/seed.js'

const db = makeDb()
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/', (_req, res) => res.type('html').send('<h1>Trading Post</h1>'))
app.get('/robots.txt', (_req, res) => res.type('text/plain').send('User-agent: *\nDisallow: /portal-8f2c/'))

// VULN: hide-secret — a hardcoded credential, exposed by an endpoint
const API_KEY = 'sk-hardcoded-9f83a1'
app.get('/config', (_req, res) => {
  res.type('text/plain').send(`service=keepd\napi_key=${API_KEY}\nmode=prod\n`)
})

// VULN: cookie-tamper (not graded here) — trusts client-set role
app.get('/vault', (req, res) => {
  if (req.cookies.role === 'admin') return res.send('Welcome, warden.')
  res.status(403).send('Members only.')
})

// VULN: client-trust — price comes from the request and <=0 is accepted free
app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  if (price <= 0) return res.send('Free order accepted. total=0')
  res.send(`Charged ${price}.`)
})

// VULN: idor — no ownership check; any order id is readable
app.get('/order', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  res.send(`Order ${row.id} (${row.owner}): ${row.item} — ${row.secret}`)
})

// VULN: sqli — string-concatenated query
let failedAttempts = 0
app.post('/portal-8f2c/login', (req, res) => {
  failedAttempts++
  if (failedAttempts > 10) return res.status(429).send('Too many login attempts.')
  const { username, password } = req.body
  const q = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
  try {
    const row = db.prepare(q).get()
    if (row) return res.send(`Logged in as ${row.username}.`)
    res.status(401).send('Bad credentials')
  } catch (e) { res.status(500).send('Query error: ' + e.message) }
})

// VULN: xss — reflects input unescaped
app.get('/search', (req, res) => {
  const q = req.query.q || ''
  res.type('html').send(`<h1>Results for ${q}</h1><p>No products matched.</p>`)
})

// The grader imports this app with HARNESS=1 so it does NOT bind a port.
const PORT = process.env.PORT || 8080
if (!process.env.HARNESS) app.listen(PORT, () => console.log(`[trading-post] on :${PORT}`))
export default app
