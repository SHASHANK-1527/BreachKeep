#!/bin/bash
# network / protocol-id (medium): a capture holds several protocols; identify
# which one carried a cleartext password. Answer guard: submit the protocol.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-proto}"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/mkpcap.py /opt/net/mkpcap.py 2>/dev/null || true

python3 - <<'PY'
import sys; sys.path.insert(0, '/opt/net')
from mkpcap import build_pcap
pkts = [
  # HTTP on 80 — a plain GET, no credentials
  ('10.0.0.7','10.0.0.9',40001,80,'GET /index.html HTTP/1.1\r\nHost: keep\r\n\r\n'),
  # SMTP on 25 — mail envelope, still no password
  ('10.0.0.7','10.0.0.9',40002,25,'MAIL FROM:<ops@keep>\r\nRCPT TO:<admin@keep>\r\n'),
  # FTP on 21 — cleartext login: a username AND a password
  ('10.0.0.7','10.0.0.9',40003,21,'USER quartermaster\r\n'),
  ('10.0.0.9','10.0.0.7',21,40003,'331 password required\r\n'),
  ('10.0.0.7','10.0.0.9',40003,21,'PASS s3cr3t-stores\r\n'),
]
build_pcap('/home/student/traffic.pcap', pkts)
PY
chown student:student /home/student/traffic.pcap

cat > "$S/README.txt" <<'TXT'
=== Protocol Identification ===
The file traffic.pcap contains captured sessions across multiple standard application protocols.
One of the communications transmitted sensitive authentication credentials (a password) in plaintext.

Inspect the traffic capture, determine which protocol transmitted the cleartext password,
and submit the lowercase protocol name:
  check <protocol>
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag;  chmod 600 /opt/bk/flag
printf 'ftp'        > /opt/bk/expected; chmod 600 /opt/bk/expected
nohup /usr/local/bin/bkguard >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
