// The Dungeon Hall: every house has its own hall artwork with the same six
// doors, and each door is one dungeon. Door 1 is the far left of the painting.
//
// Door rectangles are percentages of the 16:9 hall image (2560x1440). The hall
// renders the image in a "cover" box that keeps that aspect ratio, so these
// numbers stay glued to the painted doors at any screen size.
import { getDungeon } from '../index.js'

export const DOOR_ORDER = [
  'terminal-1',
  'terminal-2',
  'network',
  'web',
  'secure-coding',
  'capstone',
]

export const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI']

// Short subject line shown under each door's name.
const SUBJECT = {
  'terminal-1': 'Linux I',
  'terminal-2': 'Linux II',
  network: 'Networking',
  web: 'Web Exploitation',
  'secure-coding': 'Secure Coding',
  capstone: 'Capstone',
}

const CAPSTONE = {
  id: 'capstone',
  title: 'The Gauntlet',
  blurb:
    'One live target, everyone together, on the day. Recon, the web, the shell, privilege — bring back root.',
  rooms: [],
}

export function dungeonMeta(id) {
  const d = id === 'capstone' ? CAPSTONE : getDungeon(id)
  return {
    id,
    title: d?.title || id,
    blurb: d?.blurb || '',
    subject: SUBJECT[id] || id,
    rooms: d?.rooms || [],
  }
}

export const HALLS = {
  emberkeep: {
    name: 'House Emberkeep',
    hallName: 'The Forge Hall',
    rune: '🔥',
    accent: '#ff5a1f',
    glow: 'rgba(255, 90, 31, 0.55)',
    hallImg: '/emberkeep_hall.webp',
    video: '/emberkeep_to_hall.mp4',
    doors: [
      { left: 3.1, top: 19.4, width: 6.6, height: 45.8 },
      { left: 23.8, top: 31.9, width: 6.3, height: 32.6 },
      { left: 41.6, top: 38.6, width: 5.4, height: 25.4 },
      { left: 52.9, top: 38.6, width: 5.4, height: 25.4 },
      { left: 69.8, top: 31.9, width: 5.7, height: 32.6 },
      { left: 89.8, top: 19.4, width: 6.6, height: 45.8 },
    ],
  },
  arcweave: {
    name: 'House Arcweave',
    hallName: 'The Arcanum Hall',
    rune: '⚡',
    accent: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.55)',
    hallImg: '/arcweave_hall.webp',
    video: '/arcweave_to_hall.mp4',
    doors: [
      { left: 7.4, top: 36.1, width: 7.0, height: 25.7 },
      { left: 24.2, top: 36.8, width: 6.3, height: 25.0 },
      { left: 37.3, top: 38.9, width: 5.8, height: 22.9 },
      { left: 57.0, top: 38.9, width: 5.9, height: 22.9 },
      { left: 69.5, top: 36.8, width: 6.3, height: 25.0 },
      { left: 85.5, top: 36.1, width: 7.0, height: 25.7 },
    ],
  },
  voltgrid: {
    name: 'House Voltgrid',
    hallName: 'The Grid Hall',
    rune: '💠',
    accent: '#00e5ff',
    glow: 'rgba(0, 229, 255, 0.55)',
    hallImg: '/voltgrid_hall.webp',
    video: '/voltgrid_to_hall.mp4',
    doors: [
      { left: 6.6, top: 38.9, width: 5.9, height: 26.4 },
      { left: 23.8, top: 44.4, width: 5.2, height: 20.1 },
      { left: 39.1, top: 45.8, width: 4.7, height: 18.3 },
      { left: 56.1, top: 45.8, width: 4.7, height: 18.3 },
      { left: 70.9, top: 44.4, width: 5.0, height: 20.1 },
      { left: 87.3, top: 38.9, width: 6.0, height: 26.4 },
    ],
  },
  rimeguard: {
    name: 'House Rimeguard',
    hallName: 'The Frost Hall',
    rune: '❄',
    accent: '#6fd6ff',
    glow: 'rgba(111, 214, 255, 0.55)',
    hallImg: '/rimeguard_hall.webp',
    video: '/rimeguard_to_hall.mp4',
    doors: [
      { left: 7.4, top: 32.6, width: 8.6, height: 29.4 },
      { left: 27.3, top: 36.8, width: 7.4, height: 24.3 },
      { left: 40.4, top: 37.5, width: 7.1, height: 23.6 },
      { left: 52.3, top: 37.5, width: 7.0, height: 23.6 },
      { left: 65.1, top: 36.8, width: 7.2, height: 24.3 },
      { left: 84.0, top: 32.6, width: 8.6, height: 29.4 },
    ],
  },
}

export function hallFor(house) {
  return HALLS[(house || '').toLowerCase().trim()] || HALLS.rimeguard
}

// Is this door open for students right now? Five dungeons follow the admin's
// "live" switch (/progress -> unlocked); the capstone follows its own arming
// switch (/labs/capstone -> armed).
export function doorState(id, { unlocked = [], solved = [], capstoneArmed = false } = {}) {
  const meta = dungeonMeta(id)
  const open = id === 'capstone' ? capstoneArmed || unlocked.includes(id) : unlocked.includes(id)
  const total = meta.rooms.length
  const cleared = meta.rooms.filter((r) => solved.includes(r.id)).length
  return { open, total, cleared, conquered: total > 0 && cleared === total }
}
