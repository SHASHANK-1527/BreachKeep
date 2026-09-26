# Class-day runbook

For the sessions where only the **introduction module** is live. No dungeons,
no challenge containers, no provisioner work required.

---

## 1. What has to run today

Only three things:

| Piece | Where it runs |
|---|---|
| `apps/api` | Node process on the VM |
| `apps/web` bundles | built once, served as static files by nginx |
| MongoDB | **Atlas free tier (M0)** — do not self-host it today |

The `provisioner` service is only needed once dungeons go live. It can stay in
the compose file (it will start and idle harmlessly), or you can leave it out:

```bash
docker compose up -d --build mongo api web-build nginx
```

---

## 2. Host

**One x86_64 VM with Docker.** Not Vercel / Netlify / Render — the gate-cookie
logic lives in nginx and, later, the provisioner needs the Docker socket, which
no PaaS will give you.

- **Today (intro only, 50–150 students):** 2 vCPU / 4 GB is comfortable. The API
  is stateless and mostly cookie and JWT work.
- **Later (dungeons live):** each challenge container is capped at 256 MB, so
  concurrency is the constraint — 4 GB of container headroom ≈ 16 students in a
  lab at once. Plan on splitting the labs onto a second, larger box: it keeps
  the Docker socket and the deliberately-vulnerable Trading Post away from the
  machine holding sessions and database credentials.

> **x86_64 only.** `labs/base/Dockerfile` downloads `ttyd.x86_64`. An ARM box
> (Oracle free tier, Graviton) will build the base image and then fail at run
> time. This does not matter today, but it decides which VM you create.

---

## 3. Deploy

```bash
git clone <repo> && cd BreachKeep
cp .env.example .env         # then fill it in — see below
docker compose up -d --build mongo api web-build nginx
docker compose logs -f api   # expect: [db] connected / [api] listening on :5000
```

### .env values that must be right for today

| Key | Why it matters today |
|---|---|
| `MONGODB_URI` | Atlas connection string. Allow the VM's IP in Atlas → Network Access. |
| `GOOGLE_CLIENT_ID` | server-side token verification |
| `VITE_GOOGLE_CLIENT_ID` | **same value**, baked into the bundle at build time |
| `ADMIN_SECRET_PATH` | the hidden admin URL |
| `VITE_ADMIN_PATH` | **must equal `ADMIN_SECRET_PATH`**, also baked in at build time |
| `ADMIN_PASSWORD_HASH` | `cd apps/api && npm run hash-admin "yourpassword"` |
| `COMMON_ACCESS_CODE` | what you read out to the class |
| `AUTH_RATE_MAX` | per-IP limit. A campus network is one IP — keep it well above your class size. |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail app password, for the verification codes |

The `VITE_*` values are compiled into the JavaScript, so **changing them means
rebuilding the web bundle**, not just restarting:

```bash
docker compose up -d --build --force-recreate web-build nginx
```

### Google sign-in

In Google Cloud Console → Credentials → your OAuth Web client, add your real
origin (`https://breachkeep.example.com`) under **Authorised JavaScript
origins**. Google refuses the popup from an origin it does not know, and the
error surfaces only in the browser console.

### TLS

Point DNS at the VM, run Certbot, add the TLS server block to
`infra/nginx/breachkeep.conf`. `NODE_ENV=production` already marks cookies
`secure`, so **over plain HTTP no cookie will stick and nobody can log in** —
TLS is not optional once you set `NODE_ENV=production`.

---

## 4. Pre-class checklist

Run through this on the real domain, in a private window, before the class
starts. Roughly ten minutes.

- [ ] **Landing loads.** Visit the domain with no cookies. You should get the
      access-code page, not the app.
- [ ] **The app bundle is not reachable pre-gate.** View source — you should see
      the landing bundle only. Inner routes must not be discoverable.
- [ ] **Access code works.** Enter `COMMON_ACCESS_CODE` → registration.
- [ ] **A student can register.** Real email → verification code arrives →
      account created. If the mail never arrives, check the api logs for the
      nodemailer error; a Gmail app password, not the account password, is
      required.
- [ ] **Google sign-in works.** The popup opens, returns, and lands you in the
      app. If the popup opens and closes instantly, the origin is missing in
      Google Cloud Console. If the button never renders, `VITE_GOOGLE_CLIENT_ID`
      was empty at build time.
- [ ] **Intro module loads** and all three rooms complete.
- [ ] **Sorting ceremony runs** and assigns a house.
- [ ] **Themes load** — the house theme applies after sorting.
- [ ] **Admin opens.** See below.
- [ ] **Kill switch round-trips.** Close the site in the Warden panel, confirm a
      logged-out browser sees the maintenance page, reopen it. Do this *before*
      class, not for the first time at the end of it.

---

## 5. Opening the Warden panel

It is deliberately not linked from anywhere. Two ways in:

1. **From the landing page** — type `ADMIN_LANDING_CODE` into the access-code
   box instead of the student code. The server recognises it and redirects you.
2. **Directly** — `https://<your-domain><ADMIN_SECRET_PATH>`, e.g.
   `https://breachkeep.example.com/keep-warden-7f3a9c`.

Then enter the admin password (the plaintext you hashed into
`ADMIN_PASSWORD_HASH`). The session lasts 8 hours.

If the panel shows the password box again straight after a correct password,
`VITE_ADMIN_PATH` does not match `ADMIN_SECRET_PATH` — the router is serving a
different path than the one the cookie was issued for.

---

## 6. The kill switch

**Warden panel → Site → Close the site now.**

What it does:

- every student-facing `/api` route answers `503 { error: "maintenance" }` —
  no registration, no login, no intro progress, no flag submission
- both web bundles swap to the maintenance page, including for students who are
  already inside; they flip on their next action, and within 30s if idle
- the Warden panel keeps working, so you can always switch it back on
- takes effect everywhere within five seconds — no rebuild, no restart
- **nothing is deleted.** Accounts, progress and house assignments are untouched

You can set a custom message and a "reopens" badge on the same tab before
closing.

### Hard takedown

If you want the site down even when the API itself is being restarted, point
nginx at the standalone page instead:

```nginx
location / {
  return 503;
}
error_page 503 /maintenance.html;
location = /maintenance.html {
  root /usr/share/nginx/html/landing;
  internal;
}
```

`apps/web/public/maintenance.html` is a self-contained copy of the same page and
ships in both bundles. Reload nginx (`docker compose exec nginx nginx -s reload`)
to apply, and remove the block to reopen. The in-app switch is the one to use
day to day; this is the break-glass version.

---

## 7. Known gaps — before dungeons can go live

None of these affect the introduction module.

1. **`buildImage` ignores per-room Dockerfiles.** `apps/provisioner/src/docker.js`
   builds `labs/<context>` with the default `Dockerfile` for every room, so all
   three terminal rooms would build the same image. It needs to pass
   `dockerfile: 'Dockerfile.<roomId>'` through to `docker.buildImage`.
2. **Nothing serves `/labs/<name>`.** nginx proxies it to the provisioner, but
   the provisioner has no such route and its shared-secret middleware would
   reject the browser anyway. It needs a WebSocket-aware proxy to the student's
   container on port 7681, exempted from the shared-secret check and
   authenticated with a per-session token instead.
3. **Challenge containers use the default bridge network**, which has no DNS, so
   the provisioner cannot reach them by name. They need a user-defined network —
   and it should be `internal: true` so the deliberately-vulnerable Trading Post
   has no route out.
4. **`CapDrop: ['ALL']`** will break the privilege-escalation rooms that expect
   `sudo`. Those rooms need their own capability set.
5. **`npm test` in `apps/api` is broken on Node 20+** — `node --test test/`
   treats the directory as a module. It should be `node --test test/*.test.js`.
   The tests themselves pass.
