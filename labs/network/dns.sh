#!/bin/bash
# network / dns (mandatory): query a DNS server for the right record type.
# The flag is published as a TXT record. Find-type (dnsmasq serves the zone).
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-dns}"
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
dnsmasq -C /etc/dnsmasq-keep.conf 2>/dev/null || dnsmasq -C /etc/dnsmasq-keep.conf &

cat > "$S/README.txt" <<'TXT'
=== DNS records ===
A DNS server is running on 127.0.0.1. DNS holds more than addresses — TXT
records carry free-form text, and someone published the key in one.
  dig @127.0.0.1 keep.info TXT +short      # a hint
  dig @127.0.0.1 flag.keep TXT +short      # the key
  dig @127.0.0.1 vault.keep A +short       # addresses too, if you are curious
The TXT value of flag.keep is the key (BK{...}).
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
