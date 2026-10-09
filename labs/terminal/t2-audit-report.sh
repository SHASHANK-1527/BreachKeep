#!/bin/bash
# terminal-2 / audit-report (hard): harden a box. Three planted misconfigurations
# must be FIXED (not exploited). The student is the admin here — given passwordless
# sudo as the tool — and the guard checks the hardened state. sudo => no-new-privs
# OFF (see dungeons.js ROOM_CAPS).
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-audit}"
S=/home/student

# Admin tool for the student scoped to remediation commands (NOT a universal root shell).
echo 'student ALL=(root) NOPASSWD: /bin/chmod, /usr/bin/chmod, /bin/stat, /usr/bin/stat, /usr/bin/find, /bin/chown, /usr/bin/chown' > /etc/sudoers.d/admin
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
  - An insecurely writable administrative script (/opt/cron/job.sh -> mode 755)
  - An overly permissive public storage directory (/srv/data -> mode 755)
  - An exposed system configuration file leaking credentials (/etc/keep/secret.conf -> mode 600)

Remediate all three issues using proper permission controls, then verify the system hardening:
  check
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag; chmod 600 /opt/bk/flag
cat > /opt/bk/verify.sh <<'V'
#!/bin/bash
msg=""
mode_job="$(stat -c '%a' /opt/cron/job.sh 2>/dev/null)"
mode_srv="$(stat -c '%a' /srv/data 2>/dev/null)"
mode_sec="$(stat -c '%a' /etc/keep/secret.conf 2>/dev/null)"

[ "$mode_job" = "755" ] || msg="$msg /opt/cron/job.sh mode is ${mode_job:-missing} (expected 755);"
[ "$mode_srv" = "755" ] || msg="$msg /srv/data mode is ${mode_srv:-missing} (expected 755);"
[ "$mode_sec" = "600" ] || msg="$msg /etc/keep/secret.conf mode is ${mode_sec:-missing} (expected 600);"

[ -z "$msg" ] && exit 0
echo "hardening incomplete:$msg"; exit 1
V
chmod 700 /opt/bk/verify.sh
nohup /usr/local/bin/bkverify >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
