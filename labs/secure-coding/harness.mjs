// Reruns exploits against the (possibly patched) Trading Post app in-process.
// Usage: node harness.mjs <room>
// Exit 0 = fixed (exploit fails, functional test passes). Exit 1 = still vulnerable/broken.
import request from 'supertest'
import app from '../web/server.js'

const room = process.argv[2]

const checks = {
  'secure-sqli': async () => {
    // exploit must now FAIL
    const exploit = await request(app).post('/portal-8f2c/login')
      .send('username=' + encodeURIComponent("admin'--") + '&password=anything')
    const exploitBlocked = exploit.status === 401
    // functional test must still PASS (real creds work)
    const legit = await request(app).post('/portal-8f2c/login')
      .send('username=admin&password=super-secret-pw')
    const stillWorks = legit.status === 200
    return { exploitBlocked, stillWorks }
  },
  'secure-idor': async () => {
    const other = await request(app).get('/order?id=1337')
    const exploitBlocked = other.status === 403 || other.status === 404
    const own = await request(app).get('/order?id=1042')
    const stillWorks = own.status === 200
    return { exploitBlocked, stillWorks }
  },
  'secure-xss': async () => {
    const r = await request(app).get('/search?q=' + encodeURIComponent('<script>x</script>'))
    const exploitBlocked = !r.text.includes('<script>x</script>')
    const legit = await request(app).get('/search?q=widget')
    const stillWorks = legit.status === 200 && legit.text.includes('widget')
    return { exploitBlocked, stillWorks }
  },
}

const check = checks[room]
if (!check) { console.error('unknown room', room); process.exit(2) }
const { exploitBlocked, stillWorks } = await check()
console.log(JSON.stringify({ room, exploitBlocked, stillWorks }))
process.exit(exploitBlocked && stillWorks ? 0 : 1)
