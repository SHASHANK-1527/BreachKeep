// Maps a dungeonId to its build context under /labs and the rooms it contains.
// Weekly build-out edits this map + adds room image layers under labs/<id>/.
export const DUNGEONS = {
  'terminal-1': { context: 'terminal', rooms: ['terminal-1-first-steps', 'terminal-1-reading', 'terminal-1-finding'] },
  'terminal-2': { context: 'terminal', rooms: ['terminal-2-perms', 'terminal-2-env', 'terminal-2-escalation'] },
  'network':    { context: 'network',  rooms: ['network-scan', 'network-capture'] },
  'web':        { context: 'web',       rooms: ['web-trading-post'] },
  'secure-coding': { context: 'secure-coding', rooms: ['secure-sqli', 'secure-xss', 'secure-idor'] },
  'capstone':   { context: 'capstone',  rooms: ['capstone-gauntlet'] },
}
