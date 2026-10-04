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

# Decoy flags across other files to throw off blind `grep -r "BK{"`
printf 'the silver ticket was archived here -> BK{s1lv3r_t1ck3t_1s_n0t_g0ld3n_decoy}\n' >> "$ROOT/a/note_3.txt"
printf 'the bronze ticket was expired -> BK{br0nz3_t1ck3t_1s_n0t_g0ld3n_decoy}\n' >> "$ROOT/b/note_7.txt"
printf 'GOLDEN TICKET REVOKED AND ROTATED -> BK{3xp1r3d_t1ck3t_tr4p_decoy}\n' >> "$ROOT/c/note_12.txt"
printf 'copper ticket stub from previous shift -> BK{c0pp3r_t1ck3t_w0nt_w0rk_decoy}\n' >> "$ROOT/b/note_15.txt"
printf 'incident report: plain grep failed -> BK{gr3p_w1th0ut_c4s3_1s_d4ng3r0us_decoy}\n' >> "$ROOT/a/note_18.txt"
printf 'platinum ticket reservation memo -> BK{pl4t1num_t1ck3t_v1p_tr4p_decoy}\n' >> "$ROOT/b/sub/note_5.txt"

cat > /home/student/README.txt <<'TXT'
=== Pattern Search ===
Somewhere under docs/ a document references the phrase "GOLDEN TICKET".
The author did not maintain uniform letter casing, and the document is buried
within nested directories among hundreds of files.

Locate the matching file and line to recover the key.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
