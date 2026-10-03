#!/bin/bash
# Room (hard): needle — find a file by METADATA, not name or content.
# The target is the ONLY file that is all of: owned by user 'archivist',
# permissions exactly 600, and modified more than a year ago. The file is
# unreadable to the student (600, not their file), so they prove they found it
# by submitting its PATH to `check`; a root guard holds the flag.
#
# Runs as ROOT (USER root in the Dockerfile) to create the account, set
# ownership/mtimes, and run the guard; drops to 'student' for the shell.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student/store
mkdir -p "$ROOT"

id archivist >/dev/null 2>&1 || useradd -M archivist

# Decoys owned by student, varied perms, recent mtimes.
for i in $(seq 1 400); do
  f="$ROOT/doc_${i}.txt"
  head -c $(( (RANDOM % 500) + 50 )) /dev/urandom | base64 > "$f"
  chown student:student "$f"
  chmod "$(shuf -e 644 640 664 600 -n1)" "$f"
done
# Near-miss archivist files: right owner, wrong perms, recent mtime.
for i in 1 2 3 4 5; do
  f="$ROOT/arch_${i}.txt"; echo "archivist working copy" > "$f"
  chown archivist:archivist "$f"; chmod 644 "$f"
done
# Near-miss: mode 600 + old, but owned by student (wrong owner).
old_decoy="$ROOT/doc_backup.txt"; echo "student backup" > "$old_decoy"
chown student:student "$old_decoy"; chmod 600 "$old_decoy"; touch -d '3 years ago' "$old_decoy"

# The one true needle.
needle="$ROOT/ledger_$(tr -dc 'a-z0-9' </dev/urandom | head -c5).txt"
printf '%s\n' "$FLAG" > "$needle"
chown archivist:archivist "$needle"
chmod 600 "$needle"
touch -d '2 years ago' "$needle"

cat > /home/student/README.txt <<'TXT'
=== Needle (hard) ===
Under  store/  there are hundreds of files. Exactly ONE matches ALL of:
  * owned by the user  archivist
  * permissions exactly  600  (-rw-------)
  * last modified MORE than a year ago

Name and contents tell you nothing — match on metadata, and combine the tests:
  find ~/store -user archivist -perm 600 -mtime +365   # use ~/store so the path is absolute
You cannot read the file directly (it is not yours). Prove you found it by
submitting its path:
  check <the/path/find/printed>
TXT

# --- guard setup ---
mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag
printf '%s' "$needle" > /opt/bk/expected
chmod 600 /opt/bk/flag /opt/bk/expected
nohup /usr/local/bin/bkguard >/dev/null 2>&1 &

unset BK_FLAG FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
