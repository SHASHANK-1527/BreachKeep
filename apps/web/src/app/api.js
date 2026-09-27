// All calls send cookies (session/gate) with credentials: 'include'.
const BASE = import.meta.env.VITE_API_BASE || '/api'

// Thrown for every non-2xx response. `status` lets callers tell the three cases
// apart that used to look identical: 401 (session gone), 403 (access gate), and
// anything else (a real failure). Everything used to surface as "HTTP 404".
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
  get isAuth() { return this.status === 401 }
  get isGate() { return this.status === 403 && this.data?.error === 'gate_required' }
}

async function req(path, method = 'GET', body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (networkErr) {
    // Offline / DNS / TLS. status 0 means "we never got an answer", which is
    // NOT the same as an authentication failure and must never log anyone out.
    throw new ApiError('Network error — could not reach the Keep', 0, null)
  }

  let data = null
  try { data = await res.json() } catch {}

  // The Warden's kill switch. Any 503 from a student route means the site has
  // just been closed — tell the app so it can swap in the maintenance page
  // instead of surfacing a wall of failed requests.
  if (res.status === 503 && data?.error === 'maintenance') {
    window.dispatchEvent(new CustomEvent('bk:maintenance', {
      detail: { message: data.message || '', eta: data.eta || '' },
    }))
  }

  if (!res.ok) throw new ApiError(data?.error || `HTTP ${res.status}`, res.status, data)
  return data
}

export const api = {
  get: (p) => req(p),
  post: (p, b) => req(p, 'POST', b),
}
