// Capstone is a single, shared, admin-spawned target box (not per-student
// containers). The real (root) flag comes from CAPSTONE_FLAG; the decoy flags
// below are planted ON the target box and each maps to a path-aware hint, so a
// wrong submission still teaches — which decoy a student submits tells us which
// path they took and what nudge to give. Keep these strings in sync with the
// target box entrypoint (labs/capstone/entrypoint.sh).
export const CAPSTONE_ROOM = 'capstone-gauntlet'
export const CAPSTONE_FLAG = process.env.CAPSTONE_FLAG || 'BK{dev-capstone-root-flag}'

export const CAPSTONE_DECOYS = {
  'BK{backup_left_in_webroot}':
    "You found the old backup — that's not the flag. Use the credentials inside it to get a foothold over SSH.",
  'BK{env_file_exposed}':
    "The exposed .env isn't the flag, but it leaked a login. Try those credentials over SSH.",
  'BK{html_source_comment}':
    "Good recon in the page source — keep going. That hint points at a hidden endpoint; enumerate until you find a password, then log in.",
  'BK{robots_said_no}':
    "robots.txt only maps the site. Follow one of the disallowed paths to something you can actually use.",
  'BK{user_flag_on_the_box}':
    "That's the user flag, not the final one. You already have a shell — now escalate: what can your user run as root? (try: sudo -l)",
  'BK{almost_there_check_sudo}':
    "Close. Check your sudo rights with  sudo -l  and use the command you're allowed to run as root to read root's flag.",
}

export function judgeCapstone(submitted) {
  const s = String(submitted || '').trim()
  if (s && s === CAPSTONE_FLAG) return { correct: true }
  if (Object.prototype.hasOwnProperty.call(CAPSTONE_DECOYS, s)) return { correct: false, hint: CAPSTONE_DECOYS[s] }
  return { correct: false }
}
