import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from './api.js'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try { const { user } = await api.get('/auth/me'); setUser(user) }
    catch { setUser(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const logout = async () => { await api.post('/auth/logout'); setUser(null) }

  return <AuthCtx.Provider value={{ user, setUser, loading, refresh, logout }}>{children}</AuthCtx.Provider>
}
