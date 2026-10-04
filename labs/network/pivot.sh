#!/bin/bash
# network / pivot (hard): map a small network. Three hosts; each reveals the
# next hop. You start at a known host, follow the trail, and the final host
# hands over the key. Find-type chain.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-pivot}"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/netlib.py /opt/net/netlib.py 2>/dev/null || true

PORTB=$(( (RANDOM % 3000) + 5000 ))
PORTC=$(( (RANDOM % 3000) + 8000 ))
PASS="$(tr -dc 'a-z' </dev/urandom | head -c6)"

cat > /opt/net/server.py <<PY
import sys; sys.path.insert(0, '/opt/net')
from netlib import start, hold
FLAG = """$FLAG"""
PORTB, PORTC, PASS = $PORTB, $PORTC, "$PASS"

# Host .2 : entry point (known), hands out the next hop + a passphrase
start('127.0.0.2', 5000, lambda d:
      "recon host.\\nnext hop: 127.0.0.3 port %d\\npassphrase: %s\\n" % (PORTB, PASS))

# Host .3 : gives the final hop ONLY if you send the passphrase from .2
def h3(d):
    if PASS.encode() in d:
        return "accepted. final host: 127.0.0.4 port %d\\n" % PORTC
    return "denied: send the passphrase you found on the previous host.\\n"
start('127.0.0.3', PORTB, h3)

# Host .4 : the vault
start('127.0.0.4', PORTC, lambda d: "vault. key: " + FLAG + "\\n")
hold()
PY
python3 /opt/net/server.py &

cat > "$S/README.txt" <<'TXT'
=== Network Pivoting (hard) ===
During penetration testing, initial footholds often lead to internal network segments
and multi-hop infrastructure.

Begin your reconnaissance at 127.0.0.2:5000.
Follow the chain of services across internal network segments, discovering and supplying
the required authentication tokens to reach the final secure enclave and obtain the key.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG PASS
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
