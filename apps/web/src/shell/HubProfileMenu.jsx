import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext.jsx'
import './styles/hub-profile.css'

const HOUSE_LABEL = {
  arcweave: 'Arcweave',
  emberkeep: 'Emberkeep',
  rimeguard: 'Rimeguard',
  voltgrid: 'Voltgrid',
}

/**
 * Themed profile medallion for the house hub. Sits top-right above the
 * fortress scene and carries everything the old fixed header used to:
 * account settings, the introduction module and log out.
 */
export default function HubProfileMenu({ user }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const name = user?.username || 'Initiate'
  const initial = name[0].toUpperCase()
  const house = (user?.house || '').toLowerCase()

  const go = (path) => { setOpen(false); nav(path) }

  const onLogout = async () => {
    setOpen(false)
    try { await logout() } finally { nav('/enter', { replace: true }) }
  }

  return (
    <div className="hub-profile" ref={ref} data-house={house || undefined}>
      <button
        type="button"
        className={`hub-profile-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile and account menu"
      >
        <span className="hub-profile-ring" aria-hidden="true" />
        <span className="hub-profile-face">
          {user?.avatar
            ? <img src={user.avatar} alt="" />
            : <img src="/assets/avatar_icon.webp" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
          {!user?.avatar && <span className="hub-profile-initial">{initial}</span>}
        </span>
      </button>

      {open && (
        <div className="hub-profile-menu" role="menu">
          <div className="hub-profile-head">
            <div className="hub-profile-name">{name}</div>
            {user?.email && <div className="hub-profile-email">{user.email}</div>}
            <span className="hub-profile-house">
              {HOUSE_LABEL[house] || 'Unsorted'}
            </span>
          </div>

          <button type="button" role="menuitem" className="hub-profile-item" onClick={() => go('/account')}>
            <span className="hub-profile-item-ico" aria-hidden="true">◈</span>
            Account &amp; Settings
          </button>
          <button type="button" role="menuitem" className="hub-profile-item" onClick={() => go('/dashboard/introduction')}>
            <span className="hub-profile-item-ico" aria-hidden="true">✦</span>
            Introduction Trials
          </button>

          <div className="hub-profile-rule" />

          <button type="button" role="menuitem" className="hub-profile-item is-danger" onClick={onLogout}>
            <span className="hub-profile-item-ico" aria-hidden="true">⏻</span>
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
