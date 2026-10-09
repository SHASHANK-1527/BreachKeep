import { formatFor, wrapFlag } from '../utils/flagFormats.js'
import { checkFlag } from '../utils/flags.js'

export const CAPSTONE_ROOM = 'capstone-gauntlet'
export const CAPSTONE_ROOT_FORMAT = formatFor(CAPSTONE_ROOM)
export const CAPSTONE_FLAG = process.env.CAPSTONE_FLAG || wrapFlag('dev-capstone-root-flag', CAPSTONE_ROOT_FORMAT)

// 6 distinct decoy formats from the pool (offset 1..6), ensuring zero collision with root format
export const CAPSTONE_DECOYS = {
  // Format 1: KEEP[...]
  'KEEP[robots_said_no]':
    "robots.txt only maps the site. Follow one of the disallowed paths to something you can actually use.",
  // Format 2: VAULT<...>
  'VAULT<backup_left_in_webroot>':
    "You found the old backup — that's not the flag. Use the credentials inside it to get a foothold over SSH.",
  // Format 3: FLAG((...))
  'FLAG((env_file_exposed))':
    "The exposed .env isn't the flag, but it leaked a login. Try those credentials over SSH.",
  // Format 4: ARCHIVE::...::
  'ARCHIVE::html_source_comment::':
    "Good recon in the page source — keep going. That hint points at a hidden endpoint; enumerate until you find a password, then log in.",
  // Format 5: RUNE/.../
  'RUNE/user_flag_on_the_box/':
    "That's the user flag, not the final one. You already have a shell — now escalate: what can your user run as root? (try: sudo -l)",
  // Format 6: SEAL|...|
  'SEAL|almost_there_check_sudo|':
    "Close. Check your sudo rights with  sudo -l  and use the command you're allowed to run as root to read root's flag.",
}

export function judgeCapstone(submitted, userId = null) {
  const s = String(submitted || '').trim()
  if (!s) return { correct: false }
  if (s === CAPSTONE_FLAG) return { correct: true }
  if (userId && checkFlag(userId, CAPSTONE_ROOM, s)) return { correct: true }
  if (Object.prototype.hasOwnProperty.call(CAPSTONE_DECOYS, s)) {
    return { correct: false, hint: CAPSTONE_DECOYS[s] }
  }
  return { correct: false }
}

