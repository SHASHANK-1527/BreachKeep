import { useEffect, useState } from 'react'

// Watches the Warden's kill switch.
//
// Two ways this fires:
//   1. On mount (and every 30s) we poll the public /api/status endpoint.
//   2. api.js broadcasts 'bk:maintenance' the moment any request comes back 503,
//      so a student who is already deep inside the app gets flipped to the
//      maintenance page on their very next action instead of seeing errors.
//
// Pass skip = true on the admin route: the Warden must still be able to reach
// the panel and switch the site back on.

const BASE = import.meta.env.VITE_API_BASE || '/api'

export default function useMaintenance(skip = false) {
  const [state, setState] = useState({ checked: false, maintenance: false, message: '', eta: '' })

  useEffect(() => {
    if (skip) {
      setState({ checked: true, maintenance: false, message: '', eta: '' })
      return
    }
    let alive = true

    const poll = async () => {
      try {
        const res = await fetch(`${BASE}/status`, { credentials: 'include', cache: 'no-store' })
        const data = await res.json()
        if (!alive) return
        setState({
          checked: true,
          maintenance: !!data.maintenance,
          message: data.message || '',
          eta: data.eta || '',
        })
      } catch {
        // Status endpoint unreachable — let the app render and fail normally
        // rather than showing a maintenance page for a network blip.
        if (alive) setState((s) => ({ ...s, checked: true }))
      }
    }

    const onSignal = (e) => {
      if (!alive) return
      setState({
        checked: true,
        maintenance: true,
        message: e.detail?.message || '',
        eta: e.detail?.eta || '',
      })
    }

    poll()
    const id = setInterval(poll, 30000)
    window.addEventListener('bk:maintenance', onSignal)
    return () => {
      alive = false
      clearInterval(id)
      window.removeEventListener('bk:maintenance', onSignal)
    }
  }, [skip])

  return state
}
