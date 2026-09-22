import { useEffect, useRef } from 'react'

// Ported from niket app.js triggerPortalWarp/completePortalWarp + #portalVideo.
// Put a compressed WebM at web/public/portal.webm (from niket "Video Project.mp4").
export default function PortalWarp({ onDone }) {
  const v = useRef(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { onDone?.(); return }
    const el = v.current
    const finish = () => onDone?.()
    el?.play?.().catch(finish)
    el?.addEventListener('ended', finish)
    const safety = setTimeout(finish, 4000) // never hang if the video stalls
    return () => { clearTimeout(safety); el?.removeEventListener('ended', finish) }
  }, [onDone])
  return (
    <div className="sn-warp">
      <video ref={v} className="sn-warp-video" src="/portal.webm" muted playsInline />
      <div className="sn-warp-flash" />
    </div>
  )
}
