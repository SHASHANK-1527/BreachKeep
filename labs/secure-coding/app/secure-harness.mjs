import request from 'supertest'
import { pathToFileURL } from 'url'

// Anti-forgery: read nonce from grader, then delete it from process.env before importing server.js
const nonce = process.env.HARNESS_NONCE || ''
delete process.env.HARNESS_NONCE
const originalLog = console.log

const serverPath = process.env.TARGET_SERVER
  ? pathToFileURL(process.env.TARGET_SERVER).href
  : './server.js'
const { default: app } = await import(serverPath)

const room = process.argv[2]

const checks = {
  sqli: async () => {
    // 1. Classic comment exploit
    const ex1 = await request(app).post('/portal-8f2c/login')
      .send('username=' + encodeURIComponent("admin'--") + '&password=x')
    // 2. OR injection without relying only on simple -- comment
    const ex2 = await request(app).post('/portal-8f2c/login')
      .send('username=' + encodeURIComponent("admin' OR '1'='1") + '&password=x')
    const exploitBlocked = ex1.status === 401 && ex2.status === 401

    // Legitimate admin login
    const okAdmin = await request(app).post('/portal-8f2c/login')
      .send('username=admin&password=super-secret-pw')
    // Legitimate username with literal apostrophe: O'Brien
    // A blacklist-style fix (if username.includes("'")) or string concatenation will fail here
    const okOBrien = await request(app).post('/portal-8f2c/login')
      .send('username=' + encodeURIComponent("O'Brien") + '&password=obrien-pw')
    const stillWorks = okAdmin.status === 200 && okOBrien.status === 200
    return { exploitBlocked, stillWorks }
  },
  xss: async () => {
    // Test multiple tag vectors to fail naive <script> tag stripping
    const exScript = await request(app).get('/search?q=' + encodeURIComponent('<script>x</script>'))
    const exImg = await request(app).get('/search?q=' + encodeURIComponent('<img src=x onerror=alert(1)>'))
    const exSvg = await request(app).get('/search?q=' + encodeURIComponent('"><svg onload=alert(1)>'))
    const exploitBlocked = !exScript.text.includes('<script>x</script>') &&
                           !exImg.text.includes('<img src=x onerror=alert(1)>') &&
                           !exSvg.text.includes('"><svg onload=alert(1)>')
    const ok = await request(app).get('/search?q=widget')
    const stillWorks = ok.status === 200 && ok.text.includes('widget')
    return { exploitBlocked, stillWorks }
  },
  // TODO(breachkeep-fix): Note: the reference fix in secure-coding.md §4.2 only checks req.cookies.uid === row.owner,
  // which trusts a bare unauthenticated client cookie. In production, identity should be verified against
  // an authenticated server-side session store.
  idor: async () => {
    // Unauthorized access to another user's order (alice requesting admin's order)
    const ex1 = await request(app).get('/order?id=1337').set('Cookie', 'uid=alice')
    // Unauthorized access to another user's order (bob requesting alice's order - catches hardcoded 1337 check)
    const ex2 = await request(app).get('/order?id=1042').set('Cookie', 'uid=bob')
    const exploitBlocked = (ex1.status === 403 || ex1.status === 404) &&
                           (ex2.status === 403 || ex2.status === 404)
    // Legitimate access to own order
    const ok = await request(app).get('/order?id=1042').set('Cookie', 'uid=alice')
    const stillWorks = ok.status === 200
    return { exploitBlocked, stillWorks }
  },
  // TODO(breachkeep-fix): confirm price validation standard (server catalog vs numeric validation) with instructor
  client: async () => {
    const exZero = await request(app).post('/checkout').send('price=0')
    const exNeg = await request(app).post('/checkout').send('price=-50')
    const exStr = await request(app).post('/checkout').send('price=10;drop')
    const exPenny = await request(app).post('/checkout').send('price=0.01')

    // Price <= 0 or non-numeric must never be accepted as free order or valid charge
    const zeroBlocked = (!/free/i.test(exZero.text) && !exZero.text.includes('total=0')) || exZero.status === 400
    const negBlocked = exNeg.status === 400 || (!/free/i.test(exNeg.text) && !/charged -50/i.test(exNeg.text))
    const strBlocked = exStr.status === 400 || !/charged 10;drop/i.test(exStr.text)
    const pennyValid = !/free/i.test(exPenny.text) && !exPenny.text.includes('total=0')

    const exploitBlocked = zeroBlocked && negBlocked && strBlocked && pennyValid
    const ok = await request(app).post('/checkout').send('price=10')
    const stillWorks = ok.status === 200 && /charg/i.test(ok.text)
    return { exploitBlocked, stillWorks }
  },
  headers: async () => {
    const r = await request(app).get('/')
    const nosniff = String(r.headers['x-content-type-options'] || '').toLowerCase() === 'nosniff'
    const frame = !!r.headers['x-frame-options']
    return { exploitBlocked: nosniff && frame, stillWorks: r.status === 200 }
  },
  'rate-limit': async () => {
    let got429 = false, firstStatus = null
    for (let i = 0; i < 12; i++) {
      const r = await request(app).post('/portal-8f2c/login').send('username=admin&password=wrong')
      if (i === 0) firstStatus = r.status
      if (r.status === 429) got429 = true
    }

    // Verify window recovery: after window expiration, a legitimate login from the same client succeeds
    const realNow = Date.now
    let windowResetSuccess = false
    try {
      Date.now = () => realNow() + 65000
      const recovery = await request(app).post('/portal-8f2c/login').send('username=admin&password=super-secret-pw')
      windowResetSuccess = recovery.status === 200
    } finally {
      Date.now = realNow
    }

    const stillWorks = firstStatus !== 429 && windowResetSuccess
    return { exploitBlocked: got429, stillWorks }
  },
  'hide-secret': async () => {
    // Assert sk-hardcoded-9f83a1 does not appear anywhere in process responses across all routes
    const routes = ['/config', '/', '/robots.txt', '/vault', '/order?id=1042']
    let leaked = false
    for (const r of routes) {
      const res = await request(app).get(r)
      if (res.text && res.text.includes('sk-hardcoded-9f83a1')) leaked = true
    }
    const exploitBlocked = !leaked
    const ok = await request(app).get('/config')
    const stillWorks = ok.status === 200
    return { exploitBlocked, stillWorks }
  },
}

async function runOne(name) {
  const c = checks[name]
  if (!c) return { name, error: 'unknown room', exploitBlocked: false, stillWorks: false, pass: false }
  try {
    const r = await c()
    return { name, ...r, pass: !!(r.exploitBlocked && r.stillWorks) }
  } catch (e) {
    return { name, error: String(e.message), exploitBlocked: false, stillWorks: false, pass: false }
  }
}

let result
if (room === 'full-review') {
  const parts = []
  for (const n of ['sqli', 'xss', 'idor', 'client']) parts.push(await runOne(n))
  result = { room, parts, pass: parts.every((p) => p.pass) }
} else {
  result = { room, ...(await runOne(room)) }
}
originalLog('__HARNESS_RESULT__:' + JSON.stringify({ nonce, ...result }))
process.exit(result.pass ? 0 : 1)

