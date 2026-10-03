#!/bin/bash
# terminal-2 / cron-watch (medium): a privileged scheduled job that trusts a
# world-writable script. A simulated cron runs /opt/cron/job.sh as root every
# few seconds; the student makes it reveal the root-only flag. No answer guard —
# the student's injected line runs AS ROOT and can read the flag itself.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-cron}"
S=/home/student

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag; chmod 600 /opt/bk/flag

mkdir -p /opt/cron
cat > /opt/cron/job.sh <<'J'
#!/bin/bash
# "nightly maintenance" — runs as root on a timer.
echo "[cron] maintenance ran at $(date -u)" >> /var/log/keepcron.log 2>/dev/null
J
chmod 666 /opt/cron/job.sh            # the misconfiguration: world-writable
: > /var/log/keepcron.log; chmod 666 /var/log/keepcron.log

cat > "$S/README.txt" <<'TXT'
=== Cron: what runs as root ===
A maintenance job runs as ROOT every few seconds:  /opt/cron/job.sh
Check who can write it:
  ls -l /opt/cron/job.sh
Whatever is in that script, root will run. If you can write to it, you can make
root do something on your behalf — like place the root-only key where you can
read it. Add your line, wait a few seconds, then read your result.
TXT
chown root:root "$S/README.txt"

# simulated cron: root runs the (writable) job every 5s
( while true; do bash /opt/cron/job.sh >/dev/null 2>&1; sleep 5; done ) &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
