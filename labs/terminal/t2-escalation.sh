#!/bin/bash
# terminal-2 / escalation (mandatory): read `sudo -l` and understand what an
# over-broad rule permits. The flag is root-only; a misconfigured NOPASSWD rule
# lets the student run a file-reading command as root. Real sudo (setuid), so
# this room runs with no-new-privileges OFF (see dungeons.js ROOM_CAPS).
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-escalation}"
S=/home/student

printf '%s\n' "$FLAG" > /root/flag.txt
chown root:root /root/flag.txt; chmod 600 /root/flag.txt

# The misconfiguration: student may run `cat` as root with no password.
echo 'student ALL=(root) NOPASSWD: /usr/bin/cat' > /etc/sudoers.d/keep
chmod 440 /etc/sudoers.d/keep

cat > "$S/README.txt" <<'TXT'
=== Privilege Delegation ===
The target flag is located at /root/flag.txt, inaccessible to standard unprivileged users.

Audit your account's administrative privilege delegation and execution rights
on this host to find an avenue to access the restricted file.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
