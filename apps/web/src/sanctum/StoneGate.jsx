// Ported from niket dashboard.html stone-arch + door SVG (ids stoneArchShape,
// doorLeafShape, gateLockSeal) and keyframes gateDescent/lockSealClank/unlockBurst.
// status: 'locked' | 'unlocking' | 'open'
export default function StoneGate({ status = 'locked', onOpen }) {
  return (
    <svg className={`sn-stone-gate sn-gate-${status}`} viewBox="0 0 120 160" onAnimationEnd={status === 'unlocking' ? onOpen : undefined} aria-hidden="true">
      <path className="sn-arch" d="M20 150 V60 a40 40 0 0 1 80 0 V150 Z" />
      <rect className="sn-door-leaf sn-door-left" x="22" y="70" width="37" height="78" />
      <rect className="sn-door-leaf sn-door-right" x="61" y="70" width="37" height="78" />
      <circle className="sn-lock-seal" cx="60" cy="110" r="10" />
    </svg>
  )
}
