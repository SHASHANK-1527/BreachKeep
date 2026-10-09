#!/bin/bash
# network / scan (mandatory): scan a target host and discover its services.
# The target 127.0.0.2 runs several services on non-obvious ports; one is the
# "keep" service that returns the flag. Find-type.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="ARCHIVE::nm4p_sw33p_m4st3r_devplaceholder01::"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/netlib.py /opt/net/netlib.py 2>/dev/null || true

KEEP=$(( (RANDOM % 3000) + 6000 ))
A=$(( (RANDOM % 500) + 1200 )); B=$(( (RANDOM % 500) + 2500 )); C=$(( (RANDOM % 500) + 4500 ))

TARGET_IP="10.200.1.2"
USE_NETNS=0
if ip netns add target 2>/dev/null; then
  USE_NETNS=1
  ip link add veth0 type veth peer name veth1
  ip link set veth1 netns target
  ip addr add 10.200.1.1/24 dev veth0
  ip link set veth0 up
  ip netns exec target ip addr add 10.200.1.2/24 dev veth1
  ip netns exec target ip link set veth1 up
  ip netns exec target ip link set lo up
fi
echo "$TARGET_IP target.keep" >> /etc/hosts

cat > /opt/net/server.py <<PY
import sys; sys.path.insert(0, '/opt/net')
from netlib import start, hold
FLAG = """$FLAG"""
start('$TARGET_IP', $KEEP, lambda d: "keep-vault: " + FLAG + "\n")
start('$TARGET_IP', $A, lambda d: "echo-service\n")
start('$TARGET_IP', $B, lambda d: "time-service: 12:00\n")
start('$TARGET_IP', $C, lambda d: "quote-service: stay curious\n")
hold()
PY

if [ "$USE_NETNS" -eq 1 ]; then
  ip netns exec target python3 /opt/net/server.py &
else
  ip addr add "$TARGET_IP/32" dev lo 2>/dev/null || true
  python3 /opt/net/server.py &
fi

cat > "$S/README.txt" <<'TXT'
=== Remote Host Reconnaissance ===
A remote target host is active on the lab network at target.keep (10.200.1.2).
Multiple non-standard ports are bound to various services, one of which
houses the vault service.

Scan the target host across port range 1-10000 (e.g. nmap -sT -p 1-10000 target.keep),
inspect responding services, and recover the flag from the vault service.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
