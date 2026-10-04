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
decoy_notes=(
  "draft note: BK{n0t_th3_f1l3_n4m3d_fl4g_txt_decoy1}"
  "old memo: BK{ch3ck_th3_f1l3n4m3_fl4g_txt_decoy2}"
  "meeting log: BK{r3curs1v3_gr3p_f0und_4_dr4ft_decoy3}"
  "scratchpad: BK{k33p_3xpl0r1ng_f0r_fl4g_txt_decoy4}"
  "todo list: BK{0nly_fl4g_txt_h4s_th3_r34l_k3y_decoy5}"
)
idx=0
for _ in 1 2 3 4 5; do
  dd="$ROOT/$(rand)/$(rand)"
  mkdir -p "$dd"
  printf '%s\n' "${decoy_notes[$idx]}" > "$dd/notes.txt"
  printf 'old inventory: %s\n' "$(rand)" > "$dd/data.csv"
  idx=$(( idx + 1 ))
done

cat > "$ROOT/README.txt" <<'TXT'
=== First Steps ===
Somewhere below your home directory is the only file named flag.txt.
It holds the key for this room.

Explore the directory tree by hand to locate the file and read its contents.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
