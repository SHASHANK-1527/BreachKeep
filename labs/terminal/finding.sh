#!/bin/bash
# Room: find — exactly ONE file matches all three criteria:
#   name *.dat  AND  strictly > 10 KB  AND  regular file.
# Decoy flags with the exact flag format are planted across 35+ non-matching
# files (wrong extension, wrong size, dummy configs).
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student/pile
mkdir -p "$ROOT"
rand_hex() { tr -dc 'a-f0-9' </dev/urandom | head -c16; }

for i in $(seq 1 500); do
  ext=$(shuf -e dat log tmp cfg bin -n1)
  # Keep almost everything small (<10 KB). A few big NON-.dat files exist as traps.
  if [ $((RANDOM % 40)) -eq 0 ]; then
    bytes=$(( (RANDOM % 8000) + 11000 ))   # big (>10k), but wrong extension
    ext=$(shuf -e log tmp bin -n1)
  else
    bytes=$(( (RANDOM % 4000) + 100 ))     # small
  fi
  head -c "$bytes" /dev/urandom | base64 | head -c "$bytes" > "$ROOT/file_${i}.${ext}"
done

# A few SMALL .dat files (< 10 KB), so ".dat" alone is not enough
for i in 1 2 3 4 5; do
  head -c 2000 /dev/urandom | base64 | head -c 2000 > "$ROOT/sample_${i}.dat"
  printf '\nBK{f1nd_10k_d4t_sp3c14l1st_%s}\n' "$(rand_hex)" >> "$ROOT/sample_${i}.dat"
done

# Plant 35 decoy flags across random files in the pile
for i in $(seq 1 35); do
  target_file="$ROOT/file_$(( (i * 14) + 3 ))."*
  for f in $target_file; do
    [ -f "$f" ] && printf '\nBK{f1nd_10k_d4t_sp3c14l1st_%s}\n' "$(rand_hex)" >> "$f"
  done
done

# The one true match: *.dat, >10 KB, regular file. Flag is the last line.
target="$ROOT/record_$(tr -dc 'a-z0-9' </dev/urandom | head -c5).dat"
head -c 13000 /dev/urandom | base64 | head -c 13000 > "$target"
printf '\n%s\n' "$FLAG" >> "$target"

cat > /home/student/README.txt <<'TXT'
=== Finding Files ===
Under pile/ there are hundreds of files. Exactly ONE matches all three criteria:
  * Its filename ends with .dat
  * Its size is strictly greater than 10 KB
  * It is a regular file (not a directory or symbolic link)

Beware: dozens of decoy flags are planted across non-matching files in the pile.
Filter the directory using `find` with the required criteria to identify the genuine file.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
