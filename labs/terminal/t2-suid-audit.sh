#!/bin/bash
# terminal-2 / suid-audit (medium): list SUID binaries and pick the one that
# should not be SUID. Answer guard: submit the path of the odd binary.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-suid}"
S=/home/student

# A plausible-but-wrong SUID-root binary planted among the normal ones.
cp /bin/cp /usr/local/bin/keepbackup 2>/dev/null || cp "$(command -v cp)" /usr/local/bin/keepbackup
chown root:root /usr/local/bin/keepbackup
chmod 4755 /usr/local/bin/keepbackup     # setuid root — this is the finding

cat > "$S/README.txt" <<'TXT'
=== SUID Binary Audit ===
Binaries configured with the SUID bit execute with the file owner's privileges.
While standard Linux systems contain expected SUID utilities, custom or misplaced
SUID binaries pose significant privilege escalation risks.

Audit all SUID files across the filesystem, identify the non-standard binary
that should not carry elevated privileges, and submit its full path:
  check /full/path/to/binary
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag;                   chmod 600 /opt/bk/flag
printf '%s' "/usr/local/bin/keepbackup" > /opt/bk/expected; chmod 600 /opt/bk/expected
cat > /opt/bk/verify.sh <<'V'
#!/bin/bash
want="$(cat /opt/bk/expected)"
a="${1%/}"
[ "$a" = "$want" ] && exit 0
echo "that is a normal system SUID binary — keep looking for the one that doesn't belong"; exit 1
V
chmod 700 /opt/bk/verify.sh
nohup /usr/local/bin/bkverify >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
