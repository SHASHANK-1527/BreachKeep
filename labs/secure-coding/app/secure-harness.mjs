// Reruns one room's exploit + functional test against ./server.js (the student's
// current code). Run as a fresh process by the grader, with HARNESS=1 (so the
// app does not bind a port) and BK_FLAG stripped. Exit 0 = fixed (exploit fails
// AND functional test passes); exit 1 = still vulnerable or broken.
import request from 'supertest'
import app from './server.js'

const room = process.argv[2]

const checks = {
  sqli: async () => {
    const ex = await request(app).post('/portal-8f2c/login')
      .send('username=' + encodeURIComponent("admin'--") + '&password=x')
    const exploitBlocked = ex.status === 401
    const ok = await request(app).post('/portal-8f2c/login')
      .send('username=admin&password=super-secret-pw')
    const stillWorks = ok.status === 200
    return { exploitBlocked, stillWorks }
  },
  xss: async () => {
    const ex = await request(app).get('/search?q=' + encodeURIComponent('<script>x</script>'))
    const exploitBlocked = !ex.text.includes('<script>x</script>')
    const ok = await request(app).get('/search?q=widget')
    const stillWorks = ok.status === 200 && ok.text.includes('widget')
    return { exploitBlocked, stillWorks }
  },
  idor: async () => {
    const ex = await request(app).get('/order?id=1337').set('Cookie', 'uid=alice')
    const exploitBlocked = ex.status === 403 || ex.status === 404
    const ok = await request(app).get('/order?id=1042').set('Cookie', 'uid=alice')
    const stillWorks = ok.status === 200
    return { exploitBlocked, stillWorks }
  },
  client: async () => {
    const ex = await request(app).post('/checkout').send('price=0')
    const exploitBlocked = !/free/i.test(ex.text) && !ex.text.includes('total=0')
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
    return { exploitBlocked: got429, stillWorks: firstStatus !== 429 }
  },
  'hide-secret': async () => {
    const r = await request(app).get('/config')
    const exploitBlocked = !r.text.includes('sk-hardcoded-9f83a1')
    const stillWorks = r.status === 200
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
console.log(JSON.stringify(result))
process.exit(result.pass ? 0 : 1)
