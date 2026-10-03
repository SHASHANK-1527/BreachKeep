#!/bin/bash
# Room: Hidden files — dotfiles and ls -a.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="BK{dev-placeholder}"
ROOT=/home/student
mkdir -p "$ROOT/.config/.cache/.vault"
printf '%s\n' "$FLAG" > "$ROOT/.config/.cache/.vault/.key"

# Visible noise so a plain ls looks "complete".
printf 'welcome\n' > "$ROOT/readme.txt"
mkdir -p "$ROOT/work"; printf 'draft\n' > "$ROOT/work/report.txt"

# Decoys that look like the prize but are not.
printf 'BK{this-is-only-a-backup-not-the-key}\n' > "$ROOT/.flag.bak"
printf 'BK{stale-rotated-out}\n'                  > "$ROOT/.config/.old_key"

cat > "$ROOT/README.txt" <<'TXT'
=== Hidden Files ===
A plain  ls  will not show everything here. The real key sits in a
hidden file, inside a chain of hidden directories.

  ls -a            shows dotfiles in the current directory
  ls -aR           walk everything, hidden included
Decoys named like .bak / .old are traps — read carefully.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
