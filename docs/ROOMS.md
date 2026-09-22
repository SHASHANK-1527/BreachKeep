# Adding a dungeon room

A room is one challenge. To add one:

1. **Lab image** (interactive rooms): add `labs/<dungeon>/Dockerfile.<roomId>`,
   `FROM breachkeep/base`, dropping in the room's files/permissions/binary. The
   provisioner injects the student's flag as `BK_FLAG` at run time.
2. **Register it** in `apps/provisioner/src/dungeons.js` under its dungeon's `rooms`.
3. **Frontend room** (optional custom UI): add a component under
   `apps/web/src/features/dungeons/<dungeon>/<roomId>.jsx`. It renders the scenario +
   a Connect button (embedded terminal via the per-session `/labs/...` URL) and the
   shared `<FlagSubmit roomId="<roomId>" />`.
4. **Flags**: never hard-code. The server computes `flagFor(userId, roomId)`; the
   student submits it through `<FlagSubmit>`, which POSTs `/api/flags/submit`.
5. **"Do X" rooms**: add a small checker inside the container that verifies the live
   condition before printing `$BK_FLAG`.

Secure-coding rooms instead ship the Trading Post source + a harness case in
`labs/secure-coding/harness.mjs`; the room clears when the exploit fails and the
functional test passes.
