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
const guestbook = [
  'Welcome to the Citadel Trading Post! Reliable provisions for all cadets. — Quartermaster',
  'Watch your coin pouches around the lower bailey. — Scout Dylan'
]

// HTML Page Wrapper with medieval / cyber theme
function page(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | The Citadel Trading Post</title>
  <!-- hint: check /robots.txt and /sitemap.xml -->
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0e17;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    a { color: #f59e0b; text-decoration: none; transition: color 0.2s; }
    a:hover { color: #fbbf24; text-decoration: underline; }
    
    .tp-navbar {
      background: #111827;
      border-bottom: 1px solid #1f2937;
      padding: 0.85rem 1.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .tp-brand {
      font-size: 1.25rem;
      font-weight: 700;
      color: #f59e0b;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }
    .tp-nav-links {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1.25rem;
      font-size: 0.95rem;
      font-weight: 500;
    }
    .tp-search-form { display: flex; gap: 0.4rem; }
    .tp-input {
      background: #0a0e17;
      border: 1px solid #374151;
      color: #f3f4f6;
      padding: 0.45rem 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .tp-input:focus { outline: none; border-color: #f59e0b; }
    .tp-btn {
      background: #f59e0b;
      color: #0a0e17;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: inline-block;
      text-align: center;
      transition: background 0.2s;
    }
    .tp-btn:hover { background: #fbbf24; text-decoration: none; }
    .tp-btn-secondary {
      background: #1f2937;
      color: #e5e7eb;
      border: 1px solid #374151;
    }
    .tp-btn-secondary:hover { background: #374151; color: #fff; }

    .tp-container {
      max-width: 960px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      flex: 1;
      width: 100%;
    }
    .tp-hero {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
      text-align: center;
    }
    .tp-hero h1 { color: #f59e0b; font-size: 2.1rem; margin-bottom: 0.5rem; }
    .tp-hero p { color: #94a3b8; font-size: 1.1rem; }

    .tp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    .tp-card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .tp-card.featured {
      border-color: #f59e0b;
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);
    }
    .tp-card h3 { color: #f3f4f6; font-size: 1.2rem; margin-bottom: 0.5rem; }
    .tp-price { font-size: 1.35rem; font-weight: 700; color: #f59e0b; margin: 0.75rem 0; }
    .tp-badge {
      display: inline-block;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: #1f2937;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }
    .tp-badge.legendary {
      background: rgba(245, 158, 11, 0.18);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }

    .tp-alert {
      padding: 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }
    .tp-alert-success { background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #6ee7b7; }
    .tp-alert-danger { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; }
    .tp-alert-info { background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; color: #93c5fd; }

    .tp-form-group { margin-bottom: 1rem; }
    .tp-form-group label { display: block; font-size: 0.9rem; margin-bottom: 0.35rem; color: #94a3b8; }

    .tp-footer {
      background: #111827;
      border-top: 1px solid #1f2937;
      padding: 1.5rem;
      text-align: center;
      font-size: 0.85rem;
      color: #64748b;
      margin-top: auto;
    }
    .tp-footer a { color: #94a3b8; margin: 0 0.5rem; }
  </style>
</head>
<body>
  <nav class="tp-navbar">
    <a href="/" class="tp-brand">⚔️ The Trading Post</a>
    <div class="tp-nav-links">
      <a href="/">🏪 Catalog</a>
      <a href="/account">👤 Account</a>
      <a href="/vault">🏛️ Vault</a>
      <a href="/orders">📦 Order Lookup</a>
      <a href="/guestbook">📜 Guestbook</a>
      <a href="/portal-8f2c/login">🔐 Portal</a>
    </div>
    <form action="/search" method="GET" class="tp-search-form">
      <input type="text" name="q" class="tp-input" placeholder="Search catalog..." />
      <button type="submit" class="tp-btn">Search</button>
    </form>
  </nav>

  <main class="tp-container">
    ${bodyContent}
  </main>

  <footer class="tp-footer">
    <p>Citadel Trading Post v2.4 &middot; Port 8080</p>
    <p style="margin-top: 0.5rem;">
      <a href="/sitemap.xml">Sitemap (XML)</a> &bull;
      <a href="/robots.txt">Robots.txt</a> &bull;
      <a href="/account">Account Headers</a> &bull;
      <a href="/orders">Orders</a>
    </p>
  </footer>
</body>
</html>`
}

// Room 1 — recon: robots and sitemap disclose site navigation structure
app.get('/robots.txt', (_req, res) =>
  res.type('text/plain').send('User-agent: *\nDisallow: /portal-8f2c/\nDisallow: /keep-backup/\nDisallow: /keep-admin/\n\nSitemap: /sitemap.xml\n'))

app.get('/sitemap.xml', (_req, res) =>
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc></url>
  <url><loc>/account</loc></url>
  <url><loc>/vault</loc></url>
  <url><loc>/orders</loc></url>
  <url><loc>/search</loc></url>
  <url><loc>/guestbook</loc></url>
</urlset>`))

// Room: recon — the storefront catalog (Room 4 checkout source + Room 1 discovery anchor)
app.get('/', (_req, res) => {
  const content = `
    <div class="tp-hero">
      <h1>The Citadel Trading Post</h1>
      <p>Provisions, armaments, and enchanted relics for Keep recruits &amp; travelers.</p>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2>Current Inventory</h2>
      <span style="font-size: 0.9rem; color: #94a3b8;">Cadet Purse Balance: <strong style="color: #f59e0b;">0 Gold</strong></span>
    </div>

    <div class="tp-grid">
      <div class="tp-card">
        <div>
          <span class="tp-badge">Common Item</span>
          <h3>Iron Dagger</h3>
          <p style="color: #94a3b8; font-size: 0.9rem;">A standard recruit blade forged in the lower Citadel bailey.</p>
          <div class="tp-price">15 Gold</div>
        </div>
        <form method="POST" action="/checkout">
          <input type="hidden" name="item" value="Iron Dagger">
          <input type="hidden" name="price" value="15">
          <button type="submit" class="tp-btn tp-btn-secondary" style="width: 100%;">Purchase (15g)</button>
        </form>
      </div>

      <div class="tp-card">
        <div>
          <span class="tp-badge">Apparel</span>
          <h3>Castle Cloak</h3>
          <p style="color: #94a3b8; font-size: 0.9rem;">Heavy wool cloak to shield against the freezing mountain winds.</p>
          <div class="tp-price">50 Gold</div>
        </div>
        <form method="POST" action="/checkout">
          <input type="hidden" name="item" value="Castle Cloak">
          <input type="hidden" name="price" value="50">
          <button type="submit" class="tp-btn tp-btn-secondary" style="width: 100%;">Purchase (50g)</button>
        </form>
      </div>

      <div class="tp-card">
        <div>
          <span class="tp-badge">Armor</span>
          <h3>Warden's Steel Shield</h3>
          <p style="color: #94a3b8; font-size: 0.9rem;">Reinforced steel kite shield bearing the Citadel crest.</p>
          <div class="tp-price">150 Gold</div>
        </div>
        <form method="POST" action="/checkout">
          <input type="hidden" name="item" value="Warden's Steel Shield">
          <input type="hidden" name="price" value="150">
          <button type="submit" class="tp-btn tp-btn-secondary" style="width: 100%;">Purchase (150g)</button>
        </form>
      </div>

      <div class="tp-card featured">
        <div>
          <span class="tp-badge legendary">Legendary Relic</span>
          <h3>Grand Citadel Flag Key</h3>
          <p style="color: #94a3b8; font-size: 0.9rem;">An ancient cipher key rumored to unlock the Citadel's classified chambers.</p>
          <div class="tp-price">9,999 Gold</div>
        </div>
        <form method="POST" action="/checkout">
          <input type="hidden" name="item" value="Grand Citadel Flag Key">
          <input type="hidden" name="price" value="9999">
          <button type="submit" class="tp-btn" style="width: 100%;">Purchase (9999g)</button>
        </form>
      </div>
    </div>
  `
  res.type('html').send(page('Catalog', content))
})

// Room: recon — the "hidden" path from robots.txt
app.get(['/keep-backup', '/keep-backup/'], (_req, res) => {
  const flag = reward('recon')
  if (_req.accepts('html')) {
    const content = `
      <div class="tp-card" style="max-width: 600px; margin: 0 auto;">
        <h2>📂 Internal Server Backup Archive</h2>
        <p style="color: #94a3b8; margin: 0.5rem 0 1rem;">
          Directory discovered via crawler indexing policies (<code>robots.txt</code>).
        </p>
        <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.95rem; border: 1px solid #1f2937; margin: 1rem 0;">
          <p style="color: #64748b;"># Citadel Internal Backup Manifest</p>
          <p style="color: #cbd5e1; margin-top: 0.5rem;">index.html &middot; database.sqlite.bak &middot; secrets.env</p>
          <p style="color: #f59e0b; margin-top: 0.75rem; font-weight: bold;">${flag}</p>
        </div>
        <p><a href="/" class="tp-btn tp-btn-secondary">Return to Catalog</a></p>
      </div>
    `
    return res.type('html').send(page('Backup Index', content))
  }
  res.type('text/plain').send(`internal backup index\n(nothing sensitive here except this) ${flag}\n`)
})

// Room: devtools — the token rides in a response HEADER, invisible on the page
app.get('/account', (req, res) => {
  const token = Buffer.from(reward('devtools')).toString('base64')
  res.set('X-Keep-Token', token)
  
  if (req.accepts('html')) {
    const content = `
      <div class="tp-card" style="max-width: 600px; margin: 0 auto;">
        <h2>👤 Cadet Session Profile</h2>
        <p style="color: #94a3b8; margin: 0.5rem 0 1.5rem;">Cadet Account &middot; Active Session Verified</p>
        
        <div class="tp-alert tp-alert-info">
          <strong>Security Protocol:</strong>
          <p style="margin-top: 0.25rem;">
            To prevent client DOM scraping, this portal exchanges authentication tokens exclusively via HTTP response headers (<code>X-Keep-Token</code>) rather than embedding them inside page HTML.
          </p>
        </div>

        <div style="background: #0a0e17; padding: 1.25rem; border-radius: 6px; border: 1px solid #1f2937; margin: 1rem 0;">
          <p style="font-size: 0.9rem; color: #f59e0b; font-weight: 600;">
            🔍 How to view your token header:
          </p>
          <ol style="margin-left: 1.5rem; margin-top: 0.5rem; font-size: 0.9rem; color: #cbd5e1;">
            <li>Press <strong>F12</strong> to open your browser Developer Tools.</li>
            <li>Select the <strong>Network</strong> tab and refresh this page.</li>
            <li>Click on the <code>account</code> request entry in the list.</li>
            <li>Inspect the <strong>Headers</strong> panel to locate <code>X-Keep-Token</code>.</li>
            <li>Decode the Base64 value to retrieve your key!</li>
          </ol>
        </div>

        <p><a href="/" class="tp-btn tp-btn-secondary">Return to Catalog</a></p>
      </div>
    `
    return res.type('html').send(page('Account Profile', content))
  }
  res.type('text/plain').send('Account OK. Your session token is returned in the response headers, not the page body. (DevTools → Network, or curl -i)')
})

// Room: headers — the admin panel only answers if you SEND the right header
app.get('/admin-panel', (req, res) => {
  const roleHeader = req.headers['x-keep-role'] || ''
  if (roleHeader === 'admin') {
    const flag = reward('headers')
    if (req.accepts('html')) {
      const content = `
        <div class="tp-alert tp-alert-success" style="max-width: 600px; margin: 0 auto; text-align: center;">
          <h2>🛡️ Gateway Administrative Gateway Unlocked</h2>
          <p style="margin: 0.5rem 0;">Upstream proxy header verified: <code>X-Keep-Role: admin</code>.</p>
          <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; margin: 1.25rem 0; font-family: monospace; font-size: 1.2rem; color: #f59e0b; border: 1px dashed #f59e0b;">
            ${flag}
          </div>
          <p><a href="/" class="tp-btn">Return to Store</a></p>
        </div>
      `
      return res.type('html').send(page('Admin Panel Unlocked', content))
    }
    return res.type('text/plain').send(`admin panel unlocked. ${flag}`)
  }

  if (req.accepts('html')) {
    const content = `
      <div class="tp-alert tp-alert-danger" style="max-width: 600px; margin: 0 auto; text-align: center;">
        <h2>⛔ 403 Forbidden: Internal Gateway Rejection</h2>
        <p style="margin: 0.5rem 0;">Direct access to <code>/admin-panel</code> is restricted to Citadel Gateway proxies.</p>
        <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; margin: 1rem 0; text-align: left; font-size: 0.9rem; border: 1px solid #1f2937;">
          <p style="color: #94a3b8;"><strong>Gateway Diagnostic Log:</strong></p>
          <p style="font-family: monospace; color: #f87171; margin-top: 0.25rem;">
            Header 'X-Keep-Role' evaluated to: <em>${roleHeader || '(missing)'}</em><br/>
            Required role privilege: <em>admin</em>
          </p>
        </div>
        <p style="font-size: 0.85rem; color: #94a3b8; text-align: left;">
          💡 <em>Observation Tip:</em> The server trusts the client-supplied request header <code>X-Keep-Role</code>. Browsers don't send custom headers automatically, but you can send it using <code>curl -H "X-Keep-Role: admin" ...</code> or DevTools console <code>fetch('/admin-panel', {headers: {'X-Keep-Role': 'admin'}})...</code>!
        </p>
        <p style="margin-top: 1rem;"><a href="/" class="tp-btn tp-btn-secondary">Return to Catalog</a></p>
      </div>
    `
    return res.status(403).type('html').send(page('Admin Panel - Access Denied', content))
  }
  res.status(403).type('text/plain').send("forbidden: Citadel Gateway error — Header 'X-Keep-Role' was not set to 'admin'.")
})

// Room 3 — cookie tampering: server trusts the role cookie (VULN)
app.get('/vault', (req, res) => {
  if (req.cookies.role === 'admin') {
    const flag = reward('cookie-trust')
    if (req.accepts('html')) {
      const content = `
        <div class="tp-alert tp-alert-success" style="max-width: 600px; margin: 0 auto; text-align: center;">
          <h2>🏛️ Citadel Vault Unlocked</h2>
          <p style="margin: 0.5rem 0;">Welcome, Warden. Authorization verified: <code>role=admin</code>.</p>
          <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; margin: 1.25rem 0; font-family: monospace; font-size: 1.2rem; color: #f59e0b; border: 1px dashed #f59e0b;">
            ${flag}
          </div>
          <p><a href="/" class="tp-btn">Return to Store</a></p>
        </div>
      `
      return res.type('html').send(page('Vault Unlocked', content))
    }
    return res.send(`Welcome, warden. ${flag}`)
  }

  // Set default role cookie if not yet defined
  if (!req.cookies.role) {
    res.cookie('role', 'guest', { path: '/' })
  }

  if (req.accepts('html')) {
    const currentRole = req.cookies.role || 'guest'
    const content = `
      <div class="tp-alert tp-alert-danger" style="max-width: 600px; margin: 0 auto; text-align: center;">
        <h2>⛔ Vault Access Denied</h2>
        <p style="margin: 0.5rem 0;">Members and Wardens only. Your current role is: <code>role=${currentRole}</code>.</p>
        <p style="color: #fca5a5; font-size: 0.9rem; margin-top: 0.5rem;">
          The server checks the client-side <code>role</code> cookie to make authorization decisions.
        </p>
        <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; margin: 1.25rem 0; text-align: left; font-size: 0.85rem; color: #94a3b8; border: 1px solid #1f2937;">
          💡 <em>Audit Tip:</em> Open DevTools &rarr; <strong>Application / Storage</strong> &rarr; <strong>Cookies</strong> (or run <code>document.cookie="role=admin"</code> in Console), then refresh!
        </div>
        <p><a href="/" class="tp-btn tp-btn-secondary">Return to Catalog</a></p>
      </div>
    `
    return res.status(403).type('html').send(page('Vault Restricted', content))
  }
  res.status(403).send('Members only.')
})

// Room 4 — price tampering: trusts client price (VULN)
app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  const item = req.body.item || 'Citadel Item'

  if (price <= 0) {
    const flag = reward('client-trust')
    if (req.accepts('html')) {
      const content = `
        <div class="tp-alert tp-alert-success" style="max-width: 600px; margin: 0 auto; text-align: center;">
          <h2>🎉 Free Order Accepted!</h2>
          <p style="margin-top: 0.5rem; font-size: 1.1rem;">
            Order processed for <strong>${item}</strong>! You bypassed client-side pricing checks!
          </p>
          <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; margin: 1.25rem 0; font-family: monospace; font-size: 1.2rem; color: #f59e0b; border: 1px dashed #f59e0b;">
            ${flag}
          </div>
          <p><a href="/" class="tp-btn">Return to Catalog</a></p>
        </div>
      `
      return res.type('html').send(page('Checkout Success', content))
    }
    return res.send(`Free order accepted. ${flag}`)
  }

  // price > 0
  if (req.accepts('html')) {
    const content = `
      <div class="tp-alert tp-alert-danger" style="max-width: 600px; margin: 0 auto; text-align: center;">
        <h2>❌ Transaction Failed</h2>
        <p style="margin-top: 0.5rem; font-size: 1.05rem;">
          Order for <strong>${item}</strong> charged <strong>${price} Gold</strong>.
        </p>
        <p style="margin-top: 0.5rem; color: #fca5a5;">
          Your cadet coin pouch holds <strong>0 Gold</strong>. Insufficient funds!
        </p>
        <div style="background: #0a0e17; padding: 1.25rem; border-radius: 6px; margin: 1.5rem 0; text-align: left; font-size: 0.9rem; color: #cbd5e1; border: 1px solid #1f2937;">
          <p style="color: #f59e0b; font-weight: 600; margin-bottom: 0.5rem;">
            🔍 Observational Reconnaissance:
          </p>
          <p style="color: #94a3b8; line-height: 1.5;">
            Notice what just happened in your browser:
            When you clicked "Purchase", the webpage submitted an HTTP <code>POST</code> request to <code>/checkout</code> containing the payload <code>price=${price}</code> and <code>item=${item}</code>.
          </p>
          <p style="margin-top: 0.75rem; color: #94a3b8; line-height: 1.5;">
            The merchant backend trusts the client to tell it what price to charge!
            Can you tamper with that request (via DevTools Inspect Element, Network Replay, Burp Suite, or <code>curl</code>) and submit <code>price=0</code>?
          </p>
        </div>
        <p><a href="/" class="tp-btn tp-btn-secondary">Back to Catalog</a></p>
      </div>
    `
    return res.type('html').send(page('Payment Declined', content))
  }
  res.send(`Charged ${price}.`)
})

// Room 5 — IDOR: no ownership check (VULN)
app.get('/orders', (_req, res) => {
  const content = `
    <div class="tp-card" style="max-width: 600px; margin: 0 auto;">
      <h2>📦 Order Dispatch Lookup</h2>
      <p style="color: #94a3b8; margin: 0.5rem 0 1rem;">Track dispatched shipments and confidential cargo receipts.</p>

      <form action="/order" method="GET">
        <div class="tp-form-group">
          <label>Enter Order Tracking ID:</label>
          <input type="number" name="id" class="tp-input" value="1042" style="width: 100%;" required />
        </div>
        <button type="submit" class="tp-btn" style="width: 100%;">Track Order</button>
      </form>

      <p style="margin-top: 1rem; font-size: 0.85rem; color: #64748b;">
        Note: Your recent order is #1042. High-priority warden cargo orders are indexed in the #1300 range.
      </p>
    </div>
  `
  res.type('html').send(page('Order Lookup', content))
})

app.get('/order', (req, res) => {
  const orderId = req.query.id
  if (!orderId) return res.redirect('/orders')

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  if (!row) {
    if (req.accepts('html')) {
      const content = `
        <div class="tp-alert tp-alert-danger" style="max-width: 600px; margin: 0 auto; text-align: center;">
          <h2>Order Not Found</h2>
          <p style="margin-top: 0.5rem;">No order matching ID <strong>#${orderId}</strong> exists in the manifest.</p>
          <p style="margin-top: 1rem;"><a href="/orders" class="tp-btn tp-btn-secondary">Try Another ID</a></p>
        </div>
      `
      return res.status(404).type('html').send(page('Order Not Found', content))
    }
    return res.status(404).send('No such order')
  }

  if (req.accepts('html')) {
    const isWarden = String(row.id) === '1337'
    const content = `
      <div class="tp-card" style="max-width: 600px; margin: 0 auto;">
        <h2>Order #${row.id}</h2>
        <p style="color: #f59e0b; font-weight: 600; font-size: 1.15rem; margin: 0.5rem 0;">Item: ${row.item}</p>
        <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; border: 1px solid #1f2937; margin: 1rem 0;">
          <p style="font-size: 0.85rem; color: #94a3b8;">Dispatch Manifest Secret:</p>
          <p style="font-family: monospace; font-size: 1.15rem; color: #f3f4f6; margin-top: 0.25rem;">${row.secret}</p>
        </div>
        ${isWarden ? `<div class="tp-alert tp-alert-success" style="margin-top: 1rem;">🚩 Secret Warden Order Accessed via IDOR!</div>` : ''}
        <p><a href="/orders" class="tp-btn tp-btn-secondary">Search Another Order</a></p>
      </div>
    `
    return res.type('html').send(page(`Order #${row.id}`, content))
  }

  res.send(`Order ${row.id}: ${row.item} — ${row.secret}`)
})

// Room 7/8 — SQL injection: string-concatenated query (VULN)
app.get(['/portal-8f2c', '/portal-8f2c/login'], (_req, res) => {
  const content = `
    <div class="tp-card" style="max-width: 500px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">🔐 Citadel Warden Portal</h2>
      <p style="color: #94a3b8; margin: 0.5rem 0 1.5rem; font-size: 0.9rem;">
        Direct Citadel administrative database gateway. Authorized personnel only.
      </p>

      <form method="POST" action="/portal-8f2c/login">
        <div class="tp-form-group">
          <label>Username:</label>
          <input type="text" name="username" class="tp-input" style="width: 100%;" placeholder="e.g. admin" required />
        </div>
        <div class="tp-form-group">
          <label>Password:</label>
          <input type="password" name="password" class="tp-input" style="width: 100%;" placeholder="••••••••" required />
        </div>
        <button type="submit" class="tp-btn" style="width: 100%; margin-top: 0.5rem;">Authenticate</button>
      </form>
    </div>
  `
  res.type('html').send(page('Warden Portal', content))
})

app.post('/portal-8f2c/login', (req, res) => {
  const { username, password } = req.body
  // VULN: sqli — concatenated query
  const q = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
  try {
    const row = db.prepare(q).get()
    if (row) {
      const flag = reward('sqli')
      if (req.accepts('html')) {
        const content = `
          <div class="tp-alert tp-alert-success" style="max-width: 500px; margin: 0 auto; text-align: center;">
            <h2>🔓 Access Granted</h2>
            <p style="margin-top: 0.5rem;">Logged in as <strong>${row.username}</strong> via SQL injection bypass!</p>
            <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; margin: 1.25rem 0; font-family: monospace; font-size: 1.2rem; color: #f59e0b; border: 1px dashed #f59e0b;">
              ${flag}
            </div>
            <p><a href="/" class="tp-btn">Return to Store</a></p>
          </div>
        `
        return res.type('html').send(page('Portal Access Granted', content))
      }
      return res.send(`Logged in as ${row.username}. ${flag}`)
    }

    if (req.accepts('html')) {
      const content = `
        <div class="tp-alert tp-alert-danger" style="max-width: 500px; margin: 0 auto; text-align: center;">
          <h2>Authentication Failed</h2>
          <p style="margin: 0.5rem 0;">Bad credentials. Query returned no matching rows.</p>
          <p><a href="/portal-8f2c/login" class="tp-btn tp-btn-secondary">Try Again</a></p>
        </div>
      `
      return res.status(401).type('html').send(page('Login Failed', content))
    }
    res.status(401).send('Bad credentials')
  } catch (e) { res.status(500).send('Query error: ' + e.message) }
})

// Room 9 — reflected XSS: unescaped reflection (VULN)
app.get('/search', (req, res) => {
  // VULN: xss — reflects input unescaped
  const q = req.query.q || ''
  res.cookie('keep_nonce', NONCE, { path: '/', sameSite: 'lax', httpOnly: false })

  if (req.accepts('html')) {
    const content = `
      <script>window.KEEP_NONCE = "${NONCE}";</script>
      <h2>Inventory Search Results</h2>
      <p style="margin: 0.5rem 0 1.5rem; color: #94a3b8;">
        Searching inventory catalog for: <span style="color: #f59e0b; font-weight: bold;">${q}</span>
      </p>

      <div class="tp-alert tp-alert-info">
        No products matched your search query in our current catalog.
      </div>

      <p><a href="/" class="tp-btn tp-btn-secondary">Back to Catalog</a></p>
    `
    return res.type('html').send(page('Search Results', content))
  }

  res.send(`<h1>Results for ${q}</h1>\n<p>No products matched. (reflected search)</p>`)
})

// Stored XSS — guestbook renders comments unescaped (VULN)
app.get('/guestbook', (_req, res) => {
  res.cookie('keep_nonce', NONCE, { path: '/', sameSite: 'lax', httpOnly: false })
  const items = guestbook.map((c) => `<div class="tp-card" style="margin-bottom: 0.75rem; padding: 1rem;"><p>${c}</p></div>`).join('\n')
  
  if (_req.accepts('html')) {
    const content = `
      <script>window.KEEP_NONCE = "${NONCE}";</script>
      <h2>📜 Trading Post Traveler Guestbook</h2>
      <p style="color: #94a3b8; margin: 0.5rem 0 1.5rem;">
        Leave messages, merchant reviews, or outpost dispatches.
      </p>

      <div class="tp-card" style="margin-bottom: 2rem;">
        <form method="POST" action="/guestbook">
          <div class="tp-form-group">
            <label>Sign the Guestbook:</label>
            <textarea name="comment" class="tp-input" style="width: 100%; min-height: 80px;" placeholder="Share your traveler dispatch..." required></textarea>
          </div>
          <button type="submit" class="tp-btn">Post Message</button>
        </form>
      </div>

      <h3>Recent Messages (${guestbook.length})</h3>
      <div style="margin-top: 1rem;">
        ${items}
      </div>
    `
    return res.type('html').send(page('Guestbook', content))
  }

  res.send(`<h1>Guestbook</h1>\n<ul>${guestbook.map((c) => `<li>${c}</li>`).join('\n')}</ul>\n<form method="POST" action="guestbook"><input name="comment"><button>Post</button></form>`)
})

app.post('/guestbook', (req, res) => {
  // VULN: stored-xss — comment stored and later rendered unescaped
  guestbook.push(String(req.body.comment || ''))
  res.redirect('/guestbook')
})

// XSS callback: a payload that actually executed in the page reads document.cookie / keep_nonce
// and reports here. /xss-status then reveals that room's flag.
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
app.get(['/keep-admin', '/keep-admin/vault'], (req, res) => {
  if (req.cookies.role === 'admin') {
    const flag = reward('chain')
    if (req.accepts('html')) {
      const content = `
        <div class="tp-alert tp-alert-success" style="max-width: 600px; margin: 0 auto; text-align: center;">
          <h2>🏆 Inner Citadel Sanctum Breach</h2>
          <p style="margin: 0.5rem 0;">You chained reconnaissance with role-cookie forging to breach the deepest vault!</p>
          <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; margin: 1.25rem 0; font-family: monospace; font-size: 1.2rem; color: #f59e0b; border: 1px dashed #f59e0b;">
            ${flag}
          </div>
          <p><a href="/" class="tp-btn">Return to Store</a></p>
        </div>
      `
      return res.type('html').send(page('Inner Vault', content))
    }
    return res.type('text/plain').send(`chained to the inner vault. ${flag}`)
  }

  if (req.accepts('html')) {
    const content = `
      <div class="tp-alert tp-alert-danger" style="max-width: 600px; margin: 0 auto; text-align: center;">
        <h2>⛔ Inner Vault Blocked</h2>
        <p style="margin: 0.5rem 0;">You discovered the hidden path, but access is restricted to verified administrators.</p>
        <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.5rem;">
          Your current cookie identity: <code>role=${req.cookies.role || 'guest'}</code>.
        </p>
        <div style="background: #0a0e17; padding: 1rem; border-radius: 6px; margin: 1rem 0; text-align: left; font-size: 0.85rem; color: #94a3b8; border: 1px solid #1f2937;">
          💡 <em>Observation Tip:</em> The endpoint is hidden from normal links, but protected by the same client-side cookie logic as the regular vault. Can you forge <code>role=admin</code> here too?
        </div>
        <p style="margin-top: 1rem;"><a href="/" class="tp-btn tp-btn-secondary">Back to Store</a></p>
      </div>
    `
    return res.status(403).type('html').send(page('Inner Vault Forbidden', content))
  }
  res.status(403).type('text/plain').send('forbidden: admin only (how did the vault room get in?)')
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`[trading-post] VULNERABLE app on :${PORT} room=${process.env.BK_ROOM || '(all)'}`))
export default app
