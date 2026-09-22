// All calls send cookies (session/gate) with credentials: 'include'.
const BASE = import.meta.env.VITE_API_BASE || '/api'

async function req(path, method = 'GET', body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) throw Object.assign(new Error(data?.error || `HTTP ${res.status}`), { status: res.status, data })
  return data
}

export const api = {
  get: (p) => req(p),
  post: (p, b) => req(p, 'POST', b),
}
