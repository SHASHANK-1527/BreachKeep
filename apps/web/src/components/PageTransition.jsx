import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import '../styles/page-transitions.css'

export default function PageTransition({ children }) {
  const location = useLocation()
  const [settled, setSettled] = useState(false)

  // Reset settled state on path change so the new page animates smoothly
  useEffect(() => {
    setSettled(false)
  }, [location.pathname])

  return (
    <>
      {/* Transient gate travel veil & ambient energy beam overlay */}
      <div key={location.pathname + '-veil'} className="bk-travel-veil" aria-hidden="true">
        <div className="bk-travel-veil-mist" />
        <div className="bk-travel-beam" />
      </div>

      {/* Main page content container */}
      <div
        key={location.pathname}
        className={`bk-page-travel-container ${settled ? 'bk-page-travel-settled' : ''}`}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) {
            setSettled(true)
          }
        }}
      >
        {children}
      </div>
    </>
  )
}
