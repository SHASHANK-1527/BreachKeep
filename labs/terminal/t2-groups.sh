#!/bin/bash
# terminal-2 / groups (mandatory): understand owner/group/other and group
# membership. Flag sits in a group-readable file; the student's account is in
# that group, so the lesson is reading `ls -l` + `id` and realising why `cat`
# works. Find-type (no answer guard) — root sets up, drops to student.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="ARCHIVE::gr0up_m3mb3rsh1p_devplaceholder01::"
S=/home/student

groupadd keepers 2>/dev/null || true
usermod -aG keepers student
mkdir -p /vault
printf '%s\n' "$FLAG" > /vault/keyring.txt
chown root:keepers /vault/keyring.txt; chmod 640 /vault/keyring.txt
echo "public notice: nothing secret here" > /vault/public.txt; chmod 644 /vault/public.txt

# Decoy readable by the same keepers group to force reasoning about identity and file contents
cat > /vault/keepers-only.txt <<'EOF'
# Check your identity with `id` or `groups` to understand why you can read this and keyring.txt.
KEEP[gr0up_m3mb3rsh1p_decoy_not_the_authentic_key]
EOF
chown root:keepers /vault/keepers-only.txt; chmod 640 /vault/keepers-only.txt

# a decoy the student CANNOT read (different group) to make the point
groupadd wardens 2>/dev/null || true
echo "VAULT<wrong_vault_group_forbidden>" > /vault/warden-only.txt
chown root:wardens /vault/warden-only.txt; chmod 640 /vault/warden-only.txt

cat > "$S/README.txt" <<'TXT'
=== Groups & Ownership ===
The /vault directory holds sensitive system files protected by POSIX group permissions.

Determine your account's group memberships and access rights to read the authorized
restricted file and retrieve the key.
TXT
chown root:root "$S/README.txt"

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
