#!/bin/bash
# network / dns (mandatory): query a DNS server for the right record type.
# The flag is published as a TXT record. Find-type (dnsmasq serves the zone).
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="ARCHIVE::dns_z0n3_tr4nsf3r_devplaceholder01::"
S=/home/student

cat > /etc/dnsmasq-keep.conf <<CONF
port=53
listen-address=127.0.0.1
bind-interfaces
no-resolv
no-hosts
txt-record=flag.keep,$FLAG
txt-record=keep.info,the key is a TXT record named flag.keep
address=/gateway.keep/127.0.0.1
address=/vault.keep/127.0.0.2
CONF
chown root:root /etc/dnsmasq-keep.conf
chmod 600 /etc/dnsmasq-keep.conf
dnsmasq -C /etc/dnsmasq-keep.conf 2>/dev/null || dnsmasq -C /etc/dnsmasq-keep.conf &

cat > "$S/README.txt" <<'TXT'
=== DNS Enumeration ===
A local DNS nameserver is operational on 127.0.0.1.
Information disclosure frequently occurs through misconfigured or descriptive
resource records published on internal zones.

Query the local DNS server for records within the .keep zone to uncover the key.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
