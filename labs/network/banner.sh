#!/bin/bash
# network / banner (mandatory): grab a service banner and read its version.
# Answer guard: submit the version string.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-banner}"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/netlib.py /opt/net/netlib.py 2>/dev/null || true

PORT=$(( (RANDOM % 3000) + 5000 ))
VER="$(( (RANDOM % 6) + 2 )).$(( RANDOM % 10 )).$(( RANDOM % 20 ))"

cat > /opt/net/server.py <<PY
import sys; sys.path.insert(0, '/opt/net')
from netlib import start, hold
start('127.0.0.1', $PORT, lambda d: "220 KeepFTP $VER ready\r\n", read_first=False)
hold()
PY
python3 /opt/net/server.py &

cat > "$S/README.txt" <<TXT
=== Service Banner Enumeration ===
A service is listening on 127.0.0.1 port $PORT. Services frequently disclose
software identity and version metadata upon establishing a connection.

Connect to the service, inspect the service banner, and submit the isolated
version number:
  check <version>
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag;  chmod 600 /opt/bk/flag
printf '%s' "$VER"  > /opt/bk/expected; chmod 600 /opt/bk/expected
nohup /usr/local/bin/bkguard >/dev/null 2>&1 &

unset BK_FLAG FLAG VER
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
