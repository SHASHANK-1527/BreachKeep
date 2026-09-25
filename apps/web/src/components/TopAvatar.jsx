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
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="bk-top-avatar"
        onClick={() => setOpen(!open)}
        title={user?.username || 'User Profile'}
        aria-label="User Profile"
      >
        <img src="/assets/avatar_icon.png" alt="Dragon crest avatar" />
      </button>

      {open && (
        <div className="bk-avatar-menu">
          <div className="bk-avatar-menu-name">{user?.username || 'Initiate'}</div>
          <div className="bk-avatar-menu-sub">
            House: {user?.house ? user.house.toUpperCase() : 'Unsorted'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className="bk-avatar-menu-btn"
              style={{ background: 'rgba(212, 175, 55, 0.2)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#ffdca8' }}
              onClick={() => { setOpen(false); nav('/dashboard'); }}
            >
              Sanctum Hub
            </button>
            <button
              type="button"
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
