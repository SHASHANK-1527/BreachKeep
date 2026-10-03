import React, { createContext, useContext, useState, useCallback } from 'react'

export const CASTLE_THEMES = {
  rimeguard: {
    name: 'House Rimeguard',
    citadelTitle: 'THE FROZEN CITADEL',
    gatesTitle: 'THE FROST GATEHALL',
    subtitle: 'REALM OF PERMAFROST',
    video: '/rimeguard transistion.mp4',
    gatesImage: '/rimeguard_hall_view_closed.png',
    accentColor: '#6fd6ff',
    glowColor: 'rgba(111, 214, 255, 0.45)',
  },
  emberkeep: {
    name: 'House Emberkeep',
    citadelTitle: 'THE FORGE CITADEL',
    gatesTitle: 'THE GREAT FORGE GATES',
    subtitle: 'REALM OF FURNACE & ANVIL',
    video: '/emberkeep_forge_citadel_to_ember_gate.mp4',
    gatesImage: '/ember_gate.jpg',
    accentColor: '#ff5a1f',
    glowColor: 'rgba(255, 90, 31, 0.45)',
  },
  arcweave: {
    name: 'House Arcweave',
    citadelTitle: 'THE LIGHTNING CITADEL',
    gatesTitle: 'THE ARCANUM GATES',
    subtitle: 'REALM OF PLASMA ARCANA',
    video: '/Camera_transitioning_through_arcweave.mp4',
    gatesImage: '/arcweave gates.jpg',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
  },
  voltgrid: {
    name: 'House Voltgrid',
    citadelTitle: 'HIGH-VOLTAGE CITADEL',
    gatesTitle: 'THE ELECTRIC GRID GATES',
    subtitle: 'REALM OF THE ELECTRIC GRID',
    video: '/voltgrid_to_voltgrid_gate.mp4',
    gatesImage: '/voltgrid_gates.jpg',
    accentColor: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.45)',
  },
}

const CastleContext = createContext(null)

export function CastleProvider({ children }) {
  // 'citadel' = outer fortress view; 'gates' = inner gates view after transition
  const [castleView, setCastleViewState] = useState(() => {
    return sessionStorage.getItem('bk_castle_view') || 'citadel'
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeHouse, setActiveHouse] = useState(null)

  const setCastleView = useCallback((view) => {
    const next = view === 'gates' ? 'gates' : 'citadel'
    setCastleViewState(next)
    sessionStorage.setItem('bk_castle_view', next)
  }, [])

  const startTransition = useCallback((houseName) => {
    if (houseName) {
      setActiveHouse(houseName.toLowerCase().trim())
    }
    setIsTransitioning(true)
  }, [])

  const endTransition = useCallback(() => {
    setIsTransitioning(false)
    setCastleView('gates')
  }, [setCastleView])

  const skipTransition = useCallback(() => {
    setIsTransitioning(false)
    setCastleView('gates')
  }, [setCastleView])

  return (
    <CastleContext.Provider
      value={{
        castleView,
        setCastleView,
        isTransitioning,
        activeHouse,
        setActiveHouse,
        startTransition,
        endTransition,
        skipTransition,
      }}
    >
      {children}
    </CastleContext.Provider>
  )
}

export function useCastle() {
  const ctx = useContext(CastleContext)
  return (
    ctx || {
      castleView: 'citadel',
      setCastleView: () => {},
      isTransitioning: false,
      activeHouse: null,
      setActiveHouse: () => {},
      startTransition: () => {},
      endTransition: () => {},
      skipTransition: () => {},
    }
  )
}
