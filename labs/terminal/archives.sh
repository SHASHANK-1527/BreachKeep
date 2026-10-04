#!/bin/bash
# Room (medium): archives — peel nested compression layers. The extensions are
# deliberately wrong, so the student must identify each layer with `file`
# instead of trusting the name.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student
work="$(mktemp -d)"

# Innermost: the flag in a plain text file.
printf '%s\n' "$FLAG" > "$work/flag.txt"

# Layer 1: gzip it, but name it .txt
gzip -c "$work/flag.txt" > "$work/layer1"
# Layer 2: tar that, name it .dat
tar -C "$work" -cf "$work/layer2.tar" layer1
# Layer 3: xz the tar, hand it to the student with a misleading .log name
xz -c "$work/layer2.tar" > "$ROOT/evidence.log"

rm -rf "$work"

cat > "$ROOT/README.txt" <<'TXT'
=== Nested Archives (medium) ===
evidence.log is not what its file extension suggests. Critical evidence was
wrapped inside multiple nested layers of compression with disguised filenames.

Inspect each layer's actual data format, decompress it step by step, and peel
back the layers until you recover the key text.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
