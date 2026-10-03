#!/bin/bash
# network / capture (mandatory): read a packet capture and find a plaintext
# credential. The flag is the password in an HTTP POST. Find-type.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-capture}"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/mkpcap.py /opt/net/mkpcap.py 2>/dev/null || true

python3 - "$FLAG" <<'PY'
import sys; sys.path.insert(0, '/opt/net')
from mkpcap import build_pcap
flag = sys.argv[1]
pkts = [
  ('10.0.0.50','10.0.0.9',49201,80,'GET /style.css HTTP/1.1\r\nHost: shop.keep\r\n\r\n'),
  ('10.0.0.50','10.0.0.9',49202,80,
   'POST /login HTTP/1.1\r\nHost: shop.keep\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\n'
   'username=quartermaster&password=%s\r\n' % flag),
  ('10.0.0.50','10.0.0.9',49203,80,'GET /dashboard HTTP/1.1\r\nHost: shop.keep\r\n\r\n'),
]
build_pcap('/home/student/capture.pcap', pkts)
PY
chown student:student /home/student/capture.pcap

cat > "$S/README.txt" <<'TXT'
=== Packet Capture ===
capture.pcap recorded a user logging in to a site over plain HTTP — so their
password crossed the wire in the clear. Open the capture and find it.
  tshark -r capture.pcap                       # overview: 3 packets, one is a POST
  tshark -r capture.pcap -Y http               # just the HTTP requests
Now read the POST login in plain text by following its TCP stream (it is the
2nd conversation, index 1):
  tshark -q -r capture.pcap -z follow,tcp,ascii,1
You will see  username=...&password=...  — that password is the key (BK{...}).
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
