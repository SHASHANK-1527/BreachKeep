#!/bin/bash
# network / scan (mandatory): scan a target host and discover its services.
# The target 127.0.0.2 runs several services on non-obvious ports; one is the
# "keep" service that returns the flag. Find-type.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-scan}"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/netlib.py /opt/net/netlib.py 2>/dev/null || true

KEEP=$(( (RANDOM % 3000) + 6000 ))
A=$(( (RANDOM % 500) + 1200 )); B=$(( (RANDOM % 500) + 2500 )); C=$(( (RANDOM % 500) + 4500 ))

cat > /opt/net/server.py <<PY
import sys; sys.path.insert(0, '/opt/net')
from netlib import start, hold
FLAG = """$FLAG"""
start('127.0.0.2', $KEEP, lambda d: "keep-vault: " + FLAG + "\n")
start('127.0.0.2', $A, lambda d: "echo-service\n")
start('127.0.0.2', $B, lambda d: "time-service: 12:00\n")
start('127.0.0.2', $C, lambda d: "quote-service: stay curious\n")
hold()
PY
python3 /opt/net/server.py &

cat > "$S/README.txt" <<'TXT'
=== Port Scan ===
There is a target host on the lab network at 127.0.0.2. You do not know which
ports are open — find them, then identify the service that holds the key.
  nmap -sT -p 1-10000 127.0.0.2     # scan a wide range (SYN scan needs root; -sT does not)
  nc 127.0.0.2 <open-port>          # talk to each open port
The vault service prefixes its reply with "keep-vault:" and the key is BK{...}.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
