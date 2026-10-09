#!/bin/bash
# Room: find — exactly ONE file matches all three criteria:
#   name *.dat  AND  strictly > 10 KB  AND  regular file.
# Decoy flags with the exact flag format are planted across 35+ non-matching
# files (wrong extension, wrong size, dummy configs).
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="ARCHIVE::f1nd_10k_d4t_sp3c14l1st_devplaceholder01::"
ROOT=/home/student/pile
mkdir -p "$ROOT"
rand_hex() { tr -dc 'a-f0-9' </dev/urandom | head -c16; }

for i in $(seq 1 500); do
  ext=$(shuf -e dat log tmp cfg bin -n1)
  # Generate files with varied sizes, including 15-20 big (>10k) non-.dat files (11-30KB)
  if [ $((RANDOM % 25)) -eq 0 ]; then
    bytes=$(( (RANDOM % 19000) + 11000 ))   # big (>10k, 11-30KB), but wrong extension
    ext=$(shuf -e log tmp bin dat.bak dat.tmp -n1)
  else
    bytes=$(( (RANDOM % 4000) + 100 ))     # small
  fi
  head -c "$bytes" /dev/urandom | base64 | head -c "$bytes" > "$ROOT/file_${i}.${ext}"
done

# A few SMALL .dat files (< 10 KB), so ".dat" alone is not enough
for i in 1 2 3 4 5; do
  head -c 2000 /dev/urandom | base64 | head -c 2000 > "$ROOT/sample_${i}.dat"
  printf '\nKEEP[f1nd_10k_d4t_sp3c14l1st_%s]\n' "$(rand_hex)" >> "$ROOT/sample_${i}.dat"
done

# Big (>10KB) directory and symlink decoys ending in .dat (fails -type f)
for i in 1 2 3; do
  mkdir -p "$ROOT/archive_${i}.dat"
  head -c 15000 /dev/urandom | base64 | head -c 15000 > "$ROOT/archive_${i}.dat/internal.bin"
  printf '\nFLAG((f1nd_10k_d4t_sp3c14l1st_%s))\n' "$(rand_hex)" >> "$ROOT/archive_${i}.dat/internal.bin"
done
ln -s "$ROOT/file_1.log" "$ROOT/symlink_1.dat" 2>/dev/null || true
ln -s "$ROOT/file_2.log" "$ROOT/symlink_2.dat" 2>/dev/null || true

# Plant 35 decoy flags across random files in the pile using KEEP and FLAG formats (never ARCHIVE or BK)
for i in $(seq 1 35); do
  target_file="$ROOT/file_$(( (i * 14) + 3 ))."*
  for f in $target_file; do
    if [ -f "$f" ]; then
      if [ $((i % 2)) -eq 0 ]; then
        printf '\nKEEP[f1nd_10k_d4t_sp3c14l1st_%s]\n' "$(rand_hex)" >> "$f"
      else
        printf '\nFLAG((f1nd_10k_d4t_sp3c14l1st_%s))\n' "$(rand_hex)" >> "$f"
      fi
    fi
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
