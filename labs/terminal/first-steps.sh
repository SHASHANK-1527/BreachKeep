#!/bin/bash
# Room: First Steps — navigation. The flag lives in the only file named
# flag.txt, deep in a randomised tree. Decoys carry no flag; `find` is removed
# so the student must actually walk the tree with ls / cd / cat.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student
rand() { tr -dc 'a-z' </dev/urandom | head -c6; }

d1=$(rand); d2=$(rand); d3=$(rand)
mkdir -p "$ROOT/$d1/$d2/$d3"
printf '%s\n' "$FLAG" > "$ROOT/$d1/$d2/$d3/flag.txt"

# Decoy directories: plausible but irrelevant, and none contain a flag.txt.
for _ in 1 2 3 4 5; do
  dd="$ROOT/$(rand)/$(rand)"
  mkdir -p "$dd"
  printf 'nothing to see here\n' > "$dd/notes.txt"
  printf 'old inventory\n'       > "$dd/data.csv"
done

cat > "$ROOT/README.txt" <<'TXT'
=== First Steps ===
Somewhere below your home directory is the only file named  flag.txt
It holds the key for this room.

Move around with:   ls    cd    pwd    cat
There is no shortcut tool in this room on purpose — walk the tree.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
