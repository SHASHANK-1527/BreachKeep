# Dungeon 5: Secure Coding — "The Forge" Challenge Documentation

In **The Forge**, the roles reverse: students act as defensive engineers ("Blue Team") tasked with fixing the exact vulnerabilities they previously exploited in the Trading Post web application.

Each challenge presents the student with an in-browser code editor loaded with [`/app/server.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/secure-coding/app/server.js). Clicking **Save & Run** sends the patched file to the container's grading service, which executes an automated test harness. The flag is awarded **only when the attack payload is successfully neutralized AND normal application functionality remains intact**.

---

## 1. Challenge Architecture & Dual-UID Grader Security

The Secure Coding dungeon features an automated, in-container unit test and grading framework ([`labs/secure-coding/app/grader.mjs`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/secure-coding/app/grader.mjs)):

```
       [ Student Browser Monaco Editor ]
                     |
       POST /app/<container_name>/save (JSON: { content: "..." })
                     |
                     v
   +---------------------------------------------------------------------------------+
   | Container: bk_<studentId>_<roomId>                                              |
   |                                                                                 |
   |  [ Grader Process: grader.mjs ]                                                 |
   |  - User: root (uid 0)                                                           |
   |  - Port: :8080                                                                  |
   |  - Holds: BK_FLAG in process memory                                             |
   |  - Action: Writes /app/server.js                                                |
   |  - Spawns test child via setpriv:                                               |
   |                                                                                 |
   |           +-----------------------------------------------------------+         |
   |           | [ Harness Child Process: node secure-harness.mjs ]         |         |
   |           | - User: runner (uid 1001, unprivileged)                   |         |
   |           | - Env:  BK_FLAG stripped, HARNESS=1                       |         |
   |           | - Runs: Supertest against newly patched server.js         |         |
   |           | - Returns: JSON test metrics & exit code (0 or 1)         |         |
   |           +-----------------------------------------------------------+         |
   |                                                                                 |
   |  - Evaluation: If exit code == 0, grader emits { pass: true, flag: BK_FLAG }    |
   +---------------------------------------------------------------------------------+
```

### 1.1 Anti-Cheating & Memory Isolation
In early iterations, the grader ran test code under the same user ID as the test runner. An adversarial student could submit code that read `/proc/<parent_pid>/environ` to extract `BK_FLAG` without fixing any vulnerabilities.
- **The Fix**: The grader runs as `root` and uses `setpriv --reuid runner --regid runner --clear-groups` to drop the test execution to an unprivileged user `runner`. Under Linux security semantics, an unprivileged user cannot inspect the memory or `/proc` pseudo-filesystem of a root process.
- **Dual-Verification Rule**: Every test checks two distinct criteria:
  1. `exploitBlocked`: The exploit payload that previously compromised the system must now fail.
  2. `stillWorks`: Legitimate requests must still succeed. (e.g., blocking all logins does not pass the SQLi challenge).

---

## 2. Challenge: `secure-sqli` (Parameterize the Login)

- **Tier**: Mandatory (Room I)
- **Flag Format**: `BK{pr3p4r3d_st4t3m3nts_w1n_<16_hex_hmac>}`
- **Test Metric**: `exploitBlocked` (POST `admin'--` fails with 401) + `stillWorks` (POST `admin` / `super-secret-pw` succeeds with 200).

### 2.1 Vulnerable Code ([`/app/server.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/secure-coding/app/server.js#L45-L53))
```javascript
app.post('/portal-8f2c/login', (req, res) => {
  const { username, password } = req.body
  const q = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
  try {
    const row = db.prepare(q).get()
    if (row) return res.send(`Logged in as ${row.username}.`)
    res.status(401).send('Bad credentials')
  } catch (e) { res.status(500).send('Query error: ' + e.message) }
})
```

### 2.2 Secure Remediation (Prepared Statement)
Replace string concatenation with parameterized SQL bindings:
```javascript
app.post('/portal-8f2c/login', (req, res) => {
  const { username, password } = req.body
  try {
    const row = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)
    if (row) return res.send(`Logged in as ${row.username}.`)
    res.status(401).send('Bad credentials')
  } catch (e) { res.status(500).send('Query error: ' + e.message) }
})
```

---

## 3. Challenge: `secure-xss` (Encode the Output)

- **Tier**: Mandatory (Room II)
- **Flag Format**: `BK{s4n1t1z3_y0ur_1nputs_<16_hex_hmac>}`
- **Test Metric**: `exploitBlocked` (`<script>x</script>` does NOT appear raw in response) + `stillWorks` (query for `widget` returns 200 and includes text `widget`).

### 3.1 Vulnerable Code ([`/app/server.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/secure-coding/app/server.js#L56-L59))
```javascript
app.get('/search', (req, res) => {
  const q = req.query.q || ''
  res.type('html').send(`<h1>Results for ${q}</h1><p>No products matched.</p>`)
})
```

### 3.2 Secure Remediation (HTML Entity Encoding)
Escape all HTML special characters (`&`, `<`, `>`, `"`, `'`) before reflecting input:
```javascript
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

app.get('/search', (req, res) => {
  const q = escapeHtml(req.query.q || '')
  res.type('html').send(`<h1>Results for ${q}</h1><p>No products matched.</p>`)
})
```

---

## 4. Challenge: `secure-idor` (Check Ownership)

- **Tier**: Mandatory (Room III)
- **Flag Format**: `BK{s3ss10n_b4s3d_4uth_<16_hex_hmac>}`
- **Test Metric**: `exploitBlocked` (GET `/order?id=1337` with `Cookie: uid=alice` returns 403 or 404) + `stillWorks` (GET `/order?id=1042` with `Cookie: uid=alice` returns 200).

### 4.1 Vulnerable Code ([`/app/server.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/secure-coding/app/server.js#L38-L42))
```javascript
app.get('/order', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  res.send(`Order ${row.id} (${row.owner}): ${row.item} — ${row.secret}`)
})
```

### 4.2 Secure Remediation (Object-Level Authorization Check)
Verify that the requesting user (`req.cookies.uid`) matches the order's owner (`row.owner`):
```javascript
app.get('/order', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  if (row.owner !== req.cookies.uid) {
    return res.status(403).send('Forbidden: you do not own this order')
  }
  res.send(`Order ${row.id} (${row.owner}): ${row.item} — ${row.secret}`)
})
```

---

## 5. Challenge: `secure-client` (Don’t Trust the Price)

- **Tier**: Mandatory (Room IV)
- **Flag Format**: `BK{s3rv3r_v4l1d4t10n_ru13s_<16_hex_hmac>}`
- **Test Metric**: `exploitBlocked` (POST `/checkout` with `price=0` is NOT accepted free) + `stillWorks` (POST with `price=10` returns 200 and charges price).

### 5.1 Vulnerable Code ([`/app/server.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/secure-coding/app/server.js#L31-L35))
```javascript
app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  if (price <= 0) return res.send('Free order accepted. total=0')
  res.send(`Charged ${price}.`)
})
```

### 5.2 Secure Remediation (Server-Side Price Validation)
Reject any non-positive or missing price values:
```javascript
app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  if (!price || price <= 0 || isNaN(price)) {
    return res.status(400).send('Invalid price parameter')
  }
  res.send(`Charged ${price}.`)
})
```

---

## 6. Challenge: `secure-headers` (Set the Guards)

- **Tier**: Medium (Room V)
- **Flag Format**: `BK{csp_str1ct_h34d3rs_<16_hex_hmac>}`
- **Test Metric**: `exploitBlocked` (`X-Content-Type-Options: nosniff` present AND `X-Frame-Options` present) + `stillWorks` (GET `/` returns 200).

### 6.1 Vulnerable Code
No global middleware setting protective HTTP headers.

### 6.2 Secure Remediation (Security Headers Middleware)
Add an Express middleware setting browser defense headers:
```javascript
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  next()
})
```

---

## 7. Challenge: `secure-rate-limit` (Slow the Brute Force)

- **Tier**: Medium (Room VI)
- **Flag Format**: `BK{t0k3n_buck3t_l1m1t_<16_hex_hmac>}`
- **Test Metric**: `exploitBlocked` (Receives HTTP 429 after 10 failed login attempts) + `stillWorks` (First login attempt does NOT return 429).

### 7.1 Vulnerable Code
Login route processes unlimited sequential requests with zero throttling.

### 7.2 Secure Remediation (Windowed IP Throttling)
Implement a time-windowed IP request tracker (e.g. resetting counts every 60 seconds) to prevent permanent lockout:
```javascript
const loginAttempts = new Map() // ip -> { count, expiresAt }
const WINDOW_MS = 60 * 1000

app.post('/portal-8f2c/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'client'
  const now = Date.now()
  const entry = loginAttempts.get(ip) || { count: 0, expiresAt: now + WINDOW_MS }

  if (now > entry.expiresAt) {
    entry.count = 0
    entry.expiresAt = now + WINDOW_MS
  }

  entry.count++
  loginAttempts.set(ip, entry)

  if (entry.count > 10) {
    return res.status(429).send('Too many login attempts. Please try again later.')
  }

  const { username, password } = req.body
  // ... rest of login handler
```

---

## 8. Challenge: `secure-hide-secret` (Un-hardcode the Secret)

- **Tier**: Medium (Room VII)
- **Flag Format**: `BK{k33p_3nv_s3cr3t_<16_hex_hmac>}`
- **Test Metric**: `exploitBlocked` (GET `/config` does NOT expose `'sk-hardcoded-9f83a1'`) + `stillWorks` (GET `/config` returns status 200).

### 8.1 Vulnerable Code ([`/app/server.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/secure-coding/app/server.js#L19-L22))
```javascript
const API_KEY = 'sk-hardcoded-9f83a1'
app.get('/config', (_req, res) => {
  res.type('text/plain').send(`service=keepd\napi_key=${API_KEY}\nmode=prod\n`)
})
```

### 8.2 Secure Remediation (Decoupling & Sanitizing Endpoint)
Read sensitive keys from `process.env` and sanitize public configuration endpoints:
```javascript
const API_KEY = process.env.API_KEY || ''
app.get('/config', (_req, res) => {
  res.type('text/plain').send('service=keepd\nmode=prod\n')
})
```

---

## 9. Challenge: `secure-full-review` (Full Review)

- **Tier**: Hard (Room VIII)
- **Flag Format**: `BK{c0d3_4ud1t_ch4mp10n_<16_hex_hmac>}`
- **Test Metric**: All four primary vulnerabilities (`sqli`, `xss`, `idor`, `client`) must pass their unit tests simultaneously in a single code submission.

### 9.1 The Challenge
The student is given the raw, unpatched `server.js` and must correctly remediate all four vulnerabilities in one deployment without breaking normal features.

### 9.2 Complete Hardened Reference Implementation
```javascript
import express from 'express'
import cookieParser from 'cookie-parser'
import { makeDb } from './seed.js'

const db = makeDb()
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

// Helper: Context-aware HTML entity encoding
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

app.get('/', (_req, res) => res.type('html').send('<h1>Trading Post</h1>'))
app.get('/robots.txt', (_req, res) => res.type('text/plain').send('User-agent: *\nDisallow: /portal-8f2c/'))

// FIX 1: Price Tampering (Client Trust)
app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  if (!price || price <= 0 || isNaN(price)) {
    return res.status(400).send('Invalid price parameter')
  }
  res.send(`Charged ${price}.`)
})

// FIX 2: Insecure Direct Object Reference (IDOR)
app.get('/order', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  if (row.owner !== req.cookies.uid) {
    return res.status(403).send('Forbidden: you do not own this order')
  }
  res.send(`Order ${row.id} (${row.owner}): ${row.item} — ${row.secret}`)
})

// FIX 3: SQL Injection (Prepared Statements)
app.post('/portal-8f2c/login', (req, res) => {
  const { username, password } = req.body
  try {
    const row = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)
    if (row) return res.send(`Logged in as ${row.username}.`)
    res.status(401).send('Bad credentials')
  } catch (e) {
    res.status(500).send('Query error: ' + e.message)
  }
})

// FIX 4: Reflected Cross-Site Scripting (Output Encoding)
app.get('/search', (req, res) => {
  const q = escapeHtml(req.query.q || '')
  res.type('html').send(`<h1>Results for ${q}</h1><p>No products matched.</p>`)
})

const PORT = process.env.PORT || 8080
if (!process.env.HARNESS) app.listen(PORT, () => console.log(`[trading-post] on :${PORT}`))
export default app
```
Saving and running this file executes the entire test suite in `secure-harness.mjs`, outputting:
```json
{
  "room": "full-review",
  "parts": [
    { "name": "sqli", "exploitBlocked": true, "stillWorks": true, "pass": true },
    { "name": "xss", "exploitBlocked": true, "stillWorks": true, "pass": true },
    { "name": "idor", "exploitBlocked": true, "stillWorks": true, "pass": true },
    { "name": "client", "exploitBlocked": true, "stillWorks": true, "pass": true }
  ],
  "pass": true
}
```
The grader releases `BK{c0d3_4ud1t_ch4mp10n_<16_hex_hmac>}`.
