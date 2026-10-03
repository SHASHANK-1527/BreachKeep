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
=== Pivot the network ===
You have a foothold on one host; the key is on another you cannot see yet. Each
host tells you how to reach the next.
  START HERE:  nc 127.0.0.2 5000
It names the next host, a port, and a passphrase. Connect to that next host and
SEND it the passphrase (type it and press enter, or: printf 'pass\n' | nc host port).
That host reveals the FINAL host and port — connect there for the key (BK{...}).
Keep notes: host -> next host -> final host.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG PASS
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
