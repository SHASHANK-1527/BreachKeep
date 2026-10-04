#!/bin/bash
# network / http (medium): speak HTTP by hand. The /vault endpoint returns the
# flag only when the request carries the right header. Find-type.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-http}"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/netlib.py /opt/net/netlib.py 2>/dev/null || true

cat > /opt/net/server.py <<PY
import sys; sys.path.insert(0, '/opt/net')
from netlib import start, hold
FLAG = """$FLAG"""
def http(body, code="200 OK"):
    return ("HTTP/1.1 %s\r\nContent-Type: text/plain\r\nContent-Length: %d\r\n"
            "Connection: close\r\n\r\n%s" % (code, len(body), body))
def resp(d):
    req = d.decode('latin1')
    first = req.split('\r\n', 1)[0]
    path = (first.split(' ') + ['', ''])[1]
    has_hdr = 'x-keep-access: open' in req.lower()
    if path.startswith('/vault'):
        if has_hdr:
            return http("vault open. key: " + FLAG + "\n")
        return http("forbidden: this endpoint needs the header  X-Keep-Access: open\n", "403 Forbidden")
    return http("Keep HTTP service.\nTry the /vault endpoint — but it will ask for a specific request header.\n")
start('127.0.0.1', 80, resp)
hold()
PY
python3 /opt/net/server.py &

cat > "$S/README.txt" <<'TXT'
=== HTTP Protocol Interaction ===
A local HTTP service is listening on port 80.

Interact directly with the web server, inspect its endpoints and HTTP responses,
and satisfy the application's access control requirements to access the vault and retrieve the key.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
