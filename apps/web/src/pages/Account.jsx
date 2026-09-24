import { useState } from 'react'
import { api } from '../app/api.js'
import { useAuth } from '../app/AuthContext.jsx'

// Ported from dungeon-hub AccountSettings, but every call uses the session cookie;
// the server derives identity from req.user, so no email is ever sent in the body.
export default function Account() {
  const { user, setUser, logout } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [msg, setMsg] = useState('')

  const saveName = async () => {
    try { const { user } = await api.post('/auth/update-username', { username }); setUser(user); setMsg('Saved') }
    catch (e) { setMsg(e.data?.error || 'Failed') }
  }

  return (
    <div className="bk-account" data-house={user?.house || undefined}>
      <h1>Account</h1>
      <label>Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <button className="sn-ghost-btn" onClick={logout}>Log out</button>
      <button onClick={saveName}>Save</button>
      {msg && <span className="bk-msg">{msg}</span>}
      <hr />
      <p>Email: {user?.email}</p>
      <p>House: {user?.house || 'not yet sorted'}</p>
      <button className="sn-ghost-btn" onClick={logout}>Log out</button>
    </div>
  )
}
