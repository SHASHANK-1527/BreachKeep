#!/bin/bash
# network / pivot (hard): map a small network. Three hosts; each reveals the
# next hop. You start at a known host, follow the trail, and the final host
# hands over the key. Find-type chain.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="FLAG((subn3t_p1v0t_4ch13v3d_devplaceholder01))"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/netlib.py /opt/net/netlib.py 2>/dev/null || true

PORTB=$(( (RANDOM % 3000) + 5000 ))
PORTC=$(( (RANDOM % 3000) + 8000 ))
PASS="$(tr -dc 'a-z' </dev/urandom | head -c6)"

# Network namespace setup to hide target ports from student ss / netstat
PIVOT_NETNS=0
HOST_A="10.200.2.2"
HOST_B="10.200.2.3"
HOST_C="10.200.2.4"

if ip netns add pivot 2>/dev/null; then
  PIVOT_NETNS=1
  ip link add veth-p0 type veth peer name veth-p1
  ip link set veth-p1 netns pivot
  ip addr add 10.200.2.1/24 dev veth-p0
  ip link set veth-p0 up
  ip netns exec pivot ip addr add 10.200.2.2/24 dev veth-p1
  ip netns exec pivot ip addr add 10.200.2.3/24 dev veth-p1
  ip netns exec pivot ip addr add 10.200.2.4/24 dev veth-p1
  ip netns exec pivot ip link set veth-p1 up
  ip netns exec pivot ip link set lo up
else
  # Fallback: bind aliases
  ip addr add 10.200.2.2/32 dev lo 2>/dev/null || true
  ip addr add 10.200.2.3/32 dev lo 2>/dev/null || true
  ip addr add 10.200.2.4/32 dev lo 2>/dev/null || true
fi

cat > /opt/net/server.py <<PY
import sys, random, string
sys.path.insert(0, '/opt/net')
from netlib import start, hold
FLAG = """$FLAG"""
PORTB, PORTC, PASS = $PORTB, $PORTC, "$PASS"
HOST_A, HOST_B, HOST_C = "$HOST_A", "$HOST_B", "$HOST_C"

active_tokens = set()

# Host A: entry point, hands out next hop + passphrase
start(HOST_A, 5000, lambda d:
      "recon host.\\nnext hop: %s port %d\\npassphrase: %s\\n" % (HOST_B, PORTB, PASS))

# Host B: verifies passphrase and mints a short-lived token for Hop 3
def h2(d):
    if PASS.encode() in d:
        token = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        active_tokens.add(token)
        return "accepted. final host: %s port %d token: %s\\n" % (HOST_C, PORTC, token)
    return "denied: send the passphrase you found on the previous host.\\n"
start(HOST_B, PORTB, h2)

# Host C: strictly requires the session token minted by Hop 2 before releasing flag
def h3(d):
    for tok in list(active_tokens):
        if tok.encode() in d:
            active_tokens.remove(tok)
            return "vault. key: " + FLAG + "\\n"
    return "denied\\n"
start(HOST_C, PORTC, h3)

hold()
PY

if [ "$PIVOT_NETNS" -eq 1 ]; then
  ip netns exec pivot python3 /opt/net/server.py &
else
  python3 /opt/net/server.py &
fi

cat > "$S/README.txt" <<'TXT'
=== Network Pivoting (hard) ===
During penetration testing, initial footholds often lead to internal network segments
and multi-hop infrastructure.

Begin your reconnaissance at 10.200.2.2:5000.
Follow the chain of services across internal network segments, discovering and supplying
the required authentication credentials and tokens to reach the final secure enclave and obtain the key.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG PASS
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
