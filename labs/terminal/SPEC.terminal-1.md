# Terminal-1 — "First Steps" dungeon spec

Linux fundamentals. 10 rooms: 5 mandatory, 3 medium, 2 hard. This is the model
dungeon — every other dungeon follows its shape and enforcement patterns.

## Files

```
labs/terminal/
  Dockerfile.terminal-1-<room>   one per room, FROM breachkeep/base
  <room>.sh                      entrypoint: builds the room, places/gates the flag
  bkguard.sh                     root-held answer guard (task rooms only)
  check                          student command to submit an answer (task rooms only)
apps/provisioner/src/dungeons.js terminal-1 lists all 10 roomIds
apps/web/src/features/dungeons/
  terminal-1/rooms.js            briefs, objectives, hint ladders, debriefs
  index.js                       dungeon registry + tier gating
  DungeonView.jsx                room list, hints, terminal, flag submit
  dungeons.css
apps/web/src/pages/Dungeon.jsx   delegates to DungeonView when content exists
```

## Flag model & the critical fix

The flag arrives as `BK_FLAG` and must equal `flagFor(userId, roomId)` so the
server validates the student's own submission. Two things every room does:

1. **Unset BK_FLAG before the shell starts** (`env -u BK_FLAG`). Without this,
   `echo $BK_FLAG` or `cat /proc/1/environ` hands the flag over for free and
   every room is pointless. (The pre-existing first-steps room had this hole.)
2. **The `${BK_FLAG:-BK{...}}` default is a trap** — the `{` makes bash end the
   expansion at the first `}` and append a stray `}` to *every* flag, including
   the real one. All rooms use the two-line safe form instead.

## Enforcement patterns used

- **Per-student randomisation** — paths, line numbers, file sets, IPs, timestamps
  are generated at container start, so answers cannot be shared (and the flag is
  already per-student via HMAC).
- **Find-type rooms** (first-steps, reading, hidden, finding, grep, strings,
  archives, needle): the flag is the thing to find; placing it is the challenge.
- **Task rooms** (pipes, log-detective, needle): the flag is held by `bkguard`
  running as **root**, in `/opt/bk` (mode 600). The student submits an answer
  with `check <...>`; only a correct answer makes the guard reveal the flag.
  Root-held so the student's uid cannot read the flag, the expected answer, or
  the guard's memory/env. Rooms start as root and drop to `student` via
  `setpriv` for the shell.
- **Tool stripping** — first-steps has `find` removed so navigation is the only
  path.

## Rooms

| # | roomId | Tier | Concept | Intended path | How the flag is gated |
|---|--------|------|---------|---------------|-----------------------|
| I | first-steps | mand | pwd/ls/cd/cat | walk tree to the one flag.txt | file placement; `find` removed |
| II | reading | mand | head/tail/sed -n | jump to the named line | flag on a random line |
| III | hidden | mand | ls -a, dotfiles | follow hidden dirs to .key | hidden placement + .bak/.old decoys |
| IV | finding | mand | find -name/-size/-type | combine 3 tests → 1 file | flag = last line of the only match |
| V | grep | mand | grep -r -i | recursive, case-insensitive search | mixed-case marker defeats plain grep |
| VI | pipes | med | cut\|sort\|uniq -c\|sort -nr | top IP + count | `check <ip> <count>` → guard |
| VII | archives | med | file + gzip/tar/xz | identify & peel each layer | flag in innermost file |
| VIII | strings | med | strings | extract text from binary | flag embedded in binary |
| IX | log-detective | hard | cross-log correlation | find attacker IP, its earliest time | `check <UTC timestamp>` → guard |
| X | needle | hard | find -user/-perm/-mtime | match file by metadata | `check <path>` → guard (file unreadable) |

## Validation done (logic, in a Linux sandbox — not yet a real container build)

- Flag value is preserved exactly end-to-end (caught & fixed the stray-brace bug).
- Each find-type room: the documented intended command returns **exactly one**
  answer = the flag location.
- grep room: a plain case-sensitive `grep` returns **0** hits (proves `-i` is
  needed); `grep -ri` returns exactly 1.
- Guard logic: wrong answer → "NOPE"; correct answer (even with messy spacing) →
  flag. pipes/needle/log-detective expected values match what the intended
  analysis produces.
- log-detective: noise IPs have earlier epochs than the attacker, so naively
  taking the global minimum is wrong — the student must filter by attacker IP
  first (intended difficulty confirmed).
- All shell scripts pass `bash -n`; all JS/JSX parses clean.

## The cheese test (do this on the VM before release)

For each room, a second person spends 10 min trying to get the flag WITHOUT the
intended path. Known things to re-check once built as real containers:

1. `echo $BK_FLAG`, `env`, `cat /proc/1/environ` must NOT reveal the flag.
2. In task rooms, `/opt/bk/flag` and `/opt/bk/expected` must be unreadable as
   `student`; the guard process env/memory unreadable (different uid).
3. `cat`-ing random files / `grep -r BK /` should not trivially shortcut a
   find-type room to its flag faster than intended (acceptable for intro rooms,
   but note it).
4. needle: the target must stay unreadable to `student` (600, foreign owner), so
   the path-submission is the only route.

## Still required before these run for a student (provisioner — separate task)

These are the gaps from `docs/ROOMS.md`, unchanged by this content work:

1. `buildImage` must pass `dockerfile: 'Dockerfile.<roomId>'` so each room gets
   its own image (today every room in a dungeon builds the default Dockerfile).
2. A WebSocket-aware `/labs/<name>` proxy to port 7681, per-session token auth,
   exempt from the shared-secret check. The frontend "Open terminal" button
   calls `POST /api/labs/open` — that route + the provision flow need wiring.
3. Challenge containers on a user-defined `internal: true` network.
4. The three task rooms start as root and drop privileges; `CapDrop: ['ALL']` +
   `no-new-privileges` is fine for them (no sudo needed). Confirm `setpriv` works
   under that capability set when built; if not, grant `CAP_SETUID`/`CAP_SETGID`
   for those rooms.
