import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'

function toWslPath(winPath) {
  const p = path.resolve(winPath).replace(/\\/g, '/')
  const match = p.match(/^([A-Za-z]):\/(.*)$/)
  if (match) return `/mnt/${match[1].toLowerCase()}/${match[2]}`
  return p
}

const rootDir = fileURLToPath(new URL('..', import.meta.url))

console.log('================================================================================')
console.log('TASK 5: §0.1 RE-GRADE SPOT-CHECK — ONE REAL ROOM PER DUNGEON')
console.log('================================================================================\n')

// 1. Terminal 1: terminal-1-hidden
{
  console.log('--- [Dungeon 1: terminal-1] Room: terminal-1-hidden ---')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spot-t1-hidden-'))
  const wslTmp = toWslPath(tmp)
  const scriptContent = fs.readFileSync(path.join(rootDir, 'labs/terminal/hidden.sh'), 'utf8')
  const stubbed = scriptContent
    .replace(/^ROOT=\/home\/student/m, `ROOT="${wslTmp}/home/student"`)
    .replace(/exec env -u BK_FLAG ttyd [^\n]*/g, 'true')

  const shPath = path.join(tmp, 'gen.sh')
  fs.writeFileSync(shPath, stubbed)
  execSync(`bash "${toWslPath(shPath)}"`)

  console.log(`Directory: ${wslTmp}`)
  console.log('Planted files in directory:')
  const findOut = execSync(`bash -c "find '${wslTmp}' -type f | sort"`).toString().trim()
  console.log(findOut)

  console.log('Command: grep -r "BK{" \'' + wslTmp + '\'')
  let grepOut = ''
  let exitCode = 0
  try {
    grepOut = execSync(`bash -c "grep -r 'BK{' '${wslTmp}'"`).toString()
  } catch (e) {
    exitCode = e.status
    grepOut = e.stdout ? e.stdout.toString() : ''
  }
  console.log(`Exit code: ${exitCode}`)
  console.log(`Output: ${grepOut.trim() || '(no matches found)'}\n`)
  fs.rmSync(tmp, { recursive: true, force: true })
}

// 2. Terminal 2: terminal-2-groups
{
  console.log('--- [Dungeon 2: terminal-2] Room: terminal-2-groups ---')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spot-t2-groups-'))
  const wslTmp = toWslPath(tmp)
  const scriptContent = fs.readFileSync(path.join(rootDir, 'labs/terminal/t2-groups.sh'), 'utf8')
  const stubbed = scriptContent
    .replace(/^S=\/home\/student/m, `S="${wslTmp}/home/student"`)
    .replace(/\/vault/g, `${wslTmp}/vault`)
    .replace(/groupadd [^\n]*/g, 'true')
    .replace(/usermod [^\n]*/g, 'true')
    .replace(/chown [^\n]*/g, 'true')
    .replace(/chmod [^\n]*/g, 'true')
    .replace(/exec setpriv [^]*ttyd[^\n]*bash/g, 'true')
    .replace(/ttyd [^\n]*/g, 'true')

  fs.mkdirSync(path.join(tmp, 'home', 'student'), { recursive: true })
  const shPath = path.join(tmp, 'gen.sh')
  fs.writeFileSync(shPath, stubbed)
  execSync(`bash "${toWslPath(shPath)}"`)

  console.log(`Directory: ${wslTmp}`)
  console.log('Planted files in directory:')
  const findOut = execSync(`bash -c "find '${wslTmp}' -type f | sort"`).toString().trim()
  console.log(findOut)

  console.log('Command: grep -r "BK{" \'' + wslTmp + '\'')
  let grepOut = ''
  let exitCode = 0
  try {
    grepOut = execSync(`bash -c "grep -r 'BK{' '${wslTmp}'"`).toString()
  } catch (e) {
    exitCode = e.status
    grepOut = e.stdout ? e.stdout.toString() : ''
  }
  console.log(`Exit code: ${exitCode}`)
  console.log(`Output: ${grepOut.trim() || '(no matches found)'}\n`)
  fs.rmSync(tmp, { recursive: true, force: true })
}

// 3. Network: network-ports
{
  console.log('--- [Dungeon 3: network] Room: network-ports ---')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spot-net-ports-'))
  const wslTmp = toWslPath(tmp)
  const scriptContent = fs.readFileSync(path.join(rootDir, 'labs/network/ports.sh'), 'utf8')
  const stubbed = scriptContent
    .replace(/^S=\/home\/student/m, `S="${wslTmp}/home/student"`)
    .replace(/\/opt\/net/g, `${wslTmp}/opt/net`)
    .replace(/python3 \/opt\/net\/server\.py &[^\n]*/g, 'true')
    .replace(/chown [^\n]*/g, 'true')
    .replace(/exec setpriv [^]*ttyd[^\n]*bash/g, 'true')
    .replace(/ttyd [^\n]*/g, 'true')

  fs.mkdirSync(path.join(tmp, 'home', 'student'), { recursive: true })
  const shPath = path.join(tmp, 'gen.sh')
  fs.writeFileSync(shPath, stubbed)
  execSync(`bash "${toWslPath(shPath)}"`)

  console.log(`Directory: ${wslTmp}`)
  console.log('Planted files in directory:')
  const findOut = execSync(`bash -c "find '${wslTmp}' -type f | sort"`).toString().trim()
  console.log(findOut)

  console.log('Command: grep -r "BK{" \'' + wslTmp + '\'')
  let grepOut = ''
  let exitCode = 0
  try {
    grepOut = execSync(`bash -c "grep -r 'BK{' '${wslTmp}'"`).toString()
  } catch (e) {
    exitCode = e.status
    grepOut = e.stdout ? e.stdout.toString() : ''
  }
  console.log(`Exit code: ${exitCode}`)
  console.log(`Output: ${grepOut.trim() || '(no matches found)'}\n`)
  fs.rmSync(tmp, { recursive: true, force: true })
}

// 4. Web: web-devtools
{
  console.log('--- [Dungeon 4: web] Room: web-devtools ---')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spot-web-devtools-'))
  const wslTmp = toWslPath(tmp)

  const bkflagUrl = pathToFileURL(path.join(rootDir, 'labs/web/bkflag.js')).href
  const runnerScript = `
import fs from 'fs'
import path from 'path'
process.env.BK_ROOM = 'web-devtools'
const { FLAG, reward } = await import('${bkflagUrl}')
const devtoolsReward = reward('devtools')
const tokenBase64 = Buffer.from(devtoolsReward).toString('base64')
const accountResponseBody = 'Account OK. Your session token is returned in the response headers, not the page body. (DevTools → Network, or curl -i)'

fs.writeFileSync('${tmp.replace(/\\/g, '/')}/flag.txt', FLAG)
fs.writeFileSync('${tmp.replace(/\\/g, '/')}/reward.txt', devtoolsReward)
fs.writeFileSync('${tmp.replace(/\\/g, '/')}/header_x_keep_token.txt', tokenBase64)
fs.writeFileSync('${tmp.replace(/\\/g, '/')}/account_body.html', accountResponseBody)
`
  const runFile = path.join(tmp, 'run.mjs')
  fs.writeFileSync(runFile, runnerScript)
  execSync(`node "${runFile}"`)

  console.log(`Directory: ${wslTmp}`)
  console.log('Planted/emitted files in directory:')
  const findOut = execSync(`bash -c "find '${wslTmp}' -type f | sort"`).toString().trim()
  console.log(findOut)

  console.log('Command: grep -r "BK{" \'' + wslTmp + '\'')
  let grepOut = ''
  let exitCode = 0
  try {
    grepOut = execSync(`bash -c "grep -r 'BK{' '${wslTmp}'"`).toString()
  } catch (e) {
    exitCode = e.status
    grepOut = e.stdout ? e.stdout.toString() : ''
  }
  console.log(`Exit code: ${exitCode}`)
  console.log(`Output: ${grepOut.trim() || '(no matches found)'}\n`)
  fs.rmSync(tmp, { recursive: true, force: true })
}

// 5. Secure Coding: secure-sqli
{
  console.log('--- [Dungeon 5: secure-coding] Room: secure-sqli ---')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spot-sec-sqli-'))
  const wslTmp = toWslPath(tmp)

  const flagFormatsUrl = pathToFileURL(path.join(rootDir, 'apps/shared/flagFormats.js')).href
  const runnerScript = `
import fs from 'fs'
const { formatFor, wrapFlag } = await import('${flagFormatsUrl}')
const room = 'secure-sqli'
const flag = wrapFlag('dev-secure-coding-flag', formatFor(room))
fs.writeFileSync('${tmp.replace(/\\/g, '/')}/reward_flag.txt', flag)
`
  const runFile = path.join(tmp, 'run.mjs')
  fs.writeFileSync(runFile, runnerScript)
  execSync(`node "${runFile}"`)

  console.log(`Directory: ${wslTmp}`)
  console.log('Planted/emitted files in directory:')
  const findOut = execSync(`bash -c "find '${wslTmp}' -type f | sort"`).toString().trim()
  console.log(findOut)

  console.log('Command: grep -r "BK{" \'' + wslTmp + '\'')
  let grepOut = ''
  let exitCode = 0
  try {
    grepOut = execSync(`bash -c "grep -r 'BK{' '${wslTmp}'"`).toString()
  } catch (e) {
    exitCode = e.status
    grepOut = e.stdout ? e.stdout.toString() : ''
  }
  console.log(`Exit code: ${exitCode}`)
  console.log(`Output: ${grepOut.trim() || '(no matches found)'}\n`)
  fs.rmSync(tmp, { recursive: true, force: true })
}

// 6. Capstone: capstone-gauntlet
{
  console.log('--- [Dungeon 6: capstone] Room: capstone-gauntlet ---')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spot-capstone-'))
  const wslTmp = toWslPath(tmp)
  const scriptContent = fs.readFileSync(path.join(rootDir, 'labs/capstone/entrypoint.sh'), 'utf8')
  const stubbed = scriptContent
    .replace(/cat > \/root\/root\.txt/g, `mkdir -p "${wslTmp}/root" && cat > "${wslTmp}/root/root.txt"`)
    .replace(/\/home\/\$U/g, `${wslTmp}/home/$U`)
    .replace(/\/opt\/notes/g, `${wslTmp}/opt/notes`)
    .replace(/\/var\/www/g, `${wslTmp}/var/www`)
    .replace(/\/etc\/sudoers\.d\/gale/g, `${wslTmp}/sudoers_gale`)
    .replace(/\/etc\/issue\.net/g, `${wslTmp}/issue_net`)
    .replace(/\/etc\/ssh\/sshd_config\.d\/keep\.conf/g, `${wslTmp}/keep_conf`)
    .replace(/mkdir -p \/run\/sshd[^\n]*/g, 'true')
    .replace(/id "\$U"[^\n]*/g, 'true')
    .replace(/echo "\$U:\$P"[^\n]*/g, 'true')
    .replace(/chown [^\n]*/g, 'true')
    .replace(/chmod [^\n]*/g, 'true')
    .replace(/ssh-keygen [^\n]*/g, 'true')
    .replace(/\/usr\/sbin\/sshd [^\n]*/g, 'true')
    .replace(/exec python3 [^\n]*/g, 'true')

  fs.mkdirSync(path.join(tmp, 'home', 'gale'), { recursive: true })
  fs.mkdirSync(path.join(tmp, 'opt', 'notes'), { recursive: true })
  fs.mkdirSync(path.join(tmp, 'var', 'www', 'backup'), { recursive: true })
  fs.mkdirSync(path.join(tmp, 'var', 'www', 'internal'), { recursive: true })

  const shPath = path.join(tmp, 'gen.sh')
  fs.writeFileSync(shPath, stubbed)
  execSync(`bash "${toWslPath(shPath)}"`)

  console.log(`Directory: ${wslTmp}`)
  console.log('Planted files in directory:')
  const findOut = execSync(`bash -c "find '${wslTmp}' -type f | sort"`).toString().trim()
  console.log(findOut)

  console.log('Command: grep -r "BK{" \'' + wslTmp + '\'')
  let grepOut = ''
  let exitCode = 0
  try {
    grepOut = execSync(`bash -c "grep -r 'BK{' '${wslTmp}'"`).toString()
  } catch (e) {
    exitCode = e.status
    grepOut = e.stdout ? e.stdout.toString() : ''
  }
  console.log(`Exit code: ${exitCode}`)
  console.log(`Output: ${grepOut.trim() || '(no matches found)'}\n`)
  fs.rmSync(tmp, { recursive: true, force: true })
}
