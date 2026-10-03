// Maps a dungeonId to its build context under /labs and the rooms it contains.
// Weekly build-out edits this map + adds room image layers under labs/<id>/.
export const DUNGEONS = {
  'terminal-1': {
    context: 'terminal',
    rooms: [
      // mandatory
      'terminal-1-first-steps',
      'terminal-1-reading',
      'terminal-1-hidden',
      'terminal-1-finding',
      'terminal-1-grep',
      // medium
      'terminal-1-pipes',
      'terminal-1-archives',
      'terminal-1-strings',
      // hard
      'terminal-1-log-detective',
      'terminal-1-needle',
    ],
  },
  'terminal-2': {
    context: 'terminal',
    rooms: [
      // mandatory
      'terminal-2-perms',
      'terminal-2-groups',
      'terminal-2-env',
      'terminal-2-scripts',
      'terminal-2-escalation',
      // medium
      'terminal-2-cron-watch',
      'terminal-2-path-order',
      'terminal-2-suid-audit',
      // hard
      'terminal-2-misconfig-chain',
      'terminal-2-audit-report',
    ],
  },
  'network': {
    context: 'network',
    rooms: [
      // mandatory
      'network-ports',
      'network-scan',
      'network-banner',
      'network-capture',
      'network-dns',
      // medium
      'network-http',
      'network-protocol-id',
      'network-firewall',
      // hard
      'network-pcap-forensics',
      'network-pivot',
    ],
  },
  'web': {
    context: 'web',
    rooms: [
      // mandatory
      'web-recon',
      'web-devtools',
      'web-cookie-trust',
      'web-client-trust',
      'web-idor',
      // medium
      'web-sqli',
      'web-reflected-xss',
      'web-headers',
      // hard
      'web-stored-xss',
      'web-chain',
    ],
  },
  'secure-coding': {
    context: 'secure-coding',
    rooms: [
      // mandatory
      'secure-sqli',
      'secure-xss',
      'secure-idor',
      'secure-client',
      // medium
      'secure-headers',
      'secure-rate-limit',
      'secure-hide-secret',
      // hard
      'secure-full-review',
    ],
  },
  'capstone':   { context: 'capstone',  rooms: ['capstone-gauntlet'] },
}

// Per-room container hardening. Default (room not listed) = CapDrop ALL +
// no-new-privileges, which is right for the simple find-type rooms.
//
//  - Guard rooms start as root to generate state, hold the flag, and drop to
//    `student` with setpriv. Root needs a few caps to chown/mkdir users; setpriv
//    needs SETUID/SETGID/SETPCAP. no-new-privileges stays ON (dropping privilege
//    is always allowed).
//  - Escalation rooms teach a misconfigured `sudo`, a setuid binary that GAINS
//    privilege — which no-new-privileges forbids. Those set noNewPriv:false.
const GUARD_CAPS = ['CHOWN', 'DAC_OVERRIDE', 'FOWNER', 'SETUID', 'SETGID', 'SETPCAP']
// network rooms also bind privileged ports (53, 80) for their target services
const NET_CAPS = [...GUARD_CAPS, 'NET_BIND_SERVICE']

export const ROOM_CAPS = {
  // terminal-1 guard rooms
  'terminal-1-pipes':         { caps: GUARD_CAPS, noNewPriv: true },
  'terminal-1-log-detective': { caps: GUARD_CAPS, noNewPriv: true },
  'terminal-1-needle':        { caps: GUARD_CAPS, noNewPriv: true },
  // terminal-2 rooms that set up state as root then drop to student
  'terminal-2-perms':         { caps: GUARD_CAPS, noNewPriv: true },
  'terminal-2-groups':        { caps: GUARD_CAPS, noNewPriv: true },
  'terminal-2-env':           { caps: GUARD_CAPS, noNewPriv: true },
  'terminal-2-scripts':       { caps: GUARD_CAPS, noNewPriv: true },
  'terminal-2-cron-watch':    { caps: GUARD_CAPS, noNewPriv: true },
  'terminal-2-path-order':    { caps: GUARD_CAPS, noNewPriv: true },
  'terminal-2-suid-audit':    { caps: GUARD_CAPS, noNewPriv: true },
  'terminal-2-misconfig-chain': { caps: GUARD_CAPS, noNewPriv: true },
  // sudo (setuid) rooms => must allow privilege gain (no-new-privileges OFF)
  'terminal-2-escalation':    { caps: [...GUARD_CAPS, 'SETFCAP', 'AUDIT_WRITE'], noNewPriv: false },
  'terminal-2-audit-report':  { caps: [...GUARD_CAPS, 'SETFCAP', 'AUDIT_WRITE'], noNewPriv: false },
  // network rooms: start services as root (some on :53/:80), drop to student
  'network-ports':            { caps: NET_CAPS, noNewPriv: true },
  'network-scan':             { caps: NET_CAPS, noNewPriv: true },
  'network-banner':           { caps: NET_CAPS, noNewPriv: true },
  'network-capture':          { caps: NET_CAPS, noNewPriv: true },
  'network-dns':              { caps: NET_CAPS, noNewPriv: true },
  'network-http':             { caps: NET_CAPS, noNewPriv: true },
  'network-protocol-id':      { caps: NET_CAPS, noNewPriv: true },
  'network-firewall':         { caps: NET_CAPS, noNewPriv: true },
  'network-pcap-forensics':   { caps: NET_CAPS, noNewPriv: true },
  'network-pivot':            { caps: NET_CAPS, noNewPriv: true },
  // web rooms: run the Trading Post as 'webapp' + a ttyd shell as 'student';
  // start as root to set that up and drop with setpriv (no privileged ports).
  'web-recon':         { caps: GUARD_CAPS, noNewPriv: true },
  'web-devtools':      { caps: GUARD_CAPS, noNewPriv: true },
  'web-cookie-trust':  { caps: GUARD_CAPS, noNewPriv: true },
  'web-client-trust':  { caps: GUARD_CAPS, noNewPriv: true },
  'web-idor':          { caps: GUARD_CAPS, noNewPriv: true },
  'web-sqli':          { caps: GUARD_CAPS, noNewPriv: true },
  'web-reflected-xss': { caps: GUARD_CAPS, noNewPriv: true },
  'web-headers':       { caps: GUARD_CAPS, noNewPriv: true },
  'web-stored-xss':    { caps: GUARD_CAPS, noNewPriv: true },
  'web-chain':         { caps: GUARD_CAPS, noNewPriv: true },
  // secure-coding rooms: the grader runs as root and drops the harness to the
  // unprivileged 'runner' uid via setpriv — which needs SETUID/SETGID/SETPCAP,
  // exactly like the web rooms above. Without these the grader cannot drop and
  // no fix can ever be graded.
  'secure-sqli':        { caps: GUARD_CAPS, noNewPriv: true },
  'secure-xss':         { caps: GUARD_CAPS, noNewPriv: true },
  'secure-idor':        { caps: GUARD_CAPS, noNewPriv: true },
  'secure-client':      { caps: GUARD_CAPS, noNewPriv: true },
  'secure-headers':     { caps: GUARD_CAPS, noNewPriv: true },
  'secure-rate-limit':  { caps: GUARD_CAPS, noNewPriv: true },
  'secure-hide-secret': { caps: GUARD_CAPS, noNewPriv: true },
  'secure-full-review': { caps: GUARD_CAPS, noNewPriv: true },
}

export function roomCaps(roomId) {
  return ROOM_CAPS[roomId] || { caps: [], noNewPriv: true }
}
