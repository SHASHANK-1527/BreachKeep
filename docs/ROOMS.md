# Adding a dungeon room

A room is one challenge. There are two kinds.

## Interactive rooms (a container per student)

1. **Lab image** — add `labs/<dungeon>/Dockerfile.<roomId>`, starting
   `FROM breachkeep/base`, adding only that room's files, permissions or binary.
   The provisioner injects the student's flag as `BK_FLAG` at run time.
2. **Register it** in `apps/provisioner/src/dungeons.js`, under its dungeon's
   `rooms` array.
3. **Frontend room** (optional) — a component at
   `apps/web/src/features/dungeons/<dungeon>/<roomId>.jsx`, rendering the
   scenario, a Connect button (the embedded terminal, via the per-session
   `/labs/...` URL) and the shared `<FlagSubmit roomId="<roomId>" />`.
4. **Flags** — never hard-code one. The server computes `flagFor(userId, roomId)`;
   the student submits through `<FlagSubmit>`, which POSTs `/api/flags/submit`.
5. **"Do X" rooms** — put a small checker inside the container that verifies the
   live condition before printing `$BK_FLAG`.

## Secure-coding rooms (no container)

These ship the Trading Post source from `labs/web` plus a harness case in
`labs/secure-coding/harness.mjs`. The room clears only when the original exploit
now fails **and** the functional test still passes.

## Before any of this works

The provisioner is not finished. Four things need fixing before an interactive
room can actually be served to a student:

1. **`buildImage` ignores per-room Dockerfiles.** `apps/provisioner/src/docker.js`
   builds `labs/<context>` with the default `Dockerfile` for every room in the
   dungeon, so all of a dungeon's rooms would get the same image. It needs to
   pass `dockerfile: 'Dockerfile.<roomId>'` through to `docker.buildImage`.
2. **Nothing serves `/labs/<name>`.** nginx proxies that path to the provisioner,
   but the provisioner has no such route, and its shared-secret middleware would
   reject a browser anyway. It needs a WebSocket-aware proxy to the student's
   container on port 7681, exempt from the shared-secret check and authenticated
   with a per-session token instead.
3. **Challenge containers use the default bridge network**, which has no DNS, so
   the provisioner can't reach them by name. They need a user-defined network —
   and it should be `internal: true`, so the deliberately-vulnerable Trading Post
   has no route out.
4. **`CapDrop: ['ALL']`** will break the privilege-escalation rooms that expect
   `sudo`. Those rooms need their own capability set.

## Safety

⚠️ `labs/web` is deliberately vulnerable. It exists to be exploited. Never run it
outside the isolated lab network, and never on the host that holds sessions or
database credentials.

## Challenge Documentation
Detailed technical specifications, environment constructions, and walkthroughs for all 49 challenge rooms across all dungeons are available in:
- [docs/challenges/README.md](file:///c:/Users/KIIT/cyber-classes/BreachKeep/docs/challenges/README.md)

