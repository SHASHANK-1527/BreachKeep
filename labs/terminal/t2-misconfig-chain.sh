#!/bin/bash
# terminal-2 / misconfig-chain (hard): two small misconfigurations that are only
# dangerous together — a privileged runner that executes every script in a
# directory, and that directory being world-writable. A simulated cron runs the
# runner as root; the student drops a plugin that reveals the root-only flag.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-chain}"
S=/home/student

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag; chmod 600 /opt/bk/flag

mkdir -p /opt/chain/plugins
cat > /opt/chain/run.sh <<'R'
#!/bin/bash
# (root) runs every *.sh plugin, on a timer. This file itself is locked down.
for p in /opt/chain/plugins/*.sh; do [ -f "$p" ] && bash "$p" >/dev/null 2>&1; done
R
chown root:root /opt/chain/run.sh; chmod 755 /opt/chain/run.sh   # NOT writable: looks safe
chmod 0777 /opt/chain/plugins                                    # the real hole: writable plugin dir
: > /var/log/keepchain.log; chmod 666 /var/log/keepchain.log

cat > "$S/README.txt" <<'TXT'
=== Misconfiguration chain ===
Two things here are individually "fine" but together are not:
  1. A root job runs every script in  /opt/chain/plugins/  on a timer.
  2. Look at the permissions on that directory:   ls -ld /opt/chain/plugins
run.sh itself is locked down — but it will happily run a plugin YOU add. Place a
plugin that copies the root-only key (/opt/bk/flag) somewhere you can read it,
wait a few seconds, and collect it.
TXT
chown root:root "$S/README.txt"

( while true; do bash /opt/chain/run.sh >/dev/null 2>&1 || true; sleep 5; done ) &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
