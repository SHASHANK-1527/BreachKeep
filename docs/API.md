# BreachKeep API

All responses are JSON. App routes require cookies (`credentials: 'include'`).
Unauthenticated app routes return **404** (never 403) so structure isn't confirmed.

## Cookies
- `bk_gate` — access gate. `{ mode: 'register'|'session', code? }`. Set by the landing page.
- `bk_session` — logged-in session. `{ uid, role }`.
- `bk_admin` — admin session (issued after the admin password).

## Auth
| Method | Path | Gate | Body | Notes |
|---|---|---|---|---|
| POST | /api/auth/verify-access-code | — | {code} | admin code→{redirect}; common→register gate; daily→session gate |
| POST | /api/auth/signup | register | {username,email,password} | roster-gated; 409 if exists |
| POST | /api/auth/verify | register | {email,code} | issues session |
| POST | /api/auth/login | session | {email,password} | daily code (from gate) must match account |
| POST | /api/auth/google | register/session | {idToken} | verified server-side |
| GET | /api/auth/me | session | — | safe user object only |
| POST | /api/auth/logout | session | — | |
| POST | /api/auth/update-username\|password\|avatar | session | | identity from session, never body |
| POST | /api/auth/delete-account | session | — | |
| POST | /api/auth/forgot-password | — | {email} | non-enumerating |
| POST | /api/auth/reset-password | — | {token,password} | |

## Access / Intro / Flags / House
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | /api/access/resend-daily | — | non-enumerating, rate-limited |
| POST | /api/intro/complete | session | {roomId}; sets introComplete when all 3 done |
| GET | /api/intro/status | session | |
| POST | /api/flags/submit | session | {roomId,flag}; HMAC-checked |
| GET | /api/progress | session | {solved[], unlocked[]} |
| POST | /api/house/assign | session | balanced, idempotent, needs introComplete |

## Admin (all behind bk_admin)
| Method | Path | Notes |
|---|---|---|
| POST | /api/admin/login | {password} |
| GET | /api/admin/state | flags + live dungeons + house counts |
| POST | /api/admin/common-code | {enabled} — enable/disable first-time code |
| POST | /api/admin/roster-gate | {enabled} |
| POST | /api/admin/roster | {emails[],mode} |
| POST | /api/admin/dungeons | {dungeonId,live} — max 2 live |
