import { createContext, useContext, useEffect, useState } from 'react'
// The gate cookie is httpOnly, so JS can't read it directly. We infer gate state
// from whether the app bundle was served at all (it isn't served without the cookie)
// plus the result of /auth/me. For routing we treat "app bundle loaded" as gated.
const GateCtx = createContext({ gated: true })
export const useGate = () => useContext(GateCtx)
export function GateProvider({ children }) {
  const [gated] = useState(true) // if this bundle is running, nginx already checked the gate
  return <GateCtx.Provider value={{ gated }}>{children}</GateCtx.Provider>
}
