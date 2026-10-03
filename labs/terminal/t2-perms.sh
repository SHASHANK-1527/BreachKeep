#!/bin/bash
# terminal-2 / perms (mandatory): read rwx and fix a file's mode with chmod,
# without reaching for 777. Root sets up + holds the flag via bkverify; drops
# to student.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-perms}"
S=/home/student

cat > "$S/run.sh" <<'SH'
#!/bin/bash
echo "the keep acknowledges you"
SH
chown student:student "$S/run.sh"; chmod 600 "$S/run.sh"

cat > "$S/README.txt" <<'TXT'
=== Permissions ===
run.sh belongs to you but will not execute — look at its mode with  ls -l.
Give yourself (and only what's needed) the execute bit, then prove it:
  chmod u+x run.sh
  ./run.sh
Reaching for  chmod 777  is the wrong instinct — the keep rejects it.
When run.sh is executable and NOT world-writable, run:   check
TXT

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag; chmod 600 /opt/bk/flag
cat > /opt/bk/verify.sh <<'V'
#!/bin/bash
f=/home/student/run.sh
[ -x "$f" ] || { echo "run.sh is still not executable — chmod u+x run.sh"; exit 1; }
mode=$(stat -c '%a' "$f")
[ "$mode" = "777" ] && { echo "777 is too open; grant only what is needed (744 or 755)"; exit 1; }
[ "$(stat -c '%A' "$f" | cut -c9)" = "w" ] && { echo "it is world-writable; remove other-write"; exit 1; }
exit 0
V
chmod 700 /opt/bk/verify.sh
nohup /usr/local/bin/bkverify >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
