#!/bin/bash
# network / pcap-forensics (hard): a file was downloaded over HTTP in the
# capture; its body is base64-encoded, so grepping for BK{ fails. Recover and
# decode the transferred content. Find-type.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-forensics}"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/mkpcap.py /opt/net/mkpcap.py 2>/dev/null || true

python3 - "$FLAG" <<'PY'
import sys, base64; sys.path.insert(0, '/opt/net')
from mkpcap import build_pcap
flag = sys.argv[1]
b64 = base64.b64encode(("recovered-file\nkey: %s\n" % flag).encode()).decode()
# A client requested a file; the server sent it back base64-encoded. One stream.
req = 'GET /backup HTTP/1.1\r\nHost: files.keep\r\n\r\n'
resp = ('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n'
        'file: backup.b64\n' + b64 + '\n')
pkts = [
  ('10.0.0.60','10.0.0.9',50010,80, req),
  ('10.0.0.9','10.0.0.60',80,50010, resp),
]
build_pcap('/home/student/transfer.pcap', pkts)
PY
chown student:student /home/student/transfer.pcap

cat > "$S/README.txt" <<'TXT'
=== PCAP forensics ===
transfer.pcap captured a file being downloaded. Its contents were base64-encoded
on the wire, so searching for BK{ directly will NOT find the key — you must
recover the transferred text and DECODE it.
Follow the TCP stream to read what was sent:
  tshark -q -r transfer.pcap -z follow,tcp,ascii,0
You will see a line of base64 (a long run of letters/digits, maybe ending in =).
Copy that line and decode it:
  echo '<that base64 line>' | base64 -d
The decoded text contains the key (BK{...}).
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
