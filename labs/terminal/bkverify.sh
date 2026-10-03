#!/bin/bash
# verify-style watcher for terminal-2 / network answer rooms: runs a room-specific
# /opt/bk/verify.sh as root. exit 0 => reveal flag; non-zero => return its message.
set -u
TRIG=/home/student/.bk_answer
RES=/home/student/.bk_result
emit() {
  rm -f "$RES"                          # never write through a symlink
  printf '%s\n' "$1" > "$RES"
  chown student:student "$RES" 2>/dev/null || true
  chmod 644 "$RES"
}
while true; do
  if [ -e "$TRIG" ] || [ -L "$TRIG" ]; then
    # Only a real, student-owned regular file (block symlink aliasing to
    # /opt/bk/expected, which would otherwise feed the expected answer back in).
    if [ -L "$TRIG" ] || [ ! -f "$TRIG" ] || [ "$(stat -c %U "$TRIG" 2>/dev/null)" != "student" ]; then
      rm -f "$TRIG"
    else
      ans="$(cat "$TRIG" 2>/dev/null)"; rm -f "$TRIG"
      if out="$(/opt/bk/verify.sh "$ans" 2>&1)"; then
        emit "$(cat /opt/bk/flag)"
      else
        emit "FAIL:${out:-not correct}"
      fi
    fi
  fi
  sleep 0.4
done
