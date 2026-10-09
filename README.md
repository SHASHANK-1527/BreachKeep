# BreachKeep

A gated, story-driven platform for the Cyber eLabs course. Students enter an
access code, register or sign in, work through an introduction module, get
sorted into one of four houses, and then take on dungeon challenges that run in
throwaway Docker containers — one per student, per room.

```
apps/api           Express + MongoDB — auth, access control, progress, sorting, admin
apps/provisioner   the only service that touches Docker; spins up challenge containers
apps/web           React + Vite — built as two bundles: public landing, gated app
labs/              challenge build contexts (base image, Trading Post, harness)
infra/             nginx reverse proxy + deploy notes
docs/              architecture, API reference, how to add a room
```

## Status

| Piece | Where it stands |
|---|---|
| Backend | Complete, logic-tested |
| Frontend | Complete, both bundles build |
| Introduction module | Complete — three scenes, live |
| Admin (Warden) panel | Complete, including the site kill switch |
| Provisioner | **Not finished** — four known gaps, see `docs/ROOMS.md` |
| Dungeon content | Built weekly, two live at a time |

The introduction module runs without the provisioner, so the platform is usable
for Class 1 before any of the container work is done.

## Run it locally

```bash
cp .env.example .env            # fill in the values below
docker compose up -d --build    # http://localhost:8080
```

Without the provisioner (enough for the intro module, and it skips the Docker
socket entirely):

```bash
docker compose up -d --build mongo api web-build nginx
```

Or run the pieces directly, which is nicer for frontend work:

```bash
cd apps/api && npm install && npm run dev     # :5000
cd apps/web && npm install && npm run dev     # :3000, proxies /api to :5000
```

Tests:

```bash
cd apps/api && npm test
```

## Configuration

Everything is environment variables; `.env.example` is the full list. The API
refuses to boot if any required value is missing, and in production it also
requires the recommended ones — a half-configured deploy fails loudly instead of
running broken.

| Variable | Notes |
|---|---|
| `MONGODB_URI` | Atlas in production. Allow your host's IP, or `0.0.0.0/0` if it has no fixed one |
| `JWT_SECRET`, `FLAG_HMAC_SECRET`, `PROVISIONER_SHARED_SECRET` | three *different* long random strings |
| `COMMON_ACCESS_CODE` | what you read out to the class |
| `ADMIN_LANDING_CODE` | typed into the same box, gets you to the Warden panel |
| `ADMIN_SECRET_PATH` | the hidden admin route |
| `ADMIN_PASSWORD_HASH` | `cd apps/api && npm run hash-admin "yourpassword"` |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail **app password**, not the account password |
| `GOOGLE_CLIENT_ID` | OAuth web client; your origin must be listed in Google Cloud Console |
| `TRUST_PROXY_HOPS` | `1` behind nginx, `2` behind a Vercel rewrite into a host |
| `AUTH_RATE_MAX` | per-IP, and a campus network is one IP — size it to your cohort |
| `BCRYPT_COST` | `10` (~110ms/hash). `12` is ~350ms and will stall a class registering at once |

Three values are compiled into the frontend bundle at **build** time, not read
at run time — changing them means rebuilding, not restarting:

- `VITE_API_BASE`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_ADMIN_PATH` — must match `ADMIN_SECRET_PATH` exactly

## Deploying

Two supported shapes:

- **One VM with Docker** — `infra/deploy/DEPLOY.md`. The only option once
  dungeons go live, because the provisioner needs the Docker socket. Must be
  x86_64: the lab base image pulls `ttyd.x86_64`.
- **Vercel + a Node host + Atlas** — free, no VM, but no dungeons and the nginx
  gate is gone. Fine for the introduction module.

`NODE_ENV=production` marks cookies `secure`, so **HTTPS is not optional** in
production — over plain HTTP no cookie sticks and nobody can log in.

## Security model

- **Three surfaces.** A public landing (access code only), a gated app (served
  only with a gate cookie), and a hidden admin path behind a random URL and a
  password.
- **First visit means no account.** The common code leads to registration; a
  personal daily code leads to login. No device fingerprinting.
- **Server-authoritative throughout.** Identity comes from the session cookie and
  never from the request body. The house is assigned once, by the server.
  Flags are per-student HMACs, so a flag shared between students is worthless.
  The provisioner is the only process that talks to Docker, and it is never
  exposed publicly.
- **Unauthenticated app routes answer 404, not 403**, so probing reveals nothing
  about what exists.

## The kill switch

The Warden panel's **Site** tab closes the platform for every student at once:
all student routes answer 503, both bundles show a maintenance page, and anyone
mid-session is moved to it on their next action. The admin panel stays reachable,
so it is always reversible. Nothing is deleted. It takes effect within about five
seconds — no rebuild, no restart.

## Where to read next

| Document | What it covers |
|---|---|
| `docs/ARCHITECTURE.md` | how the frontend is put together |
| `docs/API.md` | every endpoint, the cookies, the maintenance behaviour |
| `docs/ROOMS.md` | adding a dungeon room, and the provisioner's open gaps |
| `docs/challenges/README.md` | deep-dive challenge manuals, environments, solutions, capstone |
| `infra/deploy/DEPLOY.md` | deploying to a VM |

## Warning

`labs/web` (the Trading Post) is **deliberately vulnerable**. It is a target, not
a product. Never run it outside the isolated lab network, and never on the same
host as sessions or database credentials.
