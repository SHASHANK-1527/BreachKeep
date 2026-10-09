import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFileSync } from 'child_process'
import assert from 'node:assert/strict'

import { fileURLToPath } from 'url'

export function toWslPath(winPath) {
  const p = path.resolve(winPath).replace(/\\/g, '/')
  const match = p.match(/^([A-Za-z]):\/(.*)$/)
  if (match) {
    return `/mnt/${match[1].toLowerCase()}/${match[2]}`
  }
  return p
}

export function testEntrypointPlantedFiles() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'capstone-sim-'))
  const wslTmp = toWslPath(tmp)
  const entrypointFile = fileURLToPath(new URL('../labs/capstone/entrypoint.sh', import.meta.url))
  const entrypointContent = fs.readFileSync(entrypointFile, 'utf8')

  // Redirection map for simulated execution:
  // Root paths redirected into tmp directory; system/privilege commands stubbed.
  const simScript = entrypointContent
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

  // Ensure target directories exist before running
  fs.mkdirSync(path.join(tmp, 'home', 'gale'), { recursive: true })
  fs.mkdirSync(path.join(tmp, 'opt', 'notes'), { recursive: true })
  fs.mkdirSync(path.join(tmp, 'var', 'www', 'backup'), { recursive: true })
  fs.mkdirSync(path.join(tmp, 'var', 'www', 'internal'), { recursive: true })

  const scriptPath = path.join(tmp, 'sim.sh')
  fs.writeFileSync(scriptPath, simScript)

  const wslScriptPath = toWslPath(scriptPath)
  try {
    execFileSync('bash', [wslScriptPath])
  } catch (err) {
    fs.rmSync(tmp, { recursive: true, force: true })
    throw err
  }

  const rootTxt = fs.readFileSync(path.join(tmp, 'root', 'root.txt'), 'utf8')
  const robots = fs.readFileSync(path.join(tmp, 'var', 'www', 'robots.txt'), 'utf8')
  const backup = fs.readFileSync(path.join(tmp, 'var', 'www', 'backup', 'app.conf.bak'), 'utf8')
  const envFile = fs.readFileSync(path.join(tmp, 'var', 'www', '.env'), 'utf8')
  const status = fs.readFileSync(path.join(tmp, 'var', 'www', 'internal', 'status'), 'utf8')
  const userTxt = fs.readFileSync(path.join(tmp, 'home', 'gale', 'user.txt'), 'utf8')
  const todo = fs.readFileSync(path.join(tmp, 'opt', 'notes', 'todo.txt'), 'utf8')

  fs.rmSync(tmp, { recursive: true, force: true })

  // Assert root flag is WARD and not BK
  assert.ok(rootTxt.includes('WARD[['), 'root.txt contains WARD[[')
  assert.ok(rootTxt.includes(']]'), 'root.txt contains ]]')
  assert.ok(!rootTxt.includes('BK{'), 'root.txt does not contain BK{')

  // Assert 6 decoys are present in their specific non-BK formats
  assert.ok(robots.includes('KEEP[robots_said_no]'), 'robots.txt contains KEEP[robots_said_no]')
  assert.ok(backup.includes('VAULT<backup_left_in_webroot>'), 'backup contains VAULT<backup_left_in_webroot>')
  assert.ok(envFile.includes('FLAG((env_file_exposed))'), '.env contains FLAG((env_file_exposed))')
  assert.ok(status.includes('ARCHIVE::html_source_comment::'), 'status contains ARCHIVE::html_source_comment::')
  assert.ok(userTxt.includes('RUNE/user_flag_on_the_box/'), 'user.txt contains RUNE/user_flag_on_the_box/')
  assert.ok(todo.includes('SEAL|almost_there_check_sudo|'), 'todo.txt contains SEAL|almost_there_check_sudo|')

  // Assert no old BK decoy formats in any planted file
  const allPlanted = [rootTxt, robots, backup, envFile, status, userTxt, todo].join('\n')
  assert.ok(!allPlanted.includes('BK{robots_said_no}'), 'no legacy BK robots decoy')
  assert.ok(!allPlanted.includes('BK{backup_left_in_webroot}'), 'no legacy BK backup decoy')
  assert.ok(!allPlanted.includes('BK{env_file_exposed}'), 'no legacy BK env decoy')
  assert.ok(!allPlanted.includes('BK{html_source_comment}'), 'no legacy BK html decoy')
  assert.ok(!allPlanted.includes('BK{user_flag_on_the_box}'), 'no legacy BK user decoy')
  assert.ok(!allPlanted.includes('BK{almost_there_check_sudo}'), 'no legacy BK sudo decoy')

  return true
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  testEntrypointPlantedFiles()
  console.log('SIMULATED entrypoint check passed!')
}
