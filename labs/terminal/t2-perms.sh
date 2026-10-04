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
=== File Permissions ===
run.sh belongs to your account, but the operating system prevents execution.
Inspect the file's current permissions and grant the necessary permissions so you
can execute the script.

Apply the principle of least privilege—excessive permissions (such as world-writable
or 777) will be rejected by the validation guard.
When run.sh is properly executable, verify with:
  check
TXT

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag; chmod 600 /opt/bk/flag
cat > /opt/bk/verify.sh <<'V'
#!/bin/bash
f=/home/student/run.sh
[ -x "$f" ] || { echo "run.sh is still not executable"; exit 1; }
mode=$(stat -c '%a' "$f")
[ "$mode" = "777" ] && { echo "777 is overly permissive; grant only appropriate permissions"; exit 1; }
[ "$(stat -c '%A' "$f" | cut -c9)" = "w" ] && { echo "it is world-writable; remove other-write"; exit 1; }
exit 0
V
chmod 700 /opt/bk/verify.sh
nohup /usr/local/bin/bkverify >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
