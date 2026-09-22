import Docker from 'dockerode'

const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' })

const CPU = parseFloat(process.env.CONTAINER_CPU || '0.5')
const MEM = process.env.CONTAINER_MEM || '256m'

function memBytes(s) {
  const m = /^(\d+)(m|g)?$/i.exec(s)
  if (!m) return 256 * 1024 * 1024
  const n = parseInt(m[1], 10)
  return m[2]?.toLowerCase() === 'g' ? n * 1024 ** 3 : n * 1024 ** 2
}

export async function buildImage(context, tag) {
  // context is a path under /labs mounted into the provisioner container
  const stream = await docker.buildImage({ context: `/labs/${context}`, src: ['.'] }, { t: tag })
  await new Promise((resolve, reject) =>
    docker.modem.followProgress(stream, (err, out) => (err ? reject(err) : resolve(out)))
  )
  return tag
}

export async function runContainer({ image, name, env = [], network }) {
  const container = await docker.createContainer({
    Image: image,
    name,
    Env: env,
    Tty: false,
    HostConfig: {
      NetworkMode: network || 'bridge',
      Memory: memBytes(MEM),
      NanoCpus: Math.round(CPU * 1e9),
      PidsLimit: 128,
      CapDrop: ['ALL'],
      SecurityOpt: ['no-new-privileges'],
      RestartPolicy: { Name: 'no' },
    },
  })
  await container.start()
  return container.id
}

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
