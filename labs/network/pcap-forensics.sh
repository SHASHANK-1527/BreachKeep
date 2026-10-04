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
=== Network Artifact Forensics (hard) ===
transfer.pcap captured an exfiltration or file transfer event over an HTTP session.
The transmitted payload has been encoded to evade simple string pattern detection.

Reconstruct the conversation from the packet capture, extract the transferred payload,
and decode the data to retrieve the flag.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
