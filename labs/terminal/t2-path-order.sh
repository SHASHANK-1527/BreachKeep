#!/bin/bash
# terminal-2 / path-order (medium): why the ORDER of directories in PATH matters
# for a command a privileged job calls by bare name. Answer guard: the student
# identifies the writable directory that sits BEFORE the system dirs — the one
# an attacker would plant a fake binary in.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-path}"
S=/home/student

mkdir -p /opt/service /home/student/bin
cat > /opt/service/run.conf <<'C'
# keepd runner config
DESC="runs the collector as root on a timer"
PATH=/home/student/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
CMD=collect        # called by bare name, so it is resolved via PATH above
C
cat > /opt/service/run.sh <<'R'
#!/bin/bash
# (root) loads the config and runs CMD by its bare name
set -a; . /opt/service/run.conf; set +a
collect 2>/dev/null || true
R
chmod 644 /opt/service/run.conf /opt/service/run.sh

cat > "$S/README.txt" <<'TXT'
=== PATH Evaluation & Hijacking ===
A service runner configured under /opt/service executes an administrative command
using a relative binary invocation reliant on its configured PATH variable.

Audit the service runner configuration to find the insecure directory entry
in the search PATH that is vulnerable to binary hijacking by an unprivileged user.
Submit the vulnerable directory path:
  check /path/to/directory
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag;              chmod 600 /opt/bk/flag
printf '%s' "/home/student/bin" > /opt/bk/expected; chmod 600 /opt/bk/expected
cat > /opt/bk/verify.sh <<'V'
#!/bin/bash
want="$(cat /opt/bk/expected)"
a="${1%/}"
[ "$a" = "$want" ] && exit 0
echo "not the hijackable directory; examine directory permissions and PATH search order"; exit 1
V
chmod 700 /opt/bk/verify.sh
nohup /usr/local/bin/bkverify >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
