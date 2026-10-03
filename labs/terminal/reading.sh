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
    else
      printf 'entry %s: routine transaction %s\n' "$i" "$(tr -dc 'a-f0-9' </dev/urandom | head -c10)"
    fi
  done
} > "$ROOT/ledger.log"

cat > "$ROOT/README.txt" <<TXT
=== Reading Files ===
ledger.log has $TOTAL lines. The clerk wrote the vault key on line $LINE.

Do NOT scroll the whole file by eye. Jump straight to the line:
  sed -n '${LINE}p' ledger.log
  head -n $LINE ledger.log | tail -n 1
  less +${LINE}g ledger.log      (press q to quit)
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
