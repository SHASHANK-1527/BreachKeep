// Terminal-1 "First Steps" dungeon — room catalogue.
// Each room: id (matches the lab image + flag HMAC roomId), tier, numeral,
// title, story brief, the single concept, a 3-step hint ladder, and a debrief
// shown after the room is solved. Pure data — the view renders it.

export const DUNGEON_ID = 'terminal-1'
export const DUNGEON_TITLE = 'First Steps'
export const DUNGEON_BLURB =
  'Learn to move, read, and search inside a Linux shell. Everything in the Keep stands on these.'

export const TIERS = {
  mandatory: { label: 'Mandatory', note: 'Clear all of these to unlock the medium rooms.' },
  medium: { label: 'Medium', note: 'Unlocks after every mandatory room is cleared.' },
  hard: { label: 'Hard', note: 'Unlocks after 2 of the 3 medium rooms are cleared.' },
}

export const ROOMS = [
  {
    id: 'terminal-1-first-steps',
    tier: 'mandatory',
    num: 'I',
    title: 'First Steps',
    concept: 'Moving around a filesystem: pwd, ls, cd, cat.',
    brief:
      'You land in an unfamiliar home directory. Somewhere beneath it is the only file named flag.txt. There is no search tool here — you walk.',
    objective: 'Find and read the single flag.txt hidden in the directory tree.',
    hints: [
      'Every folder can hold more folders. ls shows what is in the one you are standing in; cd moves you into one.',
      'Use ls to list, cd <name> to step in, cd .. to step back out, and pwd to see where you are.',
      'Descend each folder with ls then cd until you see flag.txt, then: cat flag.txt',
    ],
    debrief:
      'You just navigated a filesystem by hand — the thing every later room assumes you can do. Real engineers live in this loop: ls, cd, read, repeat.',
  },
  {
    id: 'terminal-1-reading',
    tier: 'mandatory',
    num: 'II',
    title: 'The Ledger',
    concept: 'Reading files without opening the whole thing: head, tail, sed -n, less.',
    brief:
      'A 1,500-line ledger holds the key on one known line. Scrolling the whole file by eye is how you lose an afternoon.',
    objective: 'Jump straight to the line named in README.txt and read the key.',
    hints: [
      'You do not need to read the whole file — only one line. README.txt tells you which.',
      'sed -n "Np" file prints line N. So do head -n N file | tail -n 1, and less +Ng file.',
      'If the clerk wrote it on line 742: sed -n "742p" ledger.log',
    ],
    debrief:
      'Targeted reading beats scrolling every time. Logs in the real world are millions of lines — you jump to what you need.',
  },
  {
    id: 'terminal-1-hidden',
    tier: 'mandatory',
    num: 'III',
    title: 'What ls Won’t Show',
    concept: 'Hidden dotfiles and directories: ls -a.',
    brief:
      'A plain ls makes this room look almost empty. It is lying. The real key lives in a hidden file inside hidden folders, with decoys nearby.',
    objective: 'Reveal the hidden chain and read the real key, ignoring the .bak / .old decoys.',
    hints: [
      'Files and folders whose name starts with a dot are hidden from a normal ls.',
      'ls -a shows them in the current folder; ls -aR walks the whole tree including hidden entries.',
      'Follow the hidden folders down (.config → .cache → .vault) and cat the hidden .key inside. Files named .bak/.old are traps.',
    ],
    debrief:
      'Attackers and defenders both know secrets hide in dotfiles — .ssh, .env, .git. "Nothing here" usually means you did not look with -a.',
  },
  {
    id: 'terminal-1-finding',
    tier: 'mandatory',
    num: 'IV',
    title: 'The Needle (warm-up)',
    concept: 'Searching by attributes with find: -name, -size, -type together.',
    brief:
      'Hundreds of files sit under pile/. Exactly one is a .dat, larger than 10 KB, and a regular file. Guessing is hopeless.',
    objective: 'Combine the three find tests to isolate the one file, then read its last line.',
    hints: [
      'find searches by what a file IS, not just its name. You can stack conditions so all must match.',
      '-name "*.dat" matches the name, -size +10k matches size, -type f matches regular files. Together they narrow to one.',
      'find pile -name "*.dat" -size +10k -type f  — then tail -n 1 on the file it prints.',
    ],
    debrief:
      'find is how you locate things across a whole system when you only know their shape. Combining filters is the skill — one condition is never enough.',
  },
  {
    id: 'terminal-1-grep',
    tier: 'mandatory',
    num: 'V',
    title: 'The Golden Ticket',
    concept: 'Searching inside files recursively and case-insensitively: grep -r, -i.',
    brief:
      'The phrase GOLDEN TICKET is written somewhere under docs/ — but the capitalisation is scrambled, and it is one line among hundreds of files.',
    objective: 'Find the line containing the phrase despite the mixed case, and read the key on it.',
    hints: [
      'grep searches inside files for text. By default it only looks in one file and cares about capital letters.',
      '-r searches a whole folder tree; -i ignores case. You need both here.',
      'grep -ri "golden ticket" docs  — the key is on the same line it finds.',
    ],
    debrief:
      'grep is the single most-used tool for finding a string in a codebase or a pile of logs. -r and -i turn "I think it is in here somewhere" into one command.',
  },
  {
    id: 'terminal-1-pipes',
    tier: 'medium',
    num: 'VI',
    title: 'Busiest on the Wire',
    concept: 'Chaining tools with pipes: cut | sort | uniq -c | sort -nr | head.',
    brief:
      'An access log recorded every request. One IP hammered the server far harder than the rest. Find who, and exactly how many times.',
    objective: 'Compute the top IP and its hit count, then run: check <ip> <count>',
    hints: [
      'A pipe (|) feeds one command’s output into the next. You can count repeats by sorting, then counting runs.',
      'The IP is the first field of each line. cut -d" " -f1 pulls it; uniq -c counts adjacent duplicates (so sort first).',
      'cut -d" " -f1 access.log | sort | uniq -c | sort -nr | head -1  — then: check <ip> <count>',
    ],
    debrief:
      'This five-stage pipeline is a genuine incident-response one-liner: "which IP is flooding us?" Pipes let small tools compose into real analysis.',
  },
  {
    id: 'terminal-1-archives',
    tier: 'medium',
    num: 'VII',
    title: 'Russian Dolls',
    concept: 'Identifying and unwrapping nested archives: file, gzip, tar, xz.',
    brief:
      'A file called evidence.log is not a log at all. Someone wrapped the key in several layers of compression and lied about every extension.',
    objective: 'Identify each layer with file and peel it until you reach plain text.',
    hints: [
      'Do not trust the extension. Ask the system what a file really is before you try to open it.',
      'file <name> tells you the true type. Undo that layer (xz -d, tar -xf, gzip -d), then run file again on what falls out.',
      'Repeat identify → unwrap → identify until file reports ASCII text, then cat it.',
    ],
    debrief:
      'Malware, exfiltrated data, and CTF payloads all hide behind wrong extensions and nested compression. file is how you see through the disguise.',
  },
  {
    id: 'terminal-1-strings',
    tier: 'medium',
    num: 'VIII',
    title: 'Ghost in the Dump',
    concept: 'Extracting readable text from binary files: strings.',
    brief:
      'core.dump is raw binary. cat just vomits garbage across your terminal (and may wreck it). The key is readable text buried in the bytes.',
    objective: 'Pull the printable strings out of the binary and locate the key.',
    hints: [
      'Binary files still contain islands of human-readable text. There is a tool that prints only those.',
      'strings <file> prints runs of printable characters. Pipe it to grep to filter.',
      'strings core.dump | grep BK',
    ],
    debrief:
      'strings is a first-move in malware analysis and forensics: before anything else, see what readable text a binary carries — URLs, keys, messages.',
  },
  {
    id: 'terminal-1-log-detective',
    tier: 'hard',
    num: 'IX',
    title: 'Log Detective',
    concept: 'Correlating one actor across logs with different timestamp formats.',
    brief:
      'Three logs, three time formats: epoch seconds, syslog, and ISO 8601. An attacker brute-forced a login and appears in all three. When did they first show up?',
    objective:
      'Identify the attacker IP, gather its lines across all three logs, find its earliest timestamp, and submit it: check YYYY-MM-DD HH:MM:SS',
    hints: [
      'First find WHO: the attacker is the IP with many "Failed password" lines in auth.log.',
      'Then gather that IP’s lines from all three files and compare times. The earliest is in app.log, as an epoch.',
      'Convert the epoch: date -u -d @<epoch>. Submit it in UTC as: check 2026-01-02 03:04:05',
    ],
    debrief:
      'Real investigations mean stitching one actor’s trail across systems that each log time differently. Normalising timestamps is half the battle.',
  },
  {
    id: 'terminal-1-needle',
    tier: 'hard',
    num: 'X',
    title: 'Needle by Metadata',
    concept: 'Finding a file by owner, permissions, and age — not name or content.',
    brief:
      'Hundreds of files, and the one you want gives nothing away in its name or contents. It is defined only by its metadata — and you cannot even read it directly.',
    objective:
      'Find the file owned by archivist, mode exactly 600, modified over a year ago, and submit its path: check <path>',
    hints: [
      'Name and contents are useless here. find can match on who owns a file, its exact permissions, and its age.',
      '-user archivist, -perm 600, and -mtime +365 each match one attribute. All three together isolate it.',
      'find store -user archivist -perm 600 -mtime +365  — then: check <the path it prints>',
    ],
    debrief:
      'Metadata search finds what content search cannot: the file planted by the wrong account, the one with suspicious permissions, the one untouched for years.',
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]))
