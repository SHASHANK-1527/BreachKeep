// Reports intro-room completion to the server. The intro is a client-side teaser;
// completion is tracked server-side to gate house sorting (see spec 9.4).
import { api } from '../../app/api.js'
export async function reportComplete(roomId) {
  try { await api.post('/intro/complete', { roomId }) } catch {}
}
