#!/bin/bash
# terminal-2 / env (mandatory): environment variables live in config; read one.
# Answer guard: student submits the PIN found in the service config.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="KEY~3nv_v4r_s3cr3ts_devplaceholder01~"
S=/home/student
PIN=$(tr -dc 'A-Z0-9' </dev/urandom | head -c8)

# Selected fix: Preferred option — daemon process exports SERVICE_PIN in its environment; inspectable via /proc/<pid>/environ or ps eww
cat > /etc/keepservice.conf <<EOF
# keepd service configuration
export SERVICE_NAME=keepd
export SERVICE_MODE=prod
EOF
chmod 644 /etc/keepservice.conf

# Start background daemon as student with SERVICE_PIN in environment
su -s /bin/bash student -c "env -i SERVICE_NAME=keepd SERVICE_PIN='$PIN' SERVICE_MODE=prod python3 -c 'import time; time.sleep(86400)'" &

cat > "$S/README.txt" <<'TXT'
=== Environment Variable Secrets ===
A system daemon (keepd) is running in the background. Its operational parameters
and secret authentication PIN are stored directly inside its process environment.

Inspect the running processes and their environment variables (e.g. via ps eww or /proc/<pid>/environ)
to discover the secret SERVICE_PIN, then submit it:
  check <PIN>
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
