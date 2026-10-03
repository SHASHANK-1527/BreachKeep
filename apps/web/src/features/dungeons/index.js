// Registry of dungeons that have frontend content built. Dungeon.jsx looks a
// dungeonId up here; anything not present falls back to the "coming soon" stub.
import {
  DUNGEON_ID as T1_ID,
  DUNGEON_TITLE as T1_TITLE,
  DUNGEON_BLURB as T1_BLURB,
  ROOMS as T1_ROOMS,
  ROOM_BY_ID as T1_BY_ID,
  TIERS as T1_TIERS,
} from './terminal-1/rooms.js'
import {
  DUNGEON_ID as T2_ID,
  DUNGEON_TITLE as T2_TITLE,
  DUNGEON_BLURB as T2_BLURB,
  ROOMS as T2_ROOMS,
  ROOM_BY_ID as T2_BY_ID,
  TIERS as T2_TIERS,
} from './terminal-2/rooms.js'
import {
  DUNGEON_ID as NET_ID,
  DUNGEON_TITLE as NET_TITLE,
  DUNGEON_BLURB as NET_BLURB,
  ROOMS as NET_ROOMS,
  ROOM_BY_ID as NET_BY_ID,
  TIERS as NET_TIERS,
} from './network/rooms.js'
import {
  DUNGEON_ID as WEB_ID,
  DUNGEON_TITLE as WEB_TITLE,
  DUNGEON_BLURB as WEB_BLURB,
  ROOMS as WEB_ROOMS,
  ROOM_BY_ID as WEB_BY_ID,
  TIERS as WEB_TIERS,
} from './web/rooms.js'
import {
  DUNGEON_ID as SC_ID,
  DUNGEON_TITLE as SC_TITLE,
  DUNGEON_BLURB as SC_BLURB,
  ROOMS as SC_ROOMS,
  ROOM_BY_ID as SC_BY_ID,
  TIERS as SC_TIERS,
} from './secure-coding/rooms.js'

export const DUNGEONS = {
  [T1_ID]: { id: T1_ID, title: T1_TITLE, blurb: T1_BLURB, rooms: T1_ROOMS, roomById: T1_BY_ID, tiers: T1_TIERS },
  [T2_ID]: { id: T2_ID, title: T2_TITLE, blurb: T2_BLURB, rooms: T2_ROOMS, roomById: T2_BY_ID, tiers: T2_TIERS },
  [NET_ID]: { id: NET_ID, title: NET_TITLE, blurb: NET_BLURB, rooms: NET_ROOMS, roomById: NET_BY_ID, tiers: NET_TIERS },
  [WEB_ID]: { id: WEB_ID, title: WEB_TITLE, blurb: WEB_BLURB, rooms: WEB_ROOMS, roomById: WEB_BY_ID, tiers: WEB_TIERS },
  [SC_ID]: { id: SC_ID, title: SC_TITLE, blurb: SC_BLURB, rooms: SC_ROOMS, roomById: SC_BY_ID, tiers: SC_TIERS },
}

export function getDungeon(id) {
  return DUNGEONS[id] || null
}

// Tier gating from the set of solved roomIds.
//  - mandatory: always open
//  - medium:   open once every mandatory room is solved
//  - hard:     open once >= 2 of the 3 medium rooms are solved
export function tierUnlocks(dungeon, solvedSet) {
  const byTier = (t) => dungeon.rooms.filter((r) => r.tier === t)
  const mandatory = byTier('mandatory')
  const medium = byTier('medium')
  const allMandatory = mandatory.length > 0 && mandatory.every((r) => solvedSet.has(r.id))
  const mediumSolved = medium.filter((r) => solvedSet.has(r.id)).length
  return {
    mandatory: true,
    medium: allMandatory,
    hard: mediumSolved >= 2,
  }
}
