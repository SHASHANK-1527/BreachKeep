#!/bin/bash
# Room: First Steps — navigation. The flag lives in the only file named
# flag.txt, deep in a randomised tree. Decoys carry the same flag format
# but live in files with other names (notes.txt, backup.dat, memo.txt, etc.)
# `find` is removed so the student must actually walk the tree with ls / cd / cat.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="FLAG((cd_ls_c4t_b4s1cs_devplaceholder01))"
ROOT=/home/student
rand() { tr -dc 'a-z' </dev/urandom | head -c6; }
rand_hex() { tr -dc 'a-f0-9' </dev/urandom | head -c16; }

d1=$(rand); d2=$(rand); d3=$(rand)
mkdir -p "$ROOT/$d1/$d2/$d3"
printf '%s\n' "$FLAG" > "$ROOT/$d1/$d2/$d3/flag.txt"

# Plant 25 decoy flags across dummy files using distinct formats (never FLAG((...)) or BK{...})
# ONLY the file named flag.txt contains the authentic key.
decoy_names=("notes.txt" "memo.txt" "backup.log" "archive.dat" "scratchpad.txt" "todo.txt" "report.csv" "keys.bak")
decoy_fmts=("KEEP[%s]" "VAULT<%s>" "SEAL|%s|")
for i in $(seq 1 25); do
  dd="$ROOT/$(rand)/$(rand)"
  mkdir -p "$dd"
  fname="${decoy_names[$((RANDOM % ${#decoy_names[@]}))]}"
  fmt="${decoy_fmts[$((i % ${#decoy_fmts[@]}))]}"
  inner="cd_ls_c4t_b4s1cs_$(rand_hex)"
  decoy_flag="$(printf "$fmt" "$inner")"
  printf 'internal memo #%d: %s\n' "$i" "$decoy_flag" > "$dd/$fname"
  printf 'data record: %s\n' "$(rand_hex)" > "$dd/data_$i.tmp"
done

cat > "$ROOT/README.txt" <<'TXT'
=== First Steps ===
Somewhere below your home directory is the ONLY file named flag.txt.
It holds the authentic key for this room.

Beware: multiple decoy flags are scattered across other files (notes, memos, backups).
Explore the directory tree to locate the genuine flag.txt file and read its contents.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
