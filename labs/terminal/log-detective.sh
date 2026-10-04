#!/bin/bash
# Room (hard): log-detective — correlate ONE actor across three logs that each
# use a different timestamp format, and report when they first appeared.
#
# Story: an attacker brute-forces a login. They show up in all three logs. The
# student identifies the attacker IP (many failed logins in auth.log), then
# finds that IP's EARLIEST timestamp across all three logs — which lands in
# app.log, written as a raw epoch, so it must be converted to compare.
# Answer via `check`, as UTC "YYYY-MM-DD HH:MM:SS". Root guard holds the flag.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
HOME_S=/home/student

# A base time a few months back, randomised per student.
BASE=$(( 1740000000 + (RANDOM * 37) + RANDOM ))
ATT_IP="203.0.113.$(( (RANDOM % 240) + 2 ))"
noise_ips=(198.51.100.11 198.51.100.77 192.0.2.5 192.0.2.9 198.51.100.44)

# Attacker's FIRST event (earliest overall for this IP): in app.log as epoch.
T0=$BASE
ANSWER="$(date -u -d "@${T0}" +'%Y-%m-%d %H:%M:%S')"

# ---- app.log : raw epoch seconds ----
{
  for ip in "${noise_ips[@]}"; do
    printf '%s LOGIN ok user=guest ip=%s\n' "$(( BASE - (RANDOM % 5000) - 100 ))" "$ip"
  done
  printf '%s LOGIN ok user=svc ip=%s\n' "$T0" "$ATT_IP"          # attacker's earliest
  printf '%s LOGIN ok user=svc ip=%s\n' "$(( T0 + 4200 ))" "$ATT_IP"
} | sort -n > "$HOME_S/app.log"

# ---- auth.log : syslog "Mon DD HH:MM:SS" ----
{
  for n in $(seq 1 15); do
    t=$(( T0 + 1800 + n*20 ))
    printf '%s host sshd[%s]: Failed password for root from %s port %s\n' \
      "$(date -u -d "@${t}" +'%b %e %H:%M:%S')" "$((RANDOM%9000+1000))" "$ATT_IP" "$((RANDOM%60000+1024))"
  done
  t=$(( T0 + 2400 ))
  printf '%s host sshd[%s]: Accepted password for root from %s port %s\n' \
    "$(date -u -d "@${t}" +'%b %e %H:%M:%S')" "$((RANDOM%9000+1000))" "$ATT_IP" "$((RANDOM%60000+1024))"
  for ip in "${noise_ips[@]}"; do
    t=$(( BASE - (RANDOM % 3000) ))
    printf '%s host sshd[%s]: Accepted password for alice from %s port %s\n' \
      "$(date -u -d "@${t}" +'%b %e %H:%M:%S')" "$((RANDOM%9000+1000))" "$ip" "$((RANDOM%60000+1024))"
  done
} > "$HOME_S/auth.log"

# ---- web.log : ISO 8601 ----
{
  for ip in "${noise_ips[@]}"; do
    printf '%sZ %s "GET / HTTP/1.1" 200\n' "$(date -u -d "@$(( BASE - (RANDOM%4000) ))" +'%Y-%m-%dT%H:%M:%S')" "$ip"
  done
  printf '%sZ %s "GET /admin HTTP/1.1" 302\n' "$(date -u -d "@$(( T0 + 3000 ))" +'%Y-%m-%dT%H:%M:%S')" "$ATT_IP"
} > "$HOME_S/web.log"

cat > "$HOME_S/README.txt" <<'TXT'
=== Incident Log Correlation (hard) ===
An unauthorized actor conducted brute-force activity against this system.
Evidence is scattered across three log files recorded in different timestamp formats:
  app.log
  auth.log
  web.log

Investigate the incident:
  1. Identify the attacker IP address responsible for repeated failed authentication attempts.
  2. Correlate that IP's activity across all three logs.
  3. Determine the earliest timestamp associated with that attacker across any log.

Submit the earliest timestamp normalized to UTC in the format YYYY-MM-DD HH:MM:SS:
  check YYYY-MM-DD HH:MM:SS
TXT

# --- guard setup ---
mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag
printf '%s' "$ANSWER" > /opt/bk/expected
chmod 600 /opt/bk/flag /opt/bk/expected
nohup /usr/local/bin/bkguard >/dev/null 2>&1 &

unset BK_FLAG FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
