// All calls send cookies (session/gate) with credentials: 'include'.
const BASE = import.meta.env.VITE_API_BASE || '/api'

const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'

async function req(path, method = 'GET', body) {
  try {
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
  } catch (err) {
    if (isTestMode) {
      if (path === '/auth/verify-access-code') {
        return { ok: true, next: '/enter' }
      }
      if (path === '/auth/login' || path === '/auth/verify-session' || path === '/auth/signup' || path === '/auth/verify') {
        const mockUser = {
          id: 'tester-id-12345',
          username: 'Tester',
          email: body?.email || 'tester@example.com',
          house: 'rimeguard',
          role: 'user',
        }
        localStorage.setItem('bk_test_user', JSON.stringify(mockUser))
        return { ok: true, user: mockUser }
      }
      if (path === '/auth/me') {
        const saved = localStorage.getItem('bk_test_user')
        if (saved) {
          return { user: JSON.parse(saved) }
        }
      }
      if (path === '/auth/logout') {
        localStorage.removeItem('bk_test_user')
        return { ok: true }
      }
    }
    throw err
  }
}

export const api = {
  get: (p) => req(p),
  post: (p, b) => req(p, 'POST', b),
}
