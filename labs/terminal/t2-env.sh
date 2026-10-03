#!/bin/bash
# terminal-2 / env (mandatory): environment variables live in config; read one.
# Answer guard: student submits the PIN found in the service config.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-env}"
S=/home/student
PIN=$(tr -dc 'A-Z0-9' </dev/urandom | head -c8)

cat > /etc/keepservice.conf <<EOF
# keepd service configuration
export SERVICE_NAME=keepd
export SERVICE_PIN=$PIN
export SERVICE_MODE=prod
EOF
chmod 644 /etc/keepservice.conf

cat > "$S/README.txt" <<'TXT'
=== Environment variables ===
A service stores its settings as environment variables in a config file. One is
its PIN. Find the config, read the PIN, and submit it:
  grep -ril pin /etc 2>/dev/null
  cat /etc/keepservice.conf
  check <the PIN>
Tip: `source /etc/keepservice.conf` then `echo "$SERVICE_PIN"` prints it too.
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag;      chmod 600 /opt/bk/flag
printf '%s' "$PIN"  > /opt/bk/expected;  chmod 600 /opt/bk/expected
cat > /opt/bk/verify.sh <<'V'
#!/bin/bash
[ "$1" = "$(cat /opt/bk/expected)" ] && exit 0
echo "that is not the service PIN"; exit 1
V
chmod 700 /opt/bk/verify.sh
nohup /usr/local/bin/bkverify >/dev/null 2>&1 &

unset BK_FLAG FLAG PIN
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
