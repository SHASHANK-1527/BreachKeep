import { useState } from 'react'
import { api } from '../app/api.js'
import ParticleField from '../sanctum/ParticleField.jsx'
import { useSfx } from '../sanctum/useSfx.js'

// Public landing. ONLY the access-code box + animations. No links to inner pages.
export default function Landing() {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const sfx = useSfx()

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const res = await api.post('/auth/verify-access-code', { code: code.trim() })
      sfx.warp()
      if (res.redirect) { window.location.assign(res.redirect); return }
      // gate cookie is set; the app bundle now serves /enter
      window.location.assign(res.next || '/enter')
    } catch (e2) {
      setErr(e2.data?.error || 'Invalid access code')
      setShowResend(true)
      sfx.rattle()
    } finally { setBusy(false) }
  }

  return (
    <div className="sn-landing">
      <ParticleField mode="portal" />
      <form className={`sn-code-card ${err ? 'sn-shake' : ''}`} onSubmit={submit}>
        <h1 className="sn-title">BreachKeep</h1>
        <p className="sn-sub">Enter your access code to approach the keep.</p>
        <input
          className="sn-code-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ACCESS CODE"
          autoFocus
          aria-label="Access code"
        />
        {err && <div className="sn-error">{err}</div>}
        <button className="sn-enter-btn" disabled={busy}>{busy ? '…' : 'Enter'}</button>
        {showResend && <ResendDaily />}
      </form>
    </div>
  )
}

function ResendDaily() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const send = async () => {
    try { await api.post('/access/resend-daily', { email }) } catch {}
    setSent(true) // always show the same message (no account enumeration)
  }
  return (
    <div className="sn-resend">
      {sent ? (
        <span className="sn-resend-ok">If that email has an account, today's code is on its way.</span>
      ) : (
        <>
          <input className="sn-resend-input" placeholder="lost today's code? email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="button" className="sn-resend-btn" onClick={send}>Resend</button>
        </>
      )}
    </div>
  )
}
