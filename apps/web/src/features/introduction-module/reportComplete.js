// Reports intro-room completion to the server. The intro is a client-side teaser;
// completion is tracked server-side to gate house sorting (see spec 9.4).
import { api } from '../../app/api.js'

export function getCompletedRooms() {
  try {
    const raw = localStorage.getItem('bk_completed_intro_rooms')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function isRoomCompleted(roomId) {
  return getCompletedRooms().includes(roomId)
}

export async function reportComplete(roomId) {
  // 1. Immediate optimistic update locally
  try {
    const list = getCompletedRooms()
    if (!list.includes(roomId)) {
      list.push(roomId)
      localStorage.setItem('bk_completed_intro_rooms', JSON.stringify(list))
      window.dispatchEvent(new CustomEvent('bk:intro_room_completed', { detail: { roomId, rooms: list } }))
    }
  } catch {}

  // 2. Sync to server
  try {
    const res = await api.post('/intro/complete', { roomId })
    if (res?.introRooms && Array.isArray(res.introRooms)) {
      const merged = Array.from(new Set([...getCompletedRooms(), ...res.introRooms]))
      localStorage.setItem('bk_completed_intro_rooms', JSON.stringify(merged))
      window.dispatchEvent(new CustomEvent('bk:intro_room_completed', { detail: { roomId, rooms: merged } }))
    }
  } catch {}
}

