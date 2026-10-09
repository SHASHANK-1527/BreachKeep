import { spawn } from 'child_process'
import http from 'http'

// Start the real labs/web/server.js on port 8089
const serverProcess = spawn('node', ['labs/web/server.js'], {
  env: { ...process.env, PORT: '8089', BK_ROOM: 'reflected-xss' },
  stdio: ['ignore', 'pipe', 'pipe']
})

serverProcess.stdout.on('data', (d) => process.stdout.write(`[SERVER STDOUT] ${d}`))
serverProcess.stderr.on('data', (d) => process.stderr.write(`[SERVER STDERR] ${d}`))

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function runCurl(args) {
  return new Promise((resolve) => {
    const p = spawn('curl', args)
    let out = ''
    let err = ''
    p.stdout.on('data', (d) => { out += d })
    p.stderr.on('data', (d) => { err += d })
    p.on('close', (code) => {
      resolve({ code, out, err })
    })
  })
}

async function main() {
  // Wait for server to come up
  await sleep(1500)

  console.log('--- TEST (c): Can the nonce be read via curl from response headers? ---')
  console.log('Command: curl -i -s "http://127.0.0.1:8089/search?q=test"')
  const resC = await runCurl(['-i', '-s', 'http://127.0.0.1:8089/search?q=test'])
  console.log('OUTPUT:')
  console.log(resC.out)

  // Extract keep_nonce from Set-Cookie header
  const match = resC.out.match(/Set-Cookie:\s*keep_nonce=([a-f0-9]+)/i)
  const nonce = match ? match[1] : null
  console.log(`Extracted Nonce: ${nonce}`)

  console.log('\n--- TEST (a): No Sec-Fetch-Mode header -> blocked ---')
  console.log(`Command: curl -i -s "http://127.0.0.1:8089/xss-report?r=reflected-xss&nonce=${nonce}"`)
  const resA = await runCurl(['-i', '-s', `http://127.0.0.1:8089/xss-report?r=reflected-xss&nonce=${nonce}`])
  console.log('OUTPUT:')
  console.log(resA.out)

  console.log('\n--- TEST (b): Sec-Fetch-Mode: cors spoofed -> accepted ---')
  console.log(`Command: curl -i -s -H "Sec-Fetch-Mode: cors" "http://127.0.0.1:8089/xss-report?r=reflected-xss&nonce=${nonce}"`)
  const resB = await runCurl(['-i', '-s', '-H', 'Sec-Fetch-Mode: cors', `http://127.0.0.1:8089/xss-report?r=reflected-xss&nonce=${nonce}`])
  console.log('OUTPUT:')
  console.log(resB.out)

  console.log('\n--- Checking /xss-status after spoofed report ---')
  console.log('Command: curl -i -s "http://127.0.0.1:8089/xss-status?r=reflected-xss"')
  const resStatus = await runCurl(['-i', '-s', 'http://127.0.0.1:8089/xss-status?r=reflected-xss'])
  console.log('OUTPUT:')
  console.log(resStatus.out)

  serverProcess.kill()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  serverProcess.kill()
  process.exit(1)
})
