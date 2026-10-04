#!/bin/bash
# network / ports (mandatory): enumerate listening services on the host and
# connect to the right one. Several services listen on localhost; one hands
# back the flag, the rest are decoys. Find-type.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-ports}"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/netlib.py /opt/net/netlib.py 2>/dev/null || true

FLAGPORT=$(( (RANDOM % 4000) + 4000 ))
D1=$(( (RANDOM % 1000) + 2000 )); D2=$(( (RANDOM % 1000) + 3000 )); D3=$(( (RANDOM % 1000) + 8000 ))

cat > /opt/net/server.py <<PY
import sys; sys.path.insert(0, '/opt/net')
from netlib import start, hold
FLAG = """$FLAG"""
start('127.0.0.1', $FLAGPORT, lambda d: FLAG + "\n")
start('127.0.0.1', $D1, lambda d: "keep-metrics: ok\n")
start('127.0.0.1', $D2, lambda d: "keep-health: alive\n")
start('127.0.0.1', $D3, lambda d: "nothing to see here\n")
hold()
PY
python3 /opt/net/server.py &

cat > "$S/README.txt" <<'TXT'
=== Local Port Enumeration ===
Several network services are bound and listening on localhost (127.0.0.1).
Most of these provide routine operational metrics, but one hosts the vault service.

Enumerate the active listening TCP ports, interact with the services,
and identify the port delivering the key.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
