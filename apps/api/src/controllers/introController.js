import User from '../models/User.js'

// The nine introduction scenes, in quest-map order. Every one must be solved
// before introComplete flips and house sorting unlocks — keep this in sync with
// the routes in features/introduction-module/IntroductionModule.jsx.
export const INTRO_ROOMS = [
  'build-tool',
  'hidden-page',
  'guestbook',
  'coffee-shop-wifi',
  'encoded-memo',
  'support-form',
  'somebodys-invoice',
  'dotdotdot-folder',
  'phone-call',
]

// POST /api/intro/complete  (session)
export async function completeRoom(req, res) {
  const { roomId } = req.body
  if (!INTRO_ROOMS.includes(roomId)) return res.status(400).json({ error: 'Unknown room' })
  const u = req.user
  if (!u.introRooms.includes(roomId)) u.introRooms.push(roomId)
  if (INTRO_ROOMS.every((r) => u.introRooms.includes(r))) u.introComplete = true
  await u.save()
  return res.json({ introRooms: u.introRooms, introComplete: u.introComplete })
}

// GET /api/intro/status  (session)
export async function introStatus(req, res) {
  return res.json({ introRooms: req.user.introRooms, introComplete: req.user.introComplete })
}
