#!/bin/bash
# terminal-2 / scripts (mandatory): write a small bash script with an argument.
# The guard runs the student's script on a FRESH random directory, so a
# hard-coded answer fails.
set -e
FLAG="${BK_FLAG:-}"; [ -n "$FLAG" ] || FLAG="BK{dev-scripts}"
S=/home/student

cat > "$S/solve.sh" <<'SH'
#!/bin/bash
# TODO: print ONLY the number of files ending in .log directly inside "$1"
# e.g.  ./solve.sh somedir  ->  7
SH
chown student:student "$S/solve.sh"; chmod 755 "$S/solve.sh"

cat > "$S/README.txt" <<'TXT'
=== Your first script ===
Finish  solve.sh  so that it takes ONE argument — a directory — and prints just
the NUMBER of files whose name ends in .log directly inside it. Nothing else.
  ./solve.sh somedir      ->      7
Build a test dir yourself (mkdir t; touch t/a.log t/b.txt) and check your count.
When it works on any input, run:   check
We test it on a freshly generated directory, so printing a fixed number fails.
TXT
chown root:root "$S/README.txt"

mkdir -p /opt/bk && chmod 700 /opt/bk
printf '%s' "$FLAG" > /opt/bk/flag; chmod 600 /opt/bk/flag
cat > /opt/bk/verify.sh <<'V'
#!/bin/bash
set -u
[ -f /home/student/solve.sh ] || { echo "solve.sh not found"; exit 1; }
d=$(mktemp -d)
chmod 755 "$d"   # the student's script runs as 'student' and must read this dir
n=$(( (RANDOM % 8) + 2 ))
for i in $(seq 1 "$n"); do : > "$d/log$i.log"; done
for i in 1 2 3; do : > "$d/note$i.txt"; done
out=$(setpriv --reuid student --regid student --init-groups bash /home/student/solve.sh "$d" 2>/dev/null | tr -d '[:space:]')
rm -rf "$d"
[ "$out" = "$n" ] && exit 0
echo "on a dir with $n .log files your script printed '${out:-nothing}'"; exit 1
V
chmod 700 /opt/bk/verify.sh
nohup /usr/local/bin/bkverify >/dev/null 2>&1 &

unset BK_FLAG FLAG
BASE_ARG=(); [ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG \
  ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
