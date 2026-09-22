import { useMemo } from 'react'

// Ported from niket app.js SoundFX + dashboard.js DashboardSFX. Web Audio beeps,
// respects a localStorage mute flag. No external audio files needed.
export function useSfx() {
  return useMemo(() => {
    const muted = () => localStorage.getItem('bk_muted') === '1'
    let ctx
    const tone = (freq, dur = 0.12, type = 'sine', gain = 0.05) => {
      if (muted()) return
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.type = type; o.frequency.value = freq
        g.gain.value = gain
        o.connect(g); g.connect(ctx.destination)
        o.start(); o.stop(ctx.currentTime + dur)
      } catch {}
    }
    return {
      click: () => tone(440, 0.05, 'square'),
      warp: () => tone(120, 0.4, 'sawtooth', 0.04),
      gateOpen: () => tone(220, 0.5, 'sine'),
      chime: () => { tone(660); setTimeout(() => tone(880), 120); setTimeout(() => tone(1100), 240) },
      reveal: () => tone(330, 0.3),
      rattle: () => tone(90, 0.15, 'square', 0.06),
      toggleMute: () => localStorage.setItem('bk_muted', muted() ? '0' : '1'),
    }
  }, [])
}
