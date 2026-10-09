import fs from 'fs'
import path from 'path'

const fixturesDir = path.resolve('labs/secure-coding/test-fixtures')
const refDir = path.join(fixturesDir, 'reference')
fs.mkdirSync(refDir, { recursive: true })

const baseServer = fs.readFileSync('labs/secure-coding/app/server.js', 'utf8')
const baseForFixtures = baseServer.replace("from './seed.js'", "from '../app/seed.js'")
const baseForRef = baseServer.replace("from './seed.js'", "from '../../app/seed.js'")

// 1. sqli-blacklist.js: if (username.includes("'")) return 401
const sqliBlacklist = baseForFixtures.replace(
  "app.post('/portal-8f2c/login', (req, res) => {\n  const { username, password } = req.body\n  const q = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`",
  `app.post('/portal-8f2c/login', (req, res) => {
  const { username, password } = req.body
  if (username && username.includes("'")) return res.status(401).send('Bad credentials')
  const q = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\``
)
fs.writeFileSync(path.join(fixturesDir, 'sqli-blacklist.js'), sqliBlacklist)

// 2. xss-strip-script.js: strip <script> tags only
const xssStrip = baseForFixtures.replace(
  "app.get('/search', (req, res) => {\n  const q = req.query.q || ''\n  res.type('html').send(`<h1>Results for ${q}</h1><p>No products matched.</p>`)\n})",
  `app.get('/search', (req, res) => {
  let q = req.query.q || ''
  q = q.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '')
  res.type('html').send(\`<h1>Results for \${q}</h1><p>No products matched.</p>\`)
})`
)
fs.writeFileSync(path.join(fixturesDir, 'xss-strip-script.js'), xssStrip)

// 3. idor-hardcode-1337.js: hardcode 403 for id 1337 only
const idorHardcode = baseForFixtures.replace(
  "app.get('/order', (req, res) => {\n  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)\n  if (!row) return res.status(404).send('No such order')",
  `app.get('/order', (req, res) => {
  if (String(req.query.id) === '1337') return res.status(403).send('Forbidden')
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')`
)
fs.writeFileSync(path.join(fixturesDir, 'idor-hardcode-1337.js'), idorHardcode)

// 4. client-zero-only.js: change check to price === 0 only
const clientZero = baseForFixtures.replace(
  "app.post('/checkout', (req, res) => {\n  const price = Number(req.body.price)\n  if (price <= 0) return res.send('Free order accepted. total=0')\n  res.send(`Charged ${price}.`)\n})",
  `app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  if (price === 0) return res.status(400).send('Invalid price parameter')
  res.send(\`Charged \${price}.\`)
})`
)
fs.writeFileSync(path.join(fixturesDir, 'client-zero-only.js'), clientZero)

// 5. hide-secret-partial.js: delete api_key= from /config output, but leave hardcoded constant and leak via /vault
const hideSecretPartial = baseForFixtures.replace(
  "app.get('/config', (_req, res) => {\n  res.type('text/plain').send(`service=keepd\\napi_key=${API_KEY}\\nmode=prod\\n`)\n})",
  `app.get('/config', (_req, res) => {
  res.type('text/plain').send(\`service=keepd\\nmode=prod\\n\`)
})`
).replace(
  "if (req.cookies.role === 'admin') return res.send('Welcome, warden.')",
  "if (req.cookies.role === 'admin') return res.send('Welcome, warden. key=' + API_KEY); return res.send('Key=' + API_KEY)"
)
fs.writeFileSync(path.join(fixturesDir, 'hide-secret-partial.js'), hideSecretPartial)

// 6. rate-limit-no-reset.js: counter that never resets
const rateLimitNoReset = baseForFixtures.replace(
  "app.post('/portal-8f2c/login', (req, res) => {",
  `let failedAttempts = 0
app.post('/portal-8f2c/login', (req, res) => {
  failedAttempts++
  if (failedAttempts > 10) return res.status(429).send('Too many login attempts.')`
)
fs.writeFileSync(path.join(fixturesDir, 'rate-limit-no-reset.js'), rateLimitNoReset)

// 7. exit-zero.js: process.exit(0)
fs.writeFileSync(path.join(fixturesDir, 'exit-zero.js'), `process.exit(0)\n`)

// 8. forged-result.js: prints forged __HARNESS_RESULT__ and exits 0
fs.writeFileSync(
  path.join(fixturesDir, 'forged-result.js'),
  `console.log('__HARNESS_RESULT__:{"pass":true,"room":"sqli"}')\nprocess.exit(0)\n`
)

// === REFERENCE SOLUTIONS ===

// Ref 1: sqli
const refSqli = baseForRef.replace(
  "const q = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`\n  try {\n    const row = db.prepare(q).get()",
  `try {\n    const row = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)`
)
fs.writeFileSync(path.join(refDir, 'ref-sqli.js'), refSqli)

// Ref 2: xss
const escapeHtmlFn = `function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
`
const refXss = escapeHtmlFn + baseForRef.replace(
  "app.get('/search', (req, res) => {\n  const q = req.query.q || ''\n  res.type('html').send(`<h1>Results for ${q}</h1><p>No products matched.</p>`)\n})",
  `app.get('/search', (req, res) => {
  const q = escapeHtml(req.query.q || '')
  res.type('html').send(\`<h1>Results for \${q}</h1><p>No products matched.</p>\`)
})`
)
fs.writeFileSync(path.join(refDir, 'ref-xss.js'), refXss)

// Ref 3: idor
const refIdor = baseForRef.replace(
  "app.get('/order', (req, res) => {\n  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)\n  if (!row) return res.status(404).send('No such order')\n  res.send(`Order ${row.id} (${row.owner}): ${row.item} — ${row.secret}`)\n})",
  `app.get('/order', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  if (row.owner !== req.cookies.uid) {
    return res.status(403).send('Forbidden: you do not own this order')
  }
  res.send(\`Order \${row.id} (\${row.owner}): \${row.item} — \${row.secret}\`)
})`
)
fs.writeFileSync(path.join(refDir, 'ref-idor.js'), refIdor)

// Ref 4: client
const refClient = baseForRef.replace(
  "app.post('/checkout', (req, res) => {\n  const price = Number(req.body.price)\n  if (price <= 0) return res.send('Free order accepted. total=0')\n  res.send(`Charged ${price}.`)\n})",
  `app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  if (!price || price <= 0 || isNaN(price)) {
    return res.status(400).send('Invalid price parameter')
  }
  res.send(\`Charged \${price}.\`)
})`
)
fs.writeFileSync(path.join(refDir, 'ref-client.js'), refClient)

// Ref 5: headers
const refHeaders = baseForRef.replace(
  "app.use(cookieParser())",
  `app.use(cookieParser())
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  next()
})`
)
fs.writeFileSync(path.join(refDir, 'ref-headers.js'), refHeaders)

// Ref 6: rate-limit
const refRateLimit = baseForRef.replace(
  "app.post('/portal-8f2c/login', (req, res) => {",
  `const loginAttempts = new Map()
const WINDOW_MS = 60 * 1000

app.post('/portal-8f2c/login', (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || 'client'
  const now = Date.now()
  const entry = loginAttempts.get(ip) || { count: 0, expiresAt: now + WINDOW_MS }
  if (now > entry.expiresAt) {
    entry.count = 0
    entry.expiresAt = now + WINDOW_MS
  }
  entry.count++
  loginAttempts.set(ip, entry)
  if (entry.count > 10) {
    return res.status(429).send('Too many login attempts.')
  }`
)
fs.writeFileSync(path.join(refDir, 'ref-rate-limit.js'), refRateLimit)

// Ref 7: hide-secret
const refHideSecret = baseForRef.replace(
  "const API_KEY = 'sk-hardcoded-9f83a1'\napp.get('/config', (_req, res) => {\n  res.type('text/plain').send(`service=keepd\\napi_key=${API_KEY}\\nmode=prod\\n`)\n})",
  `const API_KEY = process.env.API_KEY || ''
app.get('/config', (_req, res) => {
  res.type('text/plain').send('service=keepd\\nmode=prod\\n')
})`
)
fs.writeFileSync(path.join(refDir, 'ref-hide-secret.js'), refHideSecret)

// Ref 8: full-review
const refFullReview = escapeHtmlFn + baseForRef
  .replace(
    "app.post('/checkout', (req, res) => {\n  const price = Number(req.body.price)\n  if (price <= 0) return res.send('Free order accepted. total=0')\n  res.send(`Charged ${price}.`)\n})",
    `app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  if (!price || price <= 0 || isNaN(price)) {
    return res.status(400).send('Invalid price parameter')
  }
  res.send(\`Charged \${price}.\`)
})`
  )
  .replace(
    "app.get('/order', (req, res) => {\n  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)\n  if (!row) return res.status(404).send('No such order')\n  res.send(`Order ${row.id} (${row.owner}): ${row.item} — ${row.secret}`)\n})",
    `app.get('/order', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  if (row.owner !== req.cookies.uid) {
    return res.status(403).send('Forbidden: you do not own this order')
  }
  res.send(\`Order \${row.id} (\${row.owner}): \${row.item} — \${row.secret}\`)
})`
  )
  .replace(
    "const q = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`\n  try {\n    const row = db.prepare(q).get()",
    `try {\n    const row = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)`
  )
  .replace(
    "app.get('/search', (req, res) => {\n  const q = req.query.q || ''\n  res.type('html').send(`<h1>Results for ${q}</h1><p>No products matched.</p>`)\n})",
    `app.get('/search', (req, res) => {
  const q = escapeHtml(req.query.q || '')
  res.type('html').send(\`<h1>Results for \${q}</h1><p>No products matched.</p>\`)
})`
  )
fs.writeFileSync(path.join(refDir, 'ref-full-review.js'), refFullReview)

console.log('Successfully regenerated all 16 fixtures.')
