#!/bin/bash
# Room (medium): strings — pull readable text out of a binary blob.
# The flag is embedded in a binary file full of non-printable bytes; `cat`
# is useless, `strings` + grep reveals it.
set -e
FLAG="${BK_FLAG:-}"
[ -n "$FLAG" ] || FLAG="CIPHER<<str1ngs_b1n4ry_extr4ct_devplaceholder01>>"
ROOT=/home/student
blob="$ROOT/core.dump"

# Build a binary file: random bytes, with decoy and encoded real flags sandwiched in the middle.
# Real flag is ROT13 encoded so raw grep for prefix or brackets returns garbage.
ROT13_FLAG=$(printf '%s' "$FLAG" | tr 'A-Za-z' 'N-ZA-Mn-za-m')

head -c 2048 /dev/urandom > "$blob"
printf '\nVAULT<raw_str1ngs_w1th0ut_m4rk3r_decoy1>\n' >> "$blob"
head -c 2048 /dev/urandom >> "$blob"
printf 'MARKER-%s-END' "$ROT13_FLAG" >> "$blob"
head -c 2048 /dev/urandom >> "$blob"
printf '\nKEEP[st4l3_m3m0ry_4rt1f4ct_decoy2]\n' >> "$blob"
head -c 2048 /dev/urandom >> "$blob"

cat > "$ROOT/README.txt" <<'TXT'
=== Binary Extraction (medium) ===
core.dump contains memory artifacts captured during an incident. The file consists
mostly of non-printable binary data, but contains an embedded, delimited memory artifact.

1. Extract readable strings from the binary dump to locate the record enclosed by MARKER-...-END.
2. The payload between the markers is ROT13 encoded. Decode the extracted string using:
   tr 'A-Za-z' 'N-ZA-Mn-za-m'
to reveal the authentic key.
TXT

unset BK_FLAG
# ttyd base path so assets + /ws resolve behind the /labs/<name> proxy.
BASE_ARG=()
[ -n "${BK_BASE:-}" ] && BASE_ARG=(-b "$BK_BASE")
exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
