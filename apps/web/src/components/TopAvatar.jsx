import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext.jsx'

export default function TopAvatar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="bk-top-avatar"
        onClick={() => setOpen(!open)}
        title={user?.username || 'User Profile'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User Profile"
      >
        <img src="/assets/avatar_icon.webp" alt="Dragon crest avatar" />
      </button>

      {open && (
        <div className="bk-avatar-menu" role="menu">
          <div className="bk-avatar-menu-name">{user?.username || 'Initiate'}</div>
          {user?.email && (
            <div style={{ fontSize: '0.78rem', color: 'rgba(255, 220, 168, 0.6)', marginBottom: 2, wordBreak: 'break-all' }}>
              {user.email}
            </div>
          )}
          <div className="bk-avatar-menu-sub">
            House: {user?.house ? user.house.toUpperCase() : 'Unsorted'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              role="menuitem"
              className="bk-avatar-menu-btn"
              style={{ background: 'rgba(212, 175, 55, 0.2)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#ffdca8' }}
              onClick={() => { setOpen(false); nav('/dashboard'); }}
            >
              Sanctum Hub
            </button>
            <button
              type="button"
              role="menuitem"
              className="bk-avatar-menu-btn"
              style={{ background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#ffdca8' }}
              onClick={() => { setOpen(false); nav('/account'); }}
            >
              Account Settings
            </button>
            <button
              type="button"
              role="menuitem"
              className="bk-avatar-menu-btn"
              onClick={() => { setOpen(false); logout(); nav('/enter'); }}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
