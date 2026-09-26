# BreachKeep API

All responses are JSON. App routes require cookies (`credentials: 'include'`).
Unauthenticated app routes return **404**, never 403, so the structure of the
app can't be mapped by probing.

## Cookies

| Cookie | Holds | Set by |
|---|---|---|
| `bk_gate` | `{ mode: 'register' \| 'session', code? }` | the access-code check |
| `bk_session` | `{ uid, role }` | login / signup verification |
| `bk_admin` | admin scope, 8h | the admin password |

All three are `httpOnly`. In production they are also `secure`, so **nothing
works over plain HTTP** once `NODE_ENV=production`.

## Public — no gate, no session

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | liveness. Also what you hit to wake a sleeping free-tier host |
| GET | `/api/status` | `{ maintenance, message, eta }` — the kill switch, polled by both web bundles |
| POST | `/api/auth/verify-access-code` | `{code}`. Admin code → `{redirect}`; common code → register gate; personal daily code → session gate |
| POST | `/api/access/resend-daily` | `{email}`. Non-enumerating, rate-limited |

These four, plus everything under `/api/admin`, are the only routes that keep
answering while maintenance mode is on. Every other route below returns
**503 `{ error: 'maintenance' }`** with a `Retry-After` header.

## Auth

| Method | Path | Gate | Body | Notes |
|---|---|---|---|---|
| POST | `/api/auth/signup` | register | `{username,email,password}` | roster-gated; 409 if the account exists |
| POST | `/api/auth/verify` | register | `{email,code}` | issues the session |
| POST | `/api/auth/login` | session | `{email,password}` | the daily code from the gate must match the account |
| POST | `/api/auth/google` | register/session | `{idToken}` | verified server-side against `GOOGLE_CLIENT_ID` |
| GET | `/api/auth/me` | session | — | safe user object only |
| POST | `/api/auth/logout` | session | — | |
| POST | `/api/auth/update-username` | session | `{username}` | identity from the session, never the body |
| POST | `/api/auth/update-password` | session | `{currentPassword,newPassword}` | |
| POST | `/api/auth/update-avatar` | session | `{avatar}` | |
| POST | `/api/auth/delete-account` | session | — | |
| POST | `/api/auth/forgot-password` | — | `{email}` | non-enumerating |
| POST | `/api/auth/reset-password` | — | `{token,password}` | |

## Progress

| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/intro/complete` | session | `{roomId}`. Sets `introComplete` once all three are done |
| GET | `/api/intro/status` | session | |
| POST | `/api/flags/submit` | session | `{roomId,flag}`. HMAC-checked per student |
| GET | `/api/progress` | session | `{solved[], unlocked[]}` |
| POST | `/api/house/assign` | session | Balanced, idempotent, requires `introComplete` |

## Admin

Everything below sits behind `bk_admin` and answers 404 without it.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/admin/login` | `{password}`, checked against `ADMIN_PASSWORD_HASH`. Rate-limited hard |
| POST | `/api/admin/logout` | |
| GET | `/api/admin/where` | returns `ADMIN_SECRET_PATH` |
| GET | `/api/admin/state` | gates, maintenance, live dungeons, house counts |
| GET | `/api/admin/overview` | cohort counts for the dashboard |
| POST | `/api/admin/maintenance` | `{enabled, message?, eta?}` — **the kill switch** |
| POST | `/api/admin/common-code` | `{enabled}` |
| POST | `/api/admin/roster-gate` | `{enabled}` |
| GET | `/api/admin/roster` | |
| POST | `/api/admin/roster` | `{emails[], mode: 'replace'\|'append'}` |
| POST | `/api/admin/roster-remove` | `{emails[]}` |
| POST | `/api/admin/dungeons` | `{dungeonId, live}`. At most 2 live; calls the provisioner |
| GET | `/api/admin/students` | `?q=` searches username and email |
| GET | `/api/admin/students/:id` | student plus their solve history |
| POST | `/api/admin/students/:id/house` | `{house}`. Also marks the intro complete |
| POST | `/api/admin/students/:id/reset-progress` | clears solved rooms and intro state |
| POST | `/api/admin/students/:id/delete` | removes the student and their progress |

## Maintenance mode

`POST /api/admin/maintenance {enabled:true}` closes the site for everyone:

- every student-facing route answers 503 — no registration, login, intro
  progress or flag submission
- both web bundles poll `/api/status` and swap to the maintenance page; anyone
  already inside is moved there on their next action
- the admin surface stays up, so it is always reversible from the panel
- nothing is deleted — accounts, progress and houses are untouched

The flag is cached in memory for 5 seconds, so a flip takes effect everywhere
within about five seconds without a restart.
