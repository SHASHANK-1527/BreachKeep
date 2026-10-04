#!/bin/bash
# Room: Reading files — jump straight to a known line in a long file.
# 30+ decoy flags are planted on other lines so grepping "BK{" returns dozens
# of candidates. The student MUST inspect the exact line requested in README.txt.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student
TOTAL=1500
LINE=$(( (RANDOM % (TOTAL - 200)) + 100 ))
rand_hex() { tr -dc 'a-f0-9' </dev/urandom | head -c16; }

# Pick 35 random lines to host decoy flags (excluding the target line)
decoy_lines=()
for _ in $(seq 1 35); do
  dl=$(( (RANDOM % TOTAL) + 1 ))
  [ "$dl" -ne "$LINE" ] && decoy_lines+=("$dl")
done

{
  for i in $(seq 1 "$TOTAL"); do
    if [ "$i" -eq "$LINE" ]; then
      printf 'entry %s: VAULT KEY -> %s\n' "$i" "$FLAG"
    elif [[ " ${decoy_lines[*]} " =~ " ${i} " ]]; then
      printf 'entry %s: VAULT KEY -> BK{sp3c1f1c_l1n3_r34d3r_%s}\n' "$i" "$(rand_hex)"
    else
      printf 'entry %s: routine transaction %s\n' "$i" "$(tr -dc 'a-f0-9' </dev/urandom | head -c10)"
    fi
  done
} > "$ROOT/ledger.log"

cat > "$ROOT/README.txt" <<TXT
=== Reading Files ===
ledger.log contains $TOTAL lines of transaction records.
The genuine vault key was recorded specifically on line $LINE.

Beware: the log contains dozens of stale decoy keys recorded on other lines.
Inspect line $LINE directly in ledger.log without guessing or blind grepping.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
