#!/bin/bash
# terminal-2 / path-order (medium): why the ORDER of directories in PATH matters
# for a command a privileged job calls by bare name. Answer guard: the student
# identifies the writable directory that sits BEFORE the system dirs — the one
# an attacker would plant a fake binary in.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="SEAL|p4th_h1j4ck_pr0_devplaceholder01|"
S=/home/student

mkdir -p /opt/service /home/student/bin
chown student:student /home/student/bin
chmod 755 /home/student/bin

cat > /opt/service/run.conf <<'C'
# keepd runner config
DESC="runs the collector as root on a timer"
PATH=/home/student/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
CMD=collect        # called by bare name, so it is resolved via PATH above
C
cat > /opt/service/run.sh <<'R'
#!/bin/bash
# (root) loads the config and runs CMD by its bare name on a 5-second loop
while true; do
  set -a; . /opt/service/run.conf; set +a
  resolved="$(command -v "$CMD" 2>/dev/null || which "$CMD" 2>/dev/null || true)"
  if [ "$resolved" = "/home/student/bin/collect" ] && [ -x "$resolved" ]; then
    "$resolved" 2>/dev/null || true
    echo "HIJACKED_EXECUTED" > /opt/bk/hijack_status
  else
    "$CMD" 2>/dev/null || true
  fi
  sleep 5
done
R
chmod 755 /opt/service/run.conf /opt/service/run.sh
nohup /opt/service/run.sh >/dev/null 2>&1 &

cat > "$S/README.txt" <<'TXT'
=== PATH Evaluation & Hijacking ===
A privileged runner executes `/opt/service/run.sh` as root every 5 seconds.
It executes `collect` by its bare name, evaluating directories in the PATH order
configured in /opt/service/run.conf.

Exploit this PATH precedence vulnerability by planting an executable script at
`/home/student/bin/collect` (remember `chmod +x`). Once the service executes your
hijacked binary, verify the exploit:
  check
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag; chmod 600 /opt/bk/flag
cat > /opt/bk/verify.sh <<'V'
#!/bin/bash
if [ ! -f /home/student/bin/collect ]; then
  echo "no script found at /home/student/bin/collect"; exit 1
fi
if [ ! -x /home/student/bin/collect ]; then
  echo "/home/student/bin/collect is not executable (chmod +x needed)"; exit 1
fi
if [ ! -f /opt/bk/hijack_status ] || [ "$(cat /opt/bk/hijack_status 2>/dev/null)" != "HIJACKED_EXECUTED" ]; then
  echo "binary placed, but not yet executed by the root service runner (runs every 5s; wait a moment)"; exit 1
fi
exit 0
V
chmod 700 /opt/bk/verify.sh
nohup /usr/local/bin/bkverify >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
