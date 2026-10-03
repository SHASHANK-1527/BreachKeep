// Terminal-2 "Keys to the Keep" dungeon — permissions, groups, environment,
// scripting, and privilege. Same shape as terminal-1.

export const DUNGEON_ID = 'terminal-2'
export const DUNGEON_TITLE = 'Keys to the Keep'
export const DUNGEON_BLURB =
  'Users, groups, permissions, the environment, and how a small misconfiguration hands over the whole keep.'

export const TIERS = {
  mandatory: { label: 'Mandatory', note: 'Clear all of these to unlock the medium rooms.' },
  medium: { label: 'Medium', note: 'Unlocks after every mandatory room is cleared.' },
  hard: { label: 'Hard', note: 'Unlocks after 2 of the 3 medium rooms are cleared.' },
}

export const ROOMS = [
  {
    id: 'terminal-2-perms',
    tier: 'mandatory',
    num: 'I',
    title: 'Read, Write, Execute',
    concept: 'Permission bits and chmod — grant only what is needed.',
    brief: 'A script of yours refuses to run. Its permission bits are wrong, and the lazy fix (777) is the wrong habit to build.',
    objective: 'Make run.sh executable without making it world-writable, then run: check',
    hints: [
      'ls -l shows ten characters like -rw------- : type, then owner / group / other each as r w x.',
      'chmod adds or removes bits. You want to add execute for the owner: chmod u+x run.sh',
      'Avoid chmod 777 (everyone can do everything). chmod u+x (or 744) is right; then run `check`.',
    ],
    debrief: 'Least privilege starts here: give a file exactly the bits it needs. 777 is how world-writable scripts — and real compromises — happen.',
  },
  {
    id: 'terminal-2-groups',
    tier: 'mandatory',
    num: 'II',
    title: 'Who Can Read This',
    concept: 'Ownership, groups, and group membership (id, groups).',
    brief: 'Two restricted files sit in /vault. You can read one and not the other — the difference is which group each belongs to, and which groups you are in.',
    objective: 'Work out which vault file your account may read, and read it.',
    hints: [
      'ls -l shows the owner and the GROUP of each file; the middle rwx triplet is the group’s access.',
      'id (or groups) lists the groups YOU belong to. Match that against the files’ groups.',
      'Read the file whose group you are in: cat /vault/<that file>. warden-only.txt is a decoy.',
    ],
    debrief: 'Access on Linux is owner/group/other. Group membership is a quiet, powerful thing — it is often how "but I could read that file" turns into an incident.',
  },
  {
    id: 'terminal-2-env',
    tier: 'mandatory',
    num: 'III',
    title: 'The Service PIN',
    concept: 'Environment variables and where configs keep them.',
    brief: 'A service stores its settings — including a PIN — as environment variables in a config file. Find the PIN.',
    objective: 'Read the service PIN from its config and submit it: check <PIN>',
    hints: [
      'Programs read configuration from environment variables; those are often set in a file under /etc.',
      'Search for it: grep -ril pin /etc 2>/dev/null, then read the file you find.',
      'cat /etc/keepservice.conf and read SERVICE_PIN, then: check <PIN>',
    ],
    debrief: 'Secrets in environment variables and config files are everywhere — and a readable config is one of the most common ways credentials leak.',
  },
  {
    id: 'terminal-2-scripts',
    tier: 'mandatory',
    num: 'IV',
    title: 'Your First Script',
    concept: 'Writing a bash script that takes an argument.',
    brief: 'Automate a tiny task. We will run your script on a fresh, random directory, so it has to actually work — not print a memorised number.',
    objective: 'Finish solve.sh to print the count of .log files in the directory it is given, then run: check',
    hints: [
      'Your script gets the directory as "$1". You need to count files ending in .log inside it.',
      'Count a listing: ls -1 "$1"/*.log 2>/dev/null | wc -l  — or use find with -maxdepth 1.',
      'Make it print ONLY the number (no extra text), chmod +x it, test on your own dir, then `check`.',
    ],
    debrief: 'A script that takes an argument and computes an answer is the whole foundation of automation — and of every exploit script you will later read.',
  },
  {
    id: 'terminal-2-escalation',
    tier: 'mandatory',
    num: 'V',
    title: 'What sudo -l Tells You',
    concept: 'Reading sudo rights and spotting an over-broad one.',
    brief: 'The key is in a root-only file. You are not root — but someone left you a sudo rule. Read what it lets you do.',
    objective: 'Use your allowed sudo command to read /root/flag.txt.',
    hints: [
      'Before anything, ask what you may run as root: sudo -l',
      'You will see one command allowed without a password. Think about what that command does to a file.',
      'If you may run cat as root: sudo cat /root/flag.txt',
    ],
    debrief: 'Attackers run sudo -l first thing. A single "harmless" command granted as root — cat, less, find, vi — is usually a full root compromise.',
  },
  {
    id: 'terminal-2-cron-watch',
    tier: 'medium',
    num: 'VI',
    title: 'The Nightly Job',
    concept: 'A privileged scheduled task that trusts a writable script.',
    brief: 'A maintenance job runs as root every few seconds. The script it runs is world-writable. That is the whole problem.',
    objective: 'Make the root-run job place the root-only key where you can read it.',
    hints: [
      'Find what the job runs and who may change it: ls -l /opt/cron/job.sh',
      'Anything in that script runs as root. Append a line that copies the key to your home.',
      'echo \'cat /opt/bk/flag > /home/student/key.txt\' >> /opt/cron/job.sh — wait ~5s, then cat key.txt',
    ],
    debrief: 'A privileged scheduler plus a writable target is a classic root escalation. Scheduled jobs should only ever run files that non-root users cannot modify.',
  },
  {
    id: 'terminal-2-path-order',
    tier: 'medium',
    num: 'VII',
    title: 'First in PATH Wins',
    concept: 'Why the order of directories in PATH is a security boundary.',
    brief: 'A root job calls a command by its bare name. The shell finds it by walking PATH left to right — and one entry in that PATH is a directory you can write to.',
    objective: 'Identify the hijackable directory (writable and ahead of the system dirs) and submit it: check <dir>',
    hints: [
      'Read the runner config: cat /opt/service/run.conf — note the PATH and that CMD has no full path.',
      'The shell runs the FIRST match as it scans PATH left to right. Which listed dir can you write to?',
      'It is the one before /usr/bin that lives under your home: check /home/student/bin',
    ],
    debrief: 'PATH order decides which binary actually runs. A writable directory early in a privileged process’s PATH means an attacker chooses the code it executes.',
  },
  {
    id: 'terminal-2-suid-audit',
    tier: 'medium',
    num: 'VIII',
    title: 'The Odd SUID Out',
    concept: 'Finding SUID-root binaries and spotting the one that should not be.',
    brief: 'A handful of system tools are SUID-root by design. One program here is SUID-root that has no business being so.',
    objective: 'List the SUID binaries, identify the odd one, and submit its path: check <path>',
    hints: [
      'A SUID-root file runs as root for anyone. List them: find / -perm -4000 -type f 2>/dev/null',
      'Most results are normal (passwd, sudo, mount...). Look for one that is NOT a standard system tool.',
      'It lives under /usr/local/bin and is named like a custom tool: submit that full path.',
    ],
    debrief: 'Auditing SUID binaries is a core hardening step. An unexpected SUID-root program is often the shortest path from any user to root.',
  },
  {
    id: 'terminal-2-misconfig-chain',
    tier: 'hard',
    num: 'IX',
    title: 'Two Small Mistakes',
    concept: 'Chaining two individually-minor misconfigurations into root.',
    brief: 'A root job runs every plugin in a folder. The job script itself is locked down — but the folder it reads from is not.',
    objective: 'Drop a plugin the root job will run, and have it reveal the root-only key.',
    hints: [
      'Two things matter: the runner (/opt/chain/run.sh) and where it reads plugins from. Inspect both.',
      'ls -ld /opt/chain/plugins — you can write there, and root runs whatever .sh you leave.',
      'Create /opt/chain/plugins/x.sh that copies /opt/bk/flag to your home; wait ~5s; read it.',
    ],
    debrief: 'Neither a locked-down runner nor a writable folder is fatal alone — together they are root. Real escalations are usually a chain of "minor" issues.',
  },
  {
    id: 'terminal-2-audit-report',
    tier: 'hard',
    num: 'X',
    title: 'Harden the Keep',
    concept: 'Finding and FIXING misconfigurations (blue-team).',
    brief: 'You are the admin now. Three things on this box are misconfigured. Fix them — do not exploit them.',
    objective: 'Fix the world-writable root script, the world-writable data dir, and the world-readable secret, then run: check',
    hints: [
      'Hunt them: find / -perm -0002 -type f 2>/dev/null and the same with -type d for directories.',
      'You have sudo. Tighten each: remove world (other) write/read with sudo chmod.',
      'job.sh → not world-writable (e.g. 755); /srv/data → 755; /etc/keep/secret.conf → 600. Then `check`.',
    ],
    debrief: 'Finding the hole is half the job; closing it is the other half. World-writable files and world-readable secrets are the first things a hardening pass removes.',
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]))
