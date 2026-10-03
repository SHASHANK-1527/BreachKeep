#!/bin/bash
# Shared web-room entrypoint. Runs the Trading Post as the 'webapp' user (so the
# 'student' shell cannot read the flag out of the app process's env), and gives
# the student a ttyd shell with the flag removed. BK_ROOM is baked per room in
# the image ENV; BK_FLAG is injected per student by the provisioner.
set -e

# Start the vulnerable web app as 'webapp' on :8080, carrying the room + flag.
setpriv --reuid webapp --regid webapp --init-groups \
  env BK_ROOM="${BK_ROOM:-}" BK_FLAG="${BK_FLAG:-}" PORT=8080 \
  node /app/server.js >/tmp/trading-post.log 2>&1 &

# A short in-container note; full brief/hints live on the room page.
cat > /home/student/README.txt <<'TXT'
=== Web room ===
A deliberately vulnerable web app (the "Trading Post") is running for you.
  - From this shell:   curl -i http://localhost:8080/        (start at /robots.txt)
  - In your browser:   use the "Open web app" button on the room page
The room page has the story, your objective, and graded hints. When you recover
the key (BK{...}) through the intended flaw, submit it on the room page.
TXT
chown student:student /home/student/README.txt 2>/dev/null || true

# Student shell: no BK_FLAG / BK_ROOM in its environment.
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG -u BK_ROOM \
  ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
