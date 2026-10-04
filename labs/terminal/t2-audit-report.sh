#!/bin/bash
# terminal-2 / audit-report (hard): harden a box. Three planted misconfigurations
# must be FIXED (not exploited). The student is the admin here — given passwordless
# sudo as the tool — and the guard checks the hardened state. sudo => no-new-privs
# OFF (see dungeons.js ROOM_CAPS).
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-audit}"
S=/home/student

# Admin tool for the student (this is NOT one of the things to fix).
echo 'student ALL=(root) NOPASSWD: ALL' > /etc/sudoers.d/admin
chmod 440 /etc/sudoers.d/admin

# Three findings:
mkdir -p /opt/cron
echo '#!/bin/bash' > /opt/cron/job.sh; echo 'true' >> /opt/cron/job.sh
chown root:root /opt/cron/job.sh; chmod 666 /opt/cron/job.sh          # (1) world-writable root script
mkdir -p /srv/data; chown root:root /srv/data; chmod 0777 /srv/data   # (2) world-writable data dir
mkdir -p /etc/keep
echo 'db_password=keepmaster' > /etc/keep/secret.conf
chown root:root /etc/keep/secret.conf; chmod 644 /etc/keep/secret.conf # (3) world-readable secret

cat > "$S/README.txt" <<'TXT'
=== System Hardening Audit (hard) ===
You have been granted administrative privileges (sudo) to audit and remediate
security vulnerabilities on this system.

Conduct a security audit of the filesystem to identify and remediate three distinct
permission misconfigurations that violate security baseline standards:
  - An insecurely writable administrative script
  - An overly permissive public storage directory
  - An exposed system configuration file leaking credentials

Remediate all three issues using proper permission controls, then verify the system hardening:
  check
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag; chmod 600 /opt/bk/flag
cat > /opt/bk/verify.sh <<'V'
#!/bin/bash
msg=""
[ "$(stat -c '%A' /opt/cron/job.sh 2>/dev/null | cut -c9)" = "w" ] && msg="$msg /opt/cron/job.sh still world-writable;"
[ "$(stat -c '%A' /srv/data 2>/dev/null | cut -c9)" = "w" ]        && msg="$msg /srv/data still world-writable;"
[ "$(stat -c '%A' /etc/keep/secret.conf 2>/dev/null | cut -c8)" = "r" ] && msg="$msg /etc/keep/secret.conf still world-readable;"
[ -z "$msg" ] && exit 0
echo "still open:$msg"; exit 1
V
chmod 700 /opt/bk/verify.sh
nohup /usr/local/bin/bkverify >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
