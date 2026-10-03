# Deploying BreachKeep to Linode (manual)

Do NOT run this from the build agent — it needs your real credentials.

1. **Create the Linode close to Class 1** (the $100 credit expires 60 days after
   account creation). A shared-CPU 2GB plan is enough to start.
2. **Install Docker + Compose** on the instance.
3. **Clone the repo** and create a real `.env` from `.env.example`. Fill:
   - `MONGODB_URI` (MongoDB Atlas free tier connection string)
   - `EMAIL_USER` / `EMAIL_PASS` (Gmail app password)
   - `GOOGLE_CLIENT_ID` (+ add your prod origin in Google Cloud Console)
   - `COMMON_ACCESS_CODE`, `ADMIN_LANDING_CODE`, `ADMIN_SECRET_PATH`
   - `ADMIN_PASSWORD_HASH` — run `npm run hash-admin "yourpassword"` in apps/api.
     Paste the output into `.env` VERBATIM, keeping single `$` characters. Do NOT
     escape them to `$$` — env_file values are literal, so doubling corrupts the
     hash and admin login fails with "Wrong password". (The API now also
     tolerates a doubled hash by collapsing `$$`→`$`, but keep it single.)
   - long random `JWT_SECRET`, `FLAG_HMAC_SECRET`, `PROVISIONER_SHARED_SECRET`
   - set `VITE_ADMIN_PATH` = `ADMIN_SECRET_PATH` before building the web bundle
4. **Build the base lab image**: `docker build -t breachkeep/base labs/base`
5. **Start the stack**: `docker compose up -d --build`
6. **DNS + TLS**: point your domain at the Linode; run Certbot for Let's Encrypt;
   add the TLS server block to nginx and set `secure` cookies (NODE_ENV=production
   already does this).
7. **Cost note**: powering a machine off does NOT stop billing — only deleting it
   does. Keep the lightweight box running for the term; delete the capstone box
   right after Class 6. Skip paid backups for disposable challenge boxes (the repo
   is the source of truth).
8. **Weekly dungeon switch**: in the Warden panel, turn on the two dungeons for the
   coming weekend (max 2). The provisioner builds their images; turn last week's off
   to reclaim space.
