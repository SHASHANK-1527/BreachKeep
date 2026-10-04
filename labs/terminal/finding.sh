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
printf '\nBK{s1z3_m4tt3rs_th1s_f1l3_1s_t00_sm4ll_decoy1}\n' >> "$ROOT/sample_1.dat"
printf '\nBK{d1d_y0u_ch3ck_th3_s1z3_c0nd1t10n_decoy2}\n' >> "$ROOT/sample_2.dat"
printf '\nBK{un1qu3_f1l3_s1z3_n0t_m3t_decoy3}\n' >> "$ROOT/sample_3.dat"

# Plant decoy flags across random and non-.dat files to foil blind grep
decoys=(
  "BK{wr0ng_3xt3ns10n_n0t_4_d4t_f1l3_decoy}"
  "BK{th1s_1s_4_l0g_f1l3_n0t_d4t_decoy}"
  "BK{r3curs1v3_gr3p_w0nt_s4v3_y0u_h3r3_decoy}"
  "BK{y0u_must_us3_f1nd_c0mm4nd_decoy}"
  "BK{4ll_th4t_gl1tt3rs_1s_n0t_g0ld_decoy}"
  "BK{f1lt3r_by_s1z3_4nd_typ3_decoy}"
  "BK{n1c3_try_but_ch3ck_th3_cr1t3r14_decoy}"
  "BK{p1l3_1nsp3ct10n_r3qu1r3s_f1nd_decoy}"
  "BK{b4ckup_d4t4_n0t_th3_t4rg3t_decoy}"
  "BK{cr1t3r14_m1sm4tch_k33p_s34rch1ng_decoy}"
)
for idx in "${!decoys[@]}"; do
  target_idx=$(( (idx * 23) + 7 ))
  for f in "$ROOT/file_${target_idx}."*; do
    [ -f "$f" ] && printf '\n%s\n' "${decoys[$idx]}" >> "$f"
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

Filter the directory to find that unique file and inspect its contents to retrieve the key.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
