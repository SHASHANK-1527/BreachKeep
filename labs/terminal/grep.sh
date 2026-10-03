#!/bin/bash
# Room: grep — the marker phrase is written in mixed case and buried in a tree,
# so a naive case-sensitive grep misses it. Needs grep -r (recursive) and
# -i (case-insensitive).
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student/docs
mkdir -p "$ROOT"/a "$ROOT"/b "$ROOT"/c "$ROOT"/b/sub

# Noise files across the tree.
for d in a b c b/sub; do
  for i in $(seq 1 20); do
    {
      echo "report section $i"
      tr -dc 'a-z \n' </dev/urandom | head -c 300
      echo
    } > "$ROOT/$d/note_${i}.txt"
  done
done

# The marker, in deliberately mixed case so plain `grep "GOLDEN TICKET"` fails.
# The flag is on the SAME line.
printf 'the gOlDeN tIcKeT is right here -> %s\n' "$FLAG" > "$ROOT/b/sub/log_42.txt"

cat > /home/student/README.txt <<'TXT'
=== grep ===
Somewhere under  docs/  a line contains the phrase  GOLDEN TICKET
— but the case is scrambled, and it is one line among hundreds of files.

Search recursively AND case-insensitively:
  grep -ri "golden ticket" docs
The key is on the same line.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
