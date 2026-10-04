#!/bin/bash
# Room: Reading files — jump straight to a known line in a long file.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student
TOTAL=1500
LINE=$(( (RANDOM % (TOTAL - 200)) + 100 ))

{
  for i in $(seq 1 "$TOTAL"); do
    if [ "$i" -eq "$LINE" ]; then
      printf 'entry %s: VAULT KEY -> %s\n' "$i" "$FLAG"
    elif [ "$i" -eq 17 ]; then
      printf 'entry %s: VAULT KEY -> BK{wr0ng_l1n3_d1d_y0u_r34d_th3_r34dm3_decoy}\n' "$i"
    elif [ "$i" -eq 84 ]; then
      printf 'entry %s: VAULT KEY -> BK{cl0s3_but_n0t_th3_r1ght_l1n3_decoy}\n' "$i"
    elif [ "$i" -eq 250 ]; then
      printf 'entry %s: VAULT KEY -> BK{sk1pp1ng_4h34d_1sn_t_ch3ck1ng_l1n3_decoy}\n' "$i"
    elif [ "$i" -eq 780 ]; then
      printf 'entry %s: VAULT KEY -> BK{jump_t0_th3_sp3c1f1c_l1n3_numb3r_decoy}\n' "$i"
    elif [ "$i" -eq 1250 ]; then
      printf 'entry %s: VAULT KEY -> BK{k33p_sc4nn1ng_l1n3_sp3c1f13d_decoy}\n' "$i"
    else
      printf 'entry %s: routine transaction %s\n' "$i" "$(tr -dc 'a-f0-9' </dev/urandom | head -c10)"
    fi
  done
} > "$ROOT/ledger.log"

cat > "$ROOT/README.txt" <<TXT
=== Reading Files ===
ledger.log contains $TOTAL lines of transaction records.
Somewhere within this file, the clerk recorded the vault key specifically on line $LINE.

Inspect that specific line in ledger.log without manually scrolling through thousands of lines.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
