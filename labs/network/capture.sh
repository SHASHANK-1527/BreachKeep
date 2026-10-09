#!/bin/bash
# network / capture (mandatory): read a packet capture and find a plaintext
# credential. The flag is the password in an HTTP POST. Find-type.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="RUNE/p4ck3t_sn1ff3r_devplaceholder01/"
S=/home/student
mkdir -p /opt/net; cp /usr/local/lib/bk/mkpcap.py /opt/net/mkpcap.py 2>/dev/null || true

python3 - "$FLAG" <<'PY'
import sys, gzip
sys.path.insert(0, '/opt/net')
from mkpcap import build_pcap
flag = sys.argv[1]

# Gzip-compress the POST body so raw strings/grep on the pcap returns garbage
body = ("username=quartermaster&password=" + flag + "\r\n").encode('utf-8')
comp_body = gzip.compress(body)

post_hdr = (
    "POST /login HTTP/1.1\r\n"
    "Host: shop.keep\r\n"
    "Content-Type: application/x-www-form-urlencoded\r\n"
    "Content-Encoding: gzip\r\n"
    "Content-Length: %d\r\n\r\n" % len(comp_body)
).encode('latin1')

pkts = [
  ('10.0.0.50','10.0.0.9',49201,80, b'GET /style.css HTTP/1.1\r\nHost: shop.keep\r\n\r\n'),
  ('10.0.0.50','10.0.0.9',49202,80, post_hdr + comp_body),
  ('10.0.0.50','10.0.0.9',49203,80, b'HTTP/1.1 200 OK\r\nHost: shop.keep\r\nContent-Type: text/html\r\n\r\n<h1>OK</h1>'),
]
build_pcap('/home/student/capture.pcap', pkts)
PY
chown student:student /home/student/capture.pcap

cat > "$S/README.txt" <<'TXT'
=== Packet Analysis ===
The file capture.pcap contains recorded network traffic of an authentication
session conducted over HTTP with compressed stream payloads.

Analyze the packet capture with network analysis tools (e.g. tshark or Wireshark),
reassemble the transmitted HTTP stream or export HTTP objects, and decompress the payload
to recover the authentic key.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
