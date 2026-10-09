#!/bin/bash
# Room: grep — the marker phrase is written in mixed case and buried in a tree:
# "gOlDeN tIcKeT"
# Decoy flags with the exact room slug format are planted across 30+ notes.
# Blind grep for "BK{" yields a wall of traps.
# Only grep -r -i "golden ticket" hits the authentic line.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="FLAG((g0ld3n_t1ck3t_c4s3_1gn0r3d_devplaceholder01))"
ROOT=/home/student/docs
mkdir -p "$ROOT"/a "$ROOT"/b "$ROOT"/c "$ROOT"/b/sub
rand_hex() { tr -dc 'a-f0-9' </dev/urandom | head -c16; }

# Noise files across the tree
for d in a b c b/sub; do
  for i in $(seq 1 20); do
    {
      echo "system report section $i"
      tr -dc 'a-z \n' </dev/urandom | head -c 300
      echo
    } > "$ROOT/$d/note_${i}.txt"
  done
done

# Plant 30 decoy flags with fake ticket references across various notes using distinct formats (never FLAG((...)) or BK{...})
decoy_labels=(
  "the silver ticket was archived here"
  "the bronze ticket was expired"
  "ticket authorization memo"
  "copper ticket stub from previous shift"
  "incident report: ticket revoked"
  "platinum ticket reservation"
  "diamond ticket voucher"
  "general admission ticket"
  "gold leaf voucher record"
  "backup ticket confirmation"
)
decoy_fmts=(
  "KEY~g0ld3n_t1ck3t_c4s3_1gn0r3d_%s~"
  "ARCHIVE::g0ld3n_t1ck3t_c4s3_1gn0r3d_%s::"
  "SEAL|g0ld3n_t1ck3t_c4s3_1gn0r3d_%s|"
)
idx=0
for d in a b c b/sub; do
  for i in 2 4 6 8 10 12 14 16 18; do
    label="${decoy_labels[$((idx % ${#decoy_labels[@]}))]}"
    dfmt="${decoy_fmts[$((idx % ${#decoy_fmts[@]}))]}"
    decoy_val="$(printf "$dfmt" "$(rand_hex)")"
    printf '%s -> %s\n' "$label" "$decoy_val" >> "$ROOT/$d/note_${i}.txt"
    idx=$((idx + 1))
  done
done

# The marker in mixed case: ONLY this line has the authentic flag!
printf 'the gOlDeN tIcKeT is right here -> %s\n' "$FLAG" > "$ROOT/b/sub/log_42.txt"

cat > /home/student/README.txt <<'TXT'
=== Pattern Search ===
Somewhere under docs/ a document references the phrase "GOLDEN TICKET".
The author did not maintain uniform letter casing, and the document is buried
within nested directories among hundreds of files.

Beware: dozens of decoy flags for silver, bronze, and expired tickets exist.
Use case-insensitive recursive grep to locate the specific "GOLDEN TICKET" line.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
