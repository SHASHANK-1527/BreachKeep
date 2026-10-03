# How a room connects to the frontend (the TryHackMe-style flow)

This is the whole path, from the "door" of rooms to a live terminal in a new tab.

## What the student sees

1. **The door** — the dungeon page lists every room as a card, grouped into
   Mandatory / Medium / Hard. Locked tiers are greyed out.
2. **Click a room** — the card opens the room view: the story brief, the
   objective, a hint ladder, a **Connect to machine** button, and the flag box.
3. **Click "Connect to machine"** — their own container boots and the full
   terminal opens **in a new browser tab** (real shell, real tools).
4. **They solve it in that tab**, read/compute the flag (or run `check`), come
   back to the room view, paste the flag, and the card flips to **Cleared** —
   which can unlock the next tier.

## The pieces (and the one file each lives in)

```
Door + room view ....... apps/web/src/pages/Dungeon.jsx
                         apps/web/src/features/dungeons/DungeonView.jsx
Room content (data) .... apps/web/src/features/dungeons/<dungeon>/rooms.js
Dungeon registry ....... apps/web/src/features/dungeons/index.js
Open-lab API ........... apps/api/src/controllers/labController.js  (+ routes/labs.js)
Provisioner ............ apps/provisioner/src/server.js  (boots container, proxies terminal)
The room itself ........ labs/terminal/Dockerfile.<roomId> + <roomId>.sh
```

## Adding / wiring a room = three touch-points

To make a brand-new room appear on the door and be fully playable, you edit
exactly three places (all shown by the existing terminal-1 / terminal-2 rooms):

1. **The lab image** — `labs/<context>/Dockerfile.<roomId>` + its entrypoint
   script. The entrypoint places or guards the flag (`$BK_FLAG`) and launches
   `ttyd`. Register the `roomId` in `apps/provisioner/src/dungeons.js`
   (`DUNGEONS`), and if it starts as root add it to `ROOM_CAPS`.

2. **The room card/story** — add an entry to the dungeon's
   `features/dungeons/<dungeon>/rooms.js`:

   ```js
   {
     id: 'terminal-1-grep',     // MUST equal the Dockerfile/roomId (and the flag HMAC id)
     tier: 'mandatory',         // mandatory | medium | hard  -> which door section
     num: 'V',                  // numeral shown on the card
     title: 'The Golden Ticket',
     concept: 'grep -r / -i',
     brief:  '...the story...',
     objective: 'what to do, and `check ...` if it is a task room',
     hints: ['hint 1', 'hint 2', 'hint 3'],
     debrief: 'shown after they clear it',
   }
   ```

   The `id` is the single thread that ties everything together: the card, the
   container image, and the per-student flag `flagFor(userId, id)` are all keyed
   by it. Get that string identical in both files and the room is wired.

3. **Nothing else.** The door, tier locking, the Connect button, the new-tab
   terminal, and the flag box are all generic — they read the data above. A new
   dungeon only additionally needs one line in `features/dungeons/index.js`
   (import its `rooms.js` into the registry) and its id in `labController.js`'s
   `DUNGEON_ROOMS`.

## What happens on "Connect to machine" (the exact chain)

```
Browser (DungeonView)                 BreachKeep API                Provisioner (Docker)
  click Connect
  POST /api/labs/open {roomId}  --->  openLab():
                                        - check the room's dungeon is LIVE
                                        - flag = flagFor(userId, roomId)
                                        - POST /provision {studentId,roomId,flag} --->  runs breachkeep/<roomId>
                                                                                        with BK_FLAG + BK_BASE,
                                                                                        on the internal lab net,
                                                                                        mints a per-session token
                                        <--- { url: /labs/<name>, token } ------------
                                   <--  { url: /labs/<name>?token=... }
  window.open(url, '_blank')  ----------------------------------------------->  nginx /labs/ -> provisioner
                                                                                 proxy checks token, sets a
                                                                                 scoped cookie, streams ttyd
                                                                                 (HTTP + WebSocket) from the
                                                                                 student's container :7681
  === live terminal in the new tab ===
```

Key points that make it work and stay safe:

- **The flag never reaches the browser.** It is computed server-side and injected
  into the container as `BK_FLAG`; the student has to actually get it out of the
  box. (And each container `env -u BK_FLAG`s it so `echo $BK_FLAG` won't work.)
- **Per-student flags.** `flagFor(userId, roomId)` is an HMAC, so a flag copied
  from a classmate fails to submit.
- **The terminal is token-gated.** `/api/labs/open` returns a URL carrying a
  one-time token; the provisioner sets a scoped cookie so only that student's
  browser can reach that container's terminal.
- **`ttyd -b /labs/<name>`** gives the terminal a base path, so its assets and
  WebSocket resolve correctly behind the proxy — that is why it "just works" in
  a plain new tab with no iframe.
- **Idle containers are reaped** automatically; "Stop machine" removes it now.

## Flag model recap (which rooms use `check`)

- **Find-type rooms** (navigate/read/grep/strings/…): the flag sits in a file the
  student uncovers; they read it and paste it into the room's flag box.
- **Task rooms** (pipes, log-detective, needle, and most of terminal-2): a root
  guard holds the flag and only prints it when the student runs `check` with the
  right answer, or completes the task (fix perms, exploit the writable cron, …).
  The student still pastes the revealed flag into the room's flag box to clear it.

Either way, the **room's flag box → `POST /api/flags/submit`** is what records the
clear and drives tier unlocking. Connecting to the machine and submitting the
flag are deliberately two separate steps, exactly like TryHackMe.
