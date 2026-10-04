import { useEffect, useState } from 'react'

// Shown to every student while the Warden's kill switch is on. It polls
// /api/status and reloads itself the moment the Keep reopens, so nobody has to
// be told to refresh.

const T = {
  bg: '#0a0403',
  panel: 'rgba(22,8,6,0.82)',
  border: 'rgba(255,122,0,0.22)',
  text: '#e9d9d1',
  dim: 'rgba(233,217,209,0.55)',
  accent: '#ff5a1f',
  cream: '#ffdca8',
}

const BASE = import.meta.env.VITE_API_BASE || '/api'

function Portcullis() {
  // A sealed gate: bars dropped, ember light behind them.
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true" style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <radialGradient id="bk-mt-glow" cx="50%" cy="62%" r="52%">
          <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ff5a1f" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bk-mt-bar" gradientUnits="userSpaceOnUse" x1="0" y1="24" x2="0" y2="126">
          <stop offset="0%" stopColor="#ffdca8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      <circle cx="66" cy="72" r="58" fill="url(#bk-mt-glow)" className="bk-mt-breathe" />

      {/* archway */}
      <path
        d="M24 122V56a42 42 0 0 1 84 0v66"
        fill="none"
        stroke="url(#bk-mt-bar)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* vertical bars */}
      {[38, 52, 66, 80, 94].map((x) => (
        <line key={x} x1={x} y1={x === 66 ? 30 : x === 52 || x === 80 ? 36 : 50} x2={x} y2="122"
          stroke="url(#bk-mt-bar)" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      ))}
      {/* horizontal cross-members */}
      {[62, 86, 110].map((y) => (
        <line key={y} x1="27" y1={y} x2="105" y2={y} stroke="url(#bk-mt-bar)" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      ))}
      {/* ground */}
      <line x1="14" y1="122" x2="118" y2="122" stroke="#ff5a1f" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

export default function Maintenance({ message = '', eta = '' }) {
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState(null)

  const check = async ({ manual = false } = {}) => {
    if (manual) setChecking(true)
    try {
      const res = await fetch(`${BASE}/status`, { credentials: 'include', cache: 'no-store' })
      const data = await res.json()
      if (!data.maintenance) {
        window.location.reload()
        return
      }
    } catch {
      /* the API itself may be down — keep waiting */
    } finally {
      setLastCheck(new Date())
      if (manual) setChecking(false)
    }
  }

  useEffect(() => {
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(1100px 620px at 50% 8%, rgba(255,90,31,0.10), transparent 70%),
        linear-gradient(180deg, #120705 0%, ${T.bg} 55%, #060302 100%)`,
      color: T.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'grid',
      placeItems: 'center',
      padding: '2rem 1rem',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes bk-mt-breathe { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        .bk-mt-breathe { animation: bk-mt-breathe 4.5s ease-in-out infinite; transform-origin: center }
        @keyframes bk-mt-rise {
          from { opacity: 0; transform: translateY(14px) }
          to   { opacity: 1; transform: none }
        }
        .bk-mt-card { animation: bk-mt-rise 700ms cubic-bezier(.2,.7,.3,1) both }
        @keyframes bk-mt-ember {
          0%   { transform: translateY(0) scale(1); opacity: 0 }
          12%  { opacity: .7 }
          100% { transform: translateY(-78vh) scale(.5); opacity: 0 }
        }
        .bk-mt-ember {
          position: absolute; bottom: -12px; width: 3px; height: 3px; border-radius: 50%;
          background: #ff7a2f; box-shadow: 0 0 7px 2px rgba(255,122,47,.55);
          animation: bk-mt-ember linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .bk-mt-breathe, .bk-mt-card, .bk-mt-ember { animation: none !important }
          .bk-mt-ember { display: none }
        }
      `}</style>

      {/* drifting embers */}
      {[8, 21, 34, 47, 59, 72, 86, 93].map((left, i) => (
        <span
          key={left}
          className="bk-mt-ember"
          style={{ left: `${left}%`, animationDuration: `${11 + (i % 4) * 3.5}s`, animationDelay: `${i * 1.6}s` }}
        />
      ))}

      <div className="bk-mt-card" style={{
        width: '100%',
        maxWidth: 560,
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        padding: 'clamp(1.75rem, 5vw, 2.75rem)',
        boxShadow: '0 30px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,168,0.06)',
        backdropFilter: 'blur(6px)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
      }}>
        <Portcullis />

        <div style={{
          marginTop: '1.25rem',
          fontSize: '0.68rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: T.accent,
          fontWeight: 700,
        }}>
          BreachKeep
        </div>

        <h1 style={{
          fontFamily: "'Cinzel Decorative', 'Cinzel', Georgia, serif",
          fontSize: 'clamp(1.7rem, 6vw, 2.4rem)',
          lineHeight: 1.15,
          margin: '0.55rem 0 0',
          color: T.cream,
          textShadow: '0 0 28px rgba(255,90,31,0.35)',
        }}>
          The Keep is sealed
        </h1>

        <p style={{
          color: T.dim,
          fontSize: '0.98rem',
          lineHeight: 1.65,
          margin: '1rem auto 0',
          maxWidth: '38ch',
        }}>
          {message
            ? message
            : 'The Warden has closed the gates while the next dungeons are forged. Your progress is safe — nothing has been lost.'}
        </p>

        {eta && (
          <div style={{
            marginTop: '1.4rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            padding: '0.4rem 0.95rem',
            fontSize: '0.82rem',
            color: T.cream,
            background: 'rgba(255,122,0,0.07)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            Gates reopen {eta}
          </div>
        )}

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.4rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => check({ manual: true })}
            disabled={checking}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: 999,
              border: `1px solid ${T.border}`,
              background: 'transparent',
              color: T.accent,
              fontFamily: 'inherit',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: checking ? 'default' : 'pointer',
              opacity: checking ? 0.6 : 1,
            }}
          >
            {checking ? 'Listening at the gate…' : 'Try the gate again'}
          </button>
          <span style={{ fontSize: '0.76rem', color: T.dim }}>
            Checking automatically every 30s
            {lastCheck && ` · last ${lastCheck.toLocaleTimeString()}`}
          </span>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '1.1rem',
        fontSize: '0.74rem',
        color: 'rgba(233,217,209,0.4)',
        letterSpacing: '0.04em',
        display: 'flex',
        gap: '1.2rem',
        alignItems: 'center',
      }}>
        <span>Cyber eLabs · BreachKeep</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <a
          href="/enter"
          style={{ color: T.dim, textDecoration: 'none', transition: 'color 150ms ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T.cream }}
          onMouseLeave={(e) => { e.currentTarget.style.color = T.dim }}
        >
          Staff / Tester Sign In →
        </a>
      </div>
    </div>
  )
}
