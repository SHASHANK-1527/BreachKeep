#!/bin/bash
# network / firewall (medium): read an iptables ruleset and work out which one
# inbound port is actually allowed through. Answer guard: submit the port.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-fw}"
S=/home/student

ALLOW=$(( (RANDOM % 50000) + 2000 ))
NOISE1=$(( (RANDOM % 50000) + 2000 )); NOISE2=$(( (RANDOM % 50000) + 2000 ))
mkdir -p /etc/keep
cat > /etc/keep/rules.v4 <<RULES
# iptables-save — keepd edge firewall
*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]
# allow established/related replies
-A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT
# allow loopback
-A INPUT -i lo -j ACCEPT
# log-and-drop some probes (these are NOT allowed through)
-A INPUT -p tcp --dport $NOISE1 -j LOG --log-prefix "probe1 "
-A INPUT -p tcp --dport $NOISE1 -j DROP
-A INPUT -p tcp --dport $NOISE2 -j REJECT
# the ONE service exposed to the world
-A INPUT -p tcp --dport $ALLOW -j ACCEPT
COMMIT
RULES
chmod 644 /etc/keep/rules.v4

cat > "$S/README.txt" <<'TXT'
=== Firewall Policy Analysis ===
The firewall configuration in /etc/keep/rules.v4 defines packet filtering rules
for an edge firewall. The default policy drops incoming traffic unless explicitly permitted.

Analyze the ruleset to determine which external TCP service port is permitted through
the firewall.
Submit the port number:
  check <port>
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG"   > /opt/bk/flag;     chmod 600 /opt/bk/flag
printf '%s' "$ALLOW"  > /opt/bk/expected; chmod 600 /opt/bk/expected
nohup /usr/local/bin/bkguard >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
