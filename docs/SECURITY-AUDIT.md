# BreachKeep challenge battle-test

An audit of every flag/grading mechanism for ways a student could "hack" it —
obtain a flag or clear a room without doing the intended work. Two real holes
were found and fixed; the rest held. Validated in a Linux sandbox (not a live
container build).

## Fixed

### F1 — Symlink trick on the answer guards  (HIGH, fixed)
The root guard read the student's answer with `cat /home/student/.bk_answer`.
A student could `ln -s /opt/bk/expected /home/student/.bk_answer`; the root
`cat` follows the symlink, reads the **expected answer**, compares it to itself,
and the guard releases the flag with nothing solved.
- Affected: every answer-guard room — terminal-1 `pipes`, `log-detective`,
  `needle`; network `banner`, `protocol-id`, `firewall`; and the answer-style
  terminal-2 verify rooms (`env`, `path-order`, `suid-audit`).
- Fix (`labs/terminal/bkguard.sh`, `labs/terminal/bkverify.sh`,
  `labs/network/bkguard.sh`): the guard now accepts the answer file only if it
  is a **real, student-owned regular file** (`[ ! -L ]`, `[ -f ]`,
  `stat -c %U == student`), and never writes the result through a pre-planted
  symlink (`rm -f` before write). Verified: the symlink attack yields no flag;
  a correct answer still works; a wrong answer still returns NOPE.

### F2 — secure-coding grader leaked the flag via /proc  (HIGH, fixed)
The grader holds `BK_FLAG` in its env and ran the student's edited `server.js`
with the **same uid**. Edited code could read the grader's environment
(`fs.readFileSync('/proc/'+process.ppid+'/environ')`) and print it — and the
grader returns harness stdout to the student, so the flag leaked with no fix.
- Fix (`labs/secure-coding/app/grader.mjs` + the 8 `Dockerfile.secure-*`): the
  grader runs as **root** and drops the harness to an unprivileged **`runner`**
  uid via `setpriv`, with no `BK_FLAG` anywhere in the child env. `runner`
  cannot read root's `/proc/<grader>/environ` or the flag. Verified: edited code
  that walks `/proc` and prints environs leaks nothing; a correct fix still
  passes and returns the flag.

## Checked and holding

- **Per-student flags.** Dungeon-room flags are `flagFor(userId, roomId)`
  (HMAC); a flag copied from a classmate fails to validate. `GET /flags/for-room`
  reveals flags only for the nine intro scenes — never for dungeon rooms (404).
- **`echo $BK_FLAG`.** Every room `env -u BK_FLAG`s before the student shell, so
  the flag is not in the shell env or `/proc/1/environ`.
- **Guard secrecy.** `/opt/bk/{flag,expected,verify.sh}` are root-owned 600/700;
  the student uid cannot read them, nor the root guard's memory/env.
- **Faking `.bk_result`.** A student can write a fake "Correct!" locally, but the
  real flag still only comes from the guard on a correct answer, and the server
  validates the submitted flag independently — faking the local file gains
  nothing.
- **Web dungeon per-room gating.** Each web room runs with `BK_ROOM` set; only
  the intended vuln returns the real flag, others return a decoy. The app runs
  as `webapp`, a different uid from the `student` shell, so the flag is not
  readable from the shell.
- **secure-coding has no student shell** — interaction is only the editor →
  `/save`, so there is no arbitrary command execution beyond the harness run
  (now as `runner`).

## Accepted risks / operational notes

- **XSS rooms (web `reflected-xss`, `stored-xss`).** Without a headless admin
  bot, perfect enforcement is impossible; the page nonce makes the intended
  in-page payload the easy path, and a student who curls the callback only skips
  their own learning (flags are per-student, so nothing is shareable). Documented.
- **Capstone uses a shared, static flag** (one target box for the class, by
  design). A student could pass the root flag to another; this is the live,
  on-the-day finale and is not per-student. If you need anti-sharing, run it as a
  timed event and watch the leaderboard.
- **Capstone target box is deliberately vulnerable AND exposed** (published host
  ports, real sshd, weak creds, a sudo misconfig, default caps,
  no-new-privileges off — it is meant to be rooted). **Run it on an isolated
  host**, never on the machine holding sessions/DB/secrets, and take it down
  after the event. This mirrors the existing Trading Post warning and the
  "split the labs onto a second box" note in `infra/deploy/DEPLOY.md`.
- **Lab containers** run `CapDrop: ['ALL']` + `no-new-privileges` (except the
  intended sudo rooms), `PidsLimit`, memory/CPU caps, and the challenge network
  is `internal: true` (no egress). The capstone box is the deliberate exception.
