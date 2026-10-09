// Flag format diversification registry for BreachKeep
// Provides distinct (prefix, open, close) formats across challenge rooms
// and ensures decoy flags never reuse a room's assigned format.

export const FLAG_FORMATS = [
  { prefix: 'BK', open: '{', close: '}' },
  { prefix: 'KEEP', open: '[', close: ']' },
  { prefix: 'VAULT', open: '<', close: '>' },
  { prefix: 'FLAG', open: '((', close: '))' },
  { prefix: 'ARCHIVE', open: '::', close: '::' },
  { prefix: 'RUNE', open: '/', close: '/' },
  { prefix: 'SEAL', open: '|', close: '|' },
  { prefix: 'KEY', open: '~', close: '~' },
  { prefix: 'WARD', open: '[[', close: ']]' },
  { prefix: 'CIPHER', open: '<<', close: '>>' },
]

const INTRO_ROOMS = [
  'build-tool', 'hidden-page', 'guestbook', 'coffee-shop-wifi',
  'encoded-memo', 'support-form', 'somebodys-invoice',
  'dotdotdot-folder', 'phone-call',
]

export function getFormatIndex(roomId) {
  // Explicit override: capstone-gauntlet root flag must never resolve to BK{} (index 0)
  // and is assigned WARD[[...]] (index 8).
  if (roomId === 'capstone-gauntlet') return 8
  if (INTRO_ROOMS.includes(roomId)) return 0
  let hash = 0
  const str = String(roomId || '')
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  let idx = Math.abs(hash) % FLAG_FORMATS.length
  // Reserve index 8 exclusively for capstone-gauntlet
  if (idx === 8) idx = 1
  return idx
}

export function formatFor(roomId) {
  if (roomId === 'capstone-gauntlet') {
    return { ...FLAG_FORMATS[8], index: 8 }
  }
  const index = getFormatIndex(roomId)
  return { ...FLAG_FORMATS[index], index }
}

export function wrapFlag(inner, format) {
  const f = typeof format === 'string' ? formatFor(format) : format
  return `${f.prefix}${f.open}${inner}${f.close}`
}

// Return `count` distinct formats from the pool excluding the room's assigned format
// and ensuring capstone decoys never use index 0 (BK{}) or index 8 (WARD[[]]).
export function getDecoyFormats(roomId, count = 3) {
  const assignedIndex = getFormatIndex(roomId)
  const available = FLAG_FORMATS.map((fmt, index) => ({ ...fmt, index })).filter(
    (fmt) => fmt.index !== assignedIndex && (roomId !== 'capstone-gauntlet' || fmt.index !== 0)
  )
  const decoys = []
  for (let i = 0; i < count && i < available.length; i++) {
    // Deterministic offset based on assignedIndex
    const pick = (assignedIndex + 1 + i) % available.length
    decoys.push(available[pick])
  }
  return decoys
}

// Parse any recognized format from a submitted string
export function parseFlag(submitted) {
  const s = String(submitted || '').trim()
  if (!s) return null

  for (const fmt of FLAG_FORMATS) {
    if (s.startsWith(fmt.prefix + fmt.open) && s.endsWith(fmt.close)) {
      const startLen = fmt.prefix.length + fmt.open.length
      const endLen = fmt.close.length
      const inner = s.slice(startLen, s.length - endLen)
      return { format: fmt, inner }
    }
  }
  return null
}
