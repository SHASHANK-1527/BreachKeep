import Docker from 'dockerode'
import os from 'os'

const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' })

const CPU = parseFloat(process.env.CONTAINER_CPU || '0.5')
const MEM = process.env.CONTAINER_MEM || '256m'
const LAB_NET = process.env.LAB_NETWORK || 'bk_labs'

function memBytes(s) {
  const m = /^(\d+)(m|g)?$/i.exec(s)
  if (!m) return 256 * 1024 * 1024
  const n = parseInt(m[1], 10)
  return m[2]?.toLowerCase() === 'g' ? n * 1024 ** 3 : n * 1024 ** 2
}

// Create the isolated lab network (once) and attach THIS provisioner container
// to it, so the provisioner can reach challenge containers by name over Docker
// DNS. The network is `internal: true` — the deliberately-exposed challenge
// containers get no route to the internet.
export async function ensureLabNetwork() {
  let net
  try {
    net = await docker.getNetwork(LAB_NET).inspect()
  } catch {
    await docker.createNetwork({ Name: LAB_NET, Driver: 'bridge', Internal: true, CheckDuplicate: true })
    net = await docker.getNetwork(LAB_NET).inspect()
  }
  // Attach self so container-name DNS resolves from here.
  try {
    await docker.getNetwork(LAB_NET).connect({ Container: os.hostname() })
    console.log(`[provisioner] attached to ${LAB_NET}`)
  } catch (e) {
    // "already exists in network" is fine; anything else is worth logging.
    if (!/already exists|already attached/i.test(String(e.message))) {
      console.warn('[provisioner] could not attach self to lab network:', e.message)
    }
  }
  return net
}

// Build ONE room image. Each room has its own Dockerfile.<roomId> in the
// dungeon's build context, so rooms in the same dungeon get different images.
export async function buildImage(context, roomId, tag) {
  const stream = await docker.buildImage(
    { context: `/labs/${context}`, src: ['.'] },
    { t: tag, dockerfile: `Dockerfile.${roomId}` }
  )
  await new Promise((resolve, reject) =>
    docker.modem.followProgress(stream, (err, out) => (err ? reject(err) : resolve(out)))
  )
  return tag
}

// Run a challenge container on the lab network.
//  caps:        extra Linux capabilities to ADD on top of the dropped-all base
//               (guard rooms need CHOWN/SETUID/... ; escalation rooms need sudo)
//  noNewPriv:   keep no-new-privileges (default true). Escalation rooms that
//               rely on a setuid sudo binary must set this false.
export async function runContainer({ image, name, env = [], caps = [], noNewPriv = true }) {
  const securityOpt = noNewPriv ? ['no-new-privileges'] : []
  const container = await docker.createContainer({
    Image: image,
    name,
    Env: env,
    Tty: false,
    HostConfig: {
      NetworkMode: LAB_NET,
      Memory: memBytes(MEM),
      NanoCpus: Math.round(CPU * 1e9),
      PidsLimit: 128,
      CapDrop: ['ALL'],
      CapAdd: caps,
      SecurityOpt: securityOpt,
      RestartPolicy: { Name: 'no' },
    },
  })
  await container.start()
  return container.id
}

// The capstone target: ONE shared, admin-spawned box the whole class attacks
// from their own Kali VMs. Unlike challenge rooms it publishes host ports (so
// it is reachable from outside) and runs with Docker's DEFAULT capabilities and
// no-new-privileges OFF — it is MEANT to be rooted via a sudo misconfig, so it
// needs real sshd/sudo. It is therefore deliberately vulnerable and exposed:
// run it only on an isolated host, never beside secrets or the database.
const CAP_WEB = process.env.CAPSTONE_WEB_PORT || '8088'
const CAP_SSH = process.env.CAPSTONE_SSH_PORT || '2222'
export async function startCapstone() {
  const name = 'bk_capstone'
  await stopContainer(name)
  const image = 'breachkeep/capstone-gauntlet:latest'
  try {
    await docker.getImage(image).inspect()
  } catch {
    console.log('[provisioner] building capstone image...')
    await buildImage('capstone', 'capstone-gauntlet', image)
  }
  const container = await docker.createContainer({
    Image: image,
    name,
    Env: [`CAPSTONE_FLAG=${process.env.CAPSTONE_FLAG || 'BK{dev-capstone-root-flag}'}`],
    Tty: false,
    ExposedPorts: { '80/tcp': {}, '22/tcp': {} },
    HostConfig: {
      NetworkMode: 'bridge',
      Memory: memBytes(process.env.CAPSTONE_MEM || '512m'),
      NanoCpus: Math.round(parseFloat(process.env.CAPSTONE_CPU || '1.0') * 1e9),
      PidsLimit: 256,
      PortBindings: {
        '80/tcp': [{ HostPort: String(CAP_WEB) }],
        '22/tcp': [{ HostPort: String(CAP_SSH) }],
      },
      RestartPolicy: { Name: 'unless-stopped' },
      // default caps, no-new-privileges off: a rootable box by design.
    },
  })
  await container.start()
  return container.id
}
export async function stopCapstone() { await stopContainer('bk_capstone') }

export async function stopContainer(name) {
  try {
    const c = docker.getContainer(name)
    await c.stop({ t: 2 }).catch(() => {})
    await c.remove({ force: true }).catch(() => {})
  } catch {}
}

export async function removeImage(tag) {
  try { await docker.getImage(tag).remove({ force: true }) } catch {}
}

export async function listByLabelPrefix(prefix) {
  const all = await docker.listContainers({ all: true })
  return all.filter((c) => (c.Names || []).some((n) => n.includes(prefix)))
}

export { docker }
