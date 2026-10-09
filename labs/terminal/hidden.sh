#!/bin/bash
# Room: Hidden files — dotfiles and ls -a.
# The genuine key is stashed deep inside .config/.cache/.vault/.key.
# Decoys with matching flag format are planted across other hidden dotfiles.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="RUNE/d0t_f1l3s_unv31l3d_devplaceholder01/"
ROOT=/home/student
rand_hex() { tr -dc 'a-f0-9' </dev/urandom | head -c16; }

mkdir -p "$ROOT/.config/.cache/.vault"
printf '%s\n' "$FLAG" > "$ROOT/.config/.cache/.vault/.key"

# Visible files
printf 'welcome to your terminal session\n' > "$ROOT/readme.txt"
mkdir -p "$ROOT/work"; printf 'annual report draft\n' > "$ROOT/work/report.txt"
mkdir -p "$ROOT/backups"; printf 'archive index\n' > "$ROOT/backups/index.txt"

# Decoy flags planted across hidden files and directories using distinct formats (never RUNE or BK)
# At least 3 decoy files split across lines so blind single-line grep fails
mkdir -p "$ROOT/.cache_old" "$ROOT/.local/share" "$ROOT/.trash" "$ROOT/.keys"
printf 'VAULT<d0t_f1l3s_unv31l3d_%s>\n' "$(rand_hex)" > "$ROOT/.flag.bak"
printf 'VAULT<d0t_f1l3s_\nunv31l3d_%s>\n' "$(rand_hex)" > "$ROOT/.old_key"
printf 'KEEP[d0t_f1l3s_unv31l3d_%s]\n' "$(rand_hex)" > "$ROOT/.config/.stale_key"
printf 'KEEP[d0t_f1l3s_unv31l3d_%s]\n' "$(rand_hex)" > "$ROOT/.cache_old/.token"
printf 'VAULT<d0t_f1l3s_unv31l3d_%s>\n' "$(rand_hex)" > "$ROOT/.local/share/.vault"
printf 'KEEP[d0t_f1l3s_\nunv31l3d_%s]\n' "$(rand_hex)" > "$ROOT/.trash/.deleted_flag"
printf 'VAULT<d0t_f1l3s_\nunv31l3d_%s>\n' "$(rand_hex)" > "$ROOT/.keys/.key.1"
printf 'KEEP[d0t_f1l3s_unv31l3d_%s]\n' "$(rand_hex)" > "$ROOT/.keys/.key.2"
printf 'VAULT<d0t_f1l3s_unv31l3d_%s>\n' "$(rand_hex)" > "$ROOT/work/.draft_key"
printf 'KEEP[d0t_f1l3s_unv31l3d_%s]\n' "$(rand_hex)" > "$ROOT/backups/.vault_backup"

cat > "$ROOT/README.txt" <<'TXT'
=== Hidden Files ===
A standard directory listing hides dotfiles and nested configurations.
The genuine key is stashed deep inside the active vault hierarchy at .config/.cache/.vault/.key.

Beware: multiple decoy flags are planted in stale and backup dotfiles.
Navigate to the authentic key location to retrieve it.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
