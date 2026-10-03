#!/bin/bash
# Room: find — one file matches three criteria at once:
#   name *.dat  AND  larger than 10 KB  AND  a regular file.
# ~500 near-misses make eyeballing hopeless; find with combined tests wins.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student/pile
mkdir -p "$ROOT"

for i in $(seq 1 500); do
  ext=$(shuf -e dat log tmp cfg bin -n1)
  # Keep almost everything small (<10 KB). A few big NON-.dat files exist as traps.
  if [ $((RANDOM % 40)) -eq 0 ]; then
    bytes=$(( (RANDOM % 8000) + 11000 ))   # big, but wrong extension on purpose
    ext=$(shuf -e log tmp bin -n1)
  else
    bytes=$(( (RANDOM % 4000) + 100 ))     # small
  fi
  head -c "$bytes" /dev/urandom | base64 | head -c "$bytes" > "$ROOT/file_${i}.${ext}"
done

# A couple of SMALL .dat files, so ".dat" alone is not enough either.
for i in 1 2 3; do
  head -c 2000 /dev/urandom | base64 | head -c 2000 > "$ROOT/sample_${i}.dat"
done

# The one true match: *.dat, >10 KB, regular file. Flag is the last line.
target="$ROOT/record_$(tr -dc 'a-z0-9' </dev/urandom | head -c5).dat"
head -c 13000 /dev/urandom | base64 | head -c 13000 > "$target"
printf '\n%s\n' "$FLAG" >> "$target"

cat > /home/student/README.txt <<'TXT'
=== Finding Files ===
Under  pile/  there are hundreds of files. Exactly ONE matches all three:
  * its name ends in  .dat
  * it is larger than 10 KB
  * it is a regular file (not a dir, not a link)

Combine the tests — don't guess:
  find pile -name '*.dat' -size +10k -type f
Then read the last line of the file it prints.  (tail -n 1 <file>)
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
