#!/bin/bash
# Room (medium): strings — pull readable text out of a binary blob.
# The flag is embedded in a binary file full of non-printable bytes; `cat`
# is useless, `strings` + grep reveals it.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student
blob="$ROOT/core.dump"

# Build a binary file: random bytes, with the flag sandwiched in the middle.
head -c 4096 /dev/urandom > "$blob"
printf 'MARKER-%s-END' "$FLAG" >> "$blob"
head -c 4096 /dev/urandom >> "$blob"

cat > "$ROOT/README.txt" <<'TXT'
=== strings ===
core.dump is a binary file. Opening it with cat just spews garbage and may
mess up your terminal. Pull the human-readable text out instead:

  strings core.dump | grep BK
  strings core.dump | grep MARKER
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
