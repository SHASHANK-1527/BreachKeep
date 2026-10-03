#!/bin/bash
# terminal-2 / groups (mandatory): understand owner/group/other and group
# membership. Flag sits in a group-readable file; the student's account is in
# that group, so the lesson is reading `ls -l` + `id` and realising why `cat`
# works. Find-type (no answer guard) — root sets up, drops to student.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-groups}"
S=/home/student

groupadd keepers 2>/dev/null || true
usermod -aG keepers student
mkdir -p /vault
printf '%s\n' "$FLAG" > /vault/keyring.txt
chown root:keepers /vault/keyring.txt; chmod 640 /vault/keyring.txt
echo "public notice: nothing secret here" > /vault/public.txt; chmod 644 /vault/public.txt
# a decoy the student CANNOT read (different group) to make the point
groupadd wardens 2>/dev/null || true
echo "BK{wrong-vault}" > /vault/warden-only.txt
chown root:wardens /vault/warden-only.txt; chmod 640 /vault/warden-only.txt

cat > "$S/README.txt" <<'TXT'
=== Groups & ownership ===
/vault holds two restricted files. One you can read, one you cannot — the
difference is the GROUP on the file and which groups YOU belong to.
  ls -l /vault
  id
Read the file whose group you are a member of:
  cat /vault/<the right file>
warden-only.txt is a decoy — you are not a warden.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
