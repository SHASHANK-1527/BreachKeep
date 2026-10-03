#!/bin/bash
# Room (medium): pipes — build sort | uniq -c | sort -n | head to find the
# single most frequent IP in an access log, and how many times it appears.
# Answer submitted via `check <ip> <count>`; a root guard holds the flag.
# Runs as ROOT, drops to student for the shell.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
LOG=/home/student/access.log

# Build a pool of IPs; make ONE of them clearly the most frequent.
pool=()
for i in $(seq 1 25); do pool+=("10.0.$(( RANDOM % 9 )).$(( (RANDOM % 240) + 2 ))"); done
top_ip="10.0.9.$(( (RANDOM % 240) + 2 ))"
top_count=$(( (RANDOM % 40) + 60 ))   # 60..99, guaranteed above the noise

{
  # noise: each pool IP appears a small random number of times (< 50)
  for ip in "${pool[@]}"; do
    n=$(( (RANDOM % 40) + 1 ))
    for _ in $(seq 1 "$n"); do
      printf '%s - - [req] "GET /item/%s HTTP/1.1" 200\n' "$ip" "$((RANDOM % 999))"
    done
  done
  # the winner
  for _ in $(seq 1 "$top_count"); do
    printf '%s - - [req] "GET /item/%s HTTP/1.1" 200\n' "$top_ip" "$((RANDOM % 999))"
  done
} | shuf > "$LOG"

cat > /home/student/README.txt <<'TXT'
=== Pipes (medium) ===
access.log is a web server log. One IP address hit the server far more than any
other. Find THAT ip and exactly HOW MANY times it appears.

Build a pipeline — the first field of each line is the IP:
  cut -d' ' -f1 access.log | sort | uniq -c | sort -nr | head
Then submit the top result:
  check <ip> <count>
TXT

# --- guard setup ---
mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag
printf '%s %s' "$top_ip" "$top_count" > /opt/bk/expected
chmod 600 /opt/bk/flag /opt/bk/expected
nohup /usr/local/bin/bkguard >/dev/null 2>&1 &

unset BK_FLAG FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
