#!/bin/bash
# Root-held answer guard for "do-a-task" rooms.
#
# Why this exists: the flag arrives as $BK_FLAG. If the student's shell could
# read it (echo $BK_FLAG, cat /proc/1/environ, cat the flag file) the challenge
# would be pointless. So this guard runs as ROOT, keeps the flag in files the
# student's uid cannot read (/opt/bk, mode 600), and hands the flag over only
# when the student submits the correct answer via the `check` command.
set -u
ANSWER=/home/student/.bk_answer
RESULT=/home/student/.bk_result
EXPECTED="$(cat /opt/bk/expected)"
FLAG="$(cat /opt/bk/flag)"

write_result() {
  rm -f "$RESULT"                      # never write through a symlink the student planted
  printf '%s\n' "$1" > "$RESULT"
  chown student:student "$RESULT" 2>/dev/null || true
  chmod 644 "$RESULT"
}

while true; do
  if [ -e "$ANSWER" ] || [ -L "$ANSWER" ]; then
    # Only accept a real, student-owned regular file. This blocks the symlink
    # trick: `ln -s /opt/bk/expected .bk_answer` would otherwise make a root
    # `cat` read the expected answer and match it against itself.
    if [ -L "$ANSWER" ] || [ ! -f "$ANSWER" ] || [ "$(stat -c %U "$ANSWER" 2>/dev/null)" != "student" ]; then
      rm -f "$ANSWER"
    else
      got="$(cat "$ANSWER" 2>/dev/null)"
      rm -f "$ANSWER"
      if [ "$got" = "$EXPECTED" ]; then write_result "$FLAG"; else write_result "NOPE"; fi
    fi
  fi
  sleep 0.4
done
