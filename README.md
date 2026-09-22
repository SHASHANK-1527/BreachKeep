# BreachKeep

The gated, story-based web platform for the Cyber eLabs cybersecurity course.
Students enter an access code, log in (email or Google), complete an introduction
module, get sorted into one of four houses, then work through dungeon challenges.

Built from the implementation spec (`BreachKeep-implementation-spec.md`).

## Monorepo layout
```
apps/api          Express + MongoDB — auth, access control, progress, house sorting, admin
apps/provisioner  Internal-only Docker controller for per-student challenge containers
apps/web          React + Vite SPA — served as two bundles (public landing + gated app)
labs/             Challenge build contexts (base image, Trading Post app, harness)
infra/            nginx reverse proxy + deploy notes
docs/             API.md, ROOMS.md
```

## Run locally (battle-testing)
```bash
cp .env.example .env          # fill the secrets marked "you must supply"
cd apps/api && npm install && npm test        # backend logic tests
cd ../web   && npm install && npm run build && npm run build:landing
cd ../..    && docker build -t breachkeep/base labs/base
docker compose up --build     # http://localhost:8080
```

## What you must supply before running
- `MONGODB_URI` (Atlas), `EMAIL_USER`/`EMAIL_PASS` (Gmail app password)
- `GOOGLE_CLIENT_ID` (Google Cloud OAuth Web client)
- Your chosen `COMMON_ACCESS_CODE`, `ADMIN_LANDING_CODE`, `ADMIN_SECRET_PATH`
- `ADMIN_PASSWORD_HASH` — `cd apps/api && npm run hash-admin "yourpassword"`
- Long random `JWT_SECRET`, `FLAG_HMAC_SECRET`, `PROVISIONER_SHARED_SECRET`

## Security model (summary)
- **Three surfaces:** public landing (access code only), gated app (served only with
  a gate cookie), hidden admin (random path + password).
- **First-time = no account.** Common code → registration; personal daily code →
  login. No device fingerprinting.
- **Server-authoritative everywhere:** identity from the session cookie (never the
  body), house assigned by the server once, flags are per-student HMACs, the
  provisioner is the only thing touching Docker (≤2 live dungeons).

## Status
- Backend + provisioner: complete, logic tested.
- Frontend: complete, both bundles build.
- Intro module: mounted with all fixes applied.
- Labs: base image + Trading Post app + secure-coding harness complete and proven;
  per-room challenge content is built weekly (see docs/ROOMS.md).
- Deployment to Linode is a documented manual step (infra/deploy/DEPLOY.md).

⚠️ The `labs/web` Trading Post app is deliberately vulnerable. Never run it outside
the isolated lab network.
