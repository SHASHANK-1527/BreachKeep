# Dungeon 1: Terminal-1 — "First Steps" Challenge Documentation

The **First Steps** dungeon trains students in fundamental Linux shell operations, filesystem navigation, string filtering, text processing pipelines, archive carving, and log forensics.

All 10 challenge containers in this dungeon inherit from `breachkeep/base` (Debian Bookworm Slim + `ttyd`) and execute on the isolated `bk_labs` network with capability restrictions.

---

## 1. Challenge: `terminal-1-first-steps` (First Steps)

- **Tier**: Mandatory (Room I)
- **Flag Format**: `BK{cd_ls_c4t_b4s1cs_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-first-steps`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-first-steps), [`labs/terminal/first-steps.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/first-steps.sh)

### 1.1 Environment Construction & Challenge Creation
- **Base Layer & Image**: Starts `FROM breachkeep/base`. During build, the `find` binary is removed (`RUN rm -f /usr/bin/find /bin/find`) to force students to manually navigate directory structures using core shell builtins and primitives.
- **Dynamic File Tree Generation**:
  At container startup, [`first-steps.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/first-steps.sh) generates three nested randomized directory names using `/dev/urandom`:
  ```bash
  d1=$(tr -dc 'a-z' </dev/urandom | head -c6)
  d2=$(tr -dc 'a-z' </dev/urandom | head -c6)
  d3=$(tr -dc 'a-z' </dev/urandom | head -c6)
  mkdir -p "/home/student/$d1/$d2/$d3"
  printf '%s\n' "$FLAG" > "/home/student/$d1/$d2/$d3/flag.txt"
  ```
- **Anti-Grepping Decoy Matrix**:
  To defeat recursive searching (`grep -r "BK{"`), the script generates 25 randomized directory branches containing dummy files (`notes.txt`, `memo.txt`, `backup.log`, `archive.dat`, `scratchpad.txt`, etc.). Each decoy file contains a syntactically valid decoy flag (`BK{cd_ls_c4t_b4s1cs_<random_hex>}`). Only the single file explicitly titled `flag.txt` holds the genuine HMAC flag.
- **Environment Purge**: Unsets `BK_FLAG` before spawning `ttyd`:
  ```bash
  exec env -u BK_FLAG ttyd -W -p 7681 -i 0.0.0.0 "${BASE_ARG[@]}" bash
  ```

### 1.2 Skills & Concepts Tested
- Filesystem hierarchy understanding (`/`, `/home/student`, `.`, `..`).
- Core navigation commands: `pwd` (print working directory), `ls` (list directory contents), `cd` (change directory).
- Content inspection: `cat` (concatenate and display file content).
- Overcoming tool unavailability (absence of `find`).

### 1.3 Flag Location & Mechanics
- **Path**: `/home/student/<random_dir1>/<random_dir2>/<random_dir3>/flag.txt`
- **Ownership/Permissions**: `student:student`, mode `0644`.

### 1.4 Intended Path of Solving
1. Inspect the starting directory:
   ```bash
   pwd
   ls -la
   ```
2. Identify subdirectories and step downward iteratively:
   ```bash
   ls
   cd <dir1>
   ls
   cd <dir2>
   ls
   cd <dir3>
   ls
   ```
3. Locate `flag.txt` (ignoring decoy files like `memo.txt` or `notes.txt`) and read it:
   ```bash
   cat flag.txt
   ```
4. Copy the output `BK{cd_ls_c4t_b4s1cs_...}` and submit via the BreachKeep web interface.

---

## 2. Challenge: `terminal-1-reading` (The Ledger)

- **Tier**: Mandatory (Room II)
- **Flag Format**: `BK{sp3c1f1c_l1n3_r34d3r_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-reading`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-reading), [`labs/terminal/reading.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/reading.sh)

### 2.1 Environment Construction & Challenge Creation
- **File Generation**: [`reading.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/reading.sh) creates `/home/student/ledger.log` containing exactly 1,500 lines of transaction logs.
- **Target Line Selection**: Randomly assigns the real flag to line $N$ (where $100 \le N \le 1400$):
  ```bash
  TOTAL=1500
  LINE=$(( (RANDOM % (TOTAL - 200)) + 100 ))
  ```
- **Decoy Injection**: Selects 35 random lines across `ledger.log` and injects decoy keys (`BK{sp3c1f1c_l1n3_r34d3r_<hex>}`).
- **Briefing**: Writes `/home/student/README.txt` stating the exact target line number ($LINE$) generated for that container.

### 2.2 Skills & Concepts Tested
- Large file inspection without scrolling or loading entire files into memory.
- Precision line extraction using `sed`, `awk`, or `head | tail`.
- Command line pagination with `less`.

### 2.3 Flag Location & Mechanics
- **Path**: Line $LINE$ inside `/home/student/ledger.log`.
- **Decoys**: 35 other lines contain valid-looking keys to trap students running `grep "BK{" ledger.log`.

### 2.4 Intended Path of Solving
1. Read the target line number from `README.txt`:
   ```bash
   cat README.txt
   ```
   *(Example: "The genuine vault key was recorded specifically on line 742.")*
2. Extract the specific line using `sed`:
   ```bash
   sed -n '742p' ledger.log
   ```
   *Alternative methods:*
   ```bash
   head -n 742 ledger.log | tail -n 1
   # OR
   awk 'NR==742' ledger.log
   # OR
   less +742g ledger.log
   ```
3. Extract the key `BK{sp3c1f1c_l1n3_r34d3r_...}` and submit.

---

## 3. Challenge: `terminal-1-hidden` (What ls Won’t Show)

- **Tier**: Mandatory (Room III)
- **Flag Format**: `BK{d0t_f1l3s_unv31l3d_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-hidden`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-hidden), [`labs/terminal/hidden.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/hidden.sh)

### 3.1 Environment Construction & Challenge Creation
- **Directory Structure**: [`hidden.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/hidden.sh) creates nested hidden directories:
  `/home/student/.config/.cache/.vault/`
  Inside this path, it writes `.key` containing the genuine flag.
- **Decoy Dotfiles**: Creates visible distraction directories (`work/`, `backups/`) and multiple hidden decoy files:
  - `~/.flag.bak`
  - `~/.old_key`
  - `~/.config/.stale_key`
  - `~/.cache_old/.token`
  - `~/.local/share/.vault`
  - `~/.trash/.deleted_flag`
  - `~/.keys/.key.1`, `~/.keys/.key.2`
  - `~/work/.draft_key`
  - `~/backups/.vault_backup`
  Each decoy holds `BK{d0t_f1l3s_unv31l3d_<hex>}`.

### 3.2 Skills & Concepts Tested
- Identifying UNIX hidden files (files beginning with a dot `.`).
- Using `ls -a` (all files) and `ls -la`.
- Recursive directory listing (`ls -R` or `ls -laR`).

### 3.3 Flag Location & Mechanics
- **Path**: `/home/student/.config/.cache/.vault/.key`
- **Permissions**: `0644`, owned by `student:student`.

### 3.4 Intended Path of Solving
1. Reveal hidden files in the home directory:
   ```bash
   ls -la
   ```
2. Notice `.config/` (and decoy `.cache_old/`, `.flag.bak`, etc.).
3. Traverse into `.config/`:
   ```bash
   cd .config
   ls -la
   cd .cache
   ls -la
   cd .vault
   ls -la
   ```
4. Read the hidden key file:
   ```bash
   cat .key
   ```
   *One-line shortcut:*
   ```bash
   cat ~/.config/.cache/.vault/.key
   ```

---

## 4. Challenge: `terminal-1-finding` (The Needle - warm-up)

- **Tier**: Mandatory (Room IV)
- **Flag Format**: `BK{f1nd_10k_d4t_sp3c14l1st_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-finding`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-finding), [`labs/terminal/finding.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/finding.sh)

### 4.1 Environment Construction & Challenge Creation
- **Directory Pile**: Creates `/home/student/pile/` populated with 500 randomly named files having extensions `.dat`, `.log`, `.tmp`, `.cfg`, and `.bin`.
- **Condition Matrix**:
  1. File type: Regular file (`-type f`).
  2. Filename: Must end in `.dat` (`-name "*.dat"`).
  3. File size: Strictly greater than 10 Kilobytes (`-size +10k`).
- **Traps & Decoys**:
  - Traps with `size > 10k` but wrong extensions (`.log`, `.tmp`, `.bin`).
  - Small `.dat` files (< 2 KB) containing decoy flags `BK{f1nd_10k_d4t_sp3c14l1st_<hex>}`.
  - 35 random non-matching files injected with decoy flags.
- **True Target**: A single file `pile/record_<random>.dat` sized at ~13,000 bytes with the real flag appended as the final line.

### 4.2 Skills & Concepts Tested
- Advanced use of the `find` utility.
- Stacking multiple logical filter criteria (`-name`, `-size`, `-type`).
- Tail reading to view the final line of a large file.

### 4.3 Flag Location & Mechanics
- **Path**: Last line of `/home/student/pile/record_<random>.dat`.

### 4.4 Intended Path of Solving
1. Execute `find` combining all three criteria:
   ```bash
   find pile -type f -name "*.dat" -size +10k
   ```
   *Output yields exactly one matching path: `pile/record_x8k2q.dat`.*
2. Extract the last line containing the flag:
   ```bash
   tail -n 1 pile/record_x8k2q.dat
   ```

---

## 5. Challenge: `terminal-1-grep` (The Golden Ticket)

- **Tier**: Mandatory (Room V)
- **Flag Format**: `BK{g0ld3n_t1ck3t_c4s3_1gn0r3d_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-grep`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-grep), [`labs/terminal/grep.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/grep.sh)

### 5.1 Environment Construction & Challenge Creation
- **Directory Hierarchy**: Under `/home/student/docs/`, subdirectories `a/`, `b/`, `c/`, and `b/sub/` are populated with 80+ text files containing random pseudo-incident text.
- **The Case-Sensitivity Trap**: The genuine flag is written to `/home/student/docs/b/sub/log_42.txt` with scrambled casing:
  ```bash
  printf 'the gOlDeN tIcKeT is right here -> %s\n' "$FLAG" > "$ROOT/b/sub/log_42.txt"
  ```
- **Decoys**: 30 decoy lines are planted across various notes referencing:
  - "the silver ticket was archived here"
  - "the bronze ticket was expired"
  - "platinum ticket reservation"
  - "diamond ticket voucher"
  Each paired with `BK{g0ld3n_t1ck3t_c4s3_1gn0r3d_<hex>}`. Standard `grep "BK{"` hits dozens of traps; a standard case-sensitive `grep -r "golden ticket"` hits 0 results.

### 5.2 Skills & Concepts Tested
- Recursive text pattern searching with `grep -r`.
- Case-insensitive searching with `grep -i`.
- String literal searching in nested directories.

### 5.3 Flag Location & Mechanics
- **Path**: Inside `/home/student/docs/b/sub/log_42.txt` on the line containing `gOlDeN tIcKeT`.

### 5.4 Intended Path of Solving
1. Execute recursive, case-insensitive grep for the phrase "golden ticket":
   ```bash
   grep -ri "golden ticket" docs/
   ```
2. The terminal outputs:
   `docs/b/sub/log_42.txt:the gOlDeN tIcKeT is right here -> BK{g0ld3n_t1ck3t_c4s3_1gn0r3d_...}`
3. Copy and submit the flag.

---

## 6. Challenge: `terminal-1-pipes` (Busiest on the Wire)

- **Tier**: Medium (Room VI)
- **Flag Format**: `BK{p1p3_fr3qu3ncy_pr0_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-pipes`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-pipes), [`labs/terminal/pipes.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/pipes.sh), [`labs/terminal/bkguard.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/bkguard.sh)

### 6.1 Environment Construction & Challenge Creation
- **Security & Privilege Model**: The container starts as root (`USER root`) with `GUARD_CAPS`. It creates `/opt/bk` (mode `0700`, owner `root:root`), stores the flag in `/opt/bk/flag` (mode `0600`), and launches [`bkguard`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/bkguard.sh) as root in the background. It then uses `setpriv` to drop privileges to `student` before launching `ttyd`.
- **Log Synthesis**: Generates `/home/student/access.log` containing simulated web server traffic. A pool of 25 random IP addresses generate 1–40 requests each. Exactly one IP (`top_ip`) generates 60–99 requests (`top_count`), making it the clear mathematical outlier.
- **Root Answer Guard**:
  ```bash
  printf '%s %s' "$top_ip" "$top_count" > /opt/bk/expected
  ```
  The student cannot read `/opt/bk/flag` or `/opt/bk/expected`. They must submit their answer via the [`check`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/check) binary.

### 6.2 Skills & Concepts Tested
- UNIX pipeline construction (`|`).
- Field delimiter parsing with `cut` or `awk`.
- Frequency analysis using `sort | uniq -c | sort -nr`.
- Direct integration with root evaluation daemons.

### 6.3 Flag Location & Mechanics
- **Location**: Root-held inside `/opt/bk/flag`.
- **Release Condition**: Student runs `check <top_ip> <count>`. The root guard verifies the values against `/opt/bk/expected` and writes the flag to `/home/student/.bk_result`.

### 6.4 Intended Path of Solving
1. Examine the log file structure:
   ```bash
   head -n 5 access.log
   ```
   *(Line format: `10.0.9.142 - - [req] "GET /item/12 HTTP/1.1" 200`)*
2. Construct the pipeline to isolate the IP, sort, count frequencies, and display the top entry:
   ```bash
   cut -d " " -f 1 access.log | sort | uniq -c | sort -nr | head -n 1
   ```
   *(Example output: `78 10.0.9.142`)*
3. Submit the IP and count to `check`:
   ```bash
   check 10.0.9.142 78
   ```
4. `check` queries `bkguard` and returns the student's flag.

---

## 7. Challenge: `terminal-1-archives` (Russian Dolls)

- **Tier**: Medium (Room VII)
- **Flag Format**: `BK{p33l_th3_c0mpr3ss10n_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-archives`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-archives), [`labs/terminal/archives.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/archives.sh)

### 7.1 Environment Construction & Challenge Creation
- **Nested Compression Construction**:
  1. Innermost layer: `flag.txt` containing the flag.
  2. Layer 1: Gzip compressed, disguised as `layer1` (no `.gz` extension).
  3. Layer 2: Tar archived, disguised as `layer2.tar`.
  4. Layer 3: XZ compressed, saved in `/home/student/evidence.log` (disguised as a plain text log file).
- Extensions are deliberately deceptive so utilities like `cat` fail and tools that rely purely on filename extensions error out.

### 7.2 Skills & Concepts Tested
- Binary header identification using the `file` command.
- Multi-format archive extraction: `xz`, `tar`, `gzip`.
- Working through disguised file extensions.

### 7.3 Flag Location & Mechanics
- **Location**: Buried inside three layers of compression in `/home/student/evidence.log`.

### 7.4 Intended Path of Solving
1. Query the actual file type:
   ```bash
   file evidence.log
   ```
   *(Output: `evidence.log: XZ compressed data`)*
2. Decompress layer 1:
   ```bash
   mv evidence.log evidence.xz
   xz -d evidence.xz
   ```
3. Inspect the resulting file:
   ```bash
   file evidence
   ```
   *(Output: `evidence: POSIX tar archive`)*
4. Extract the tar archive:
   ```bash
   tar -xf evidence
   ```
5. Inspect the unpacked file `layer1`:
   ```bash
   file layer1
   ```
   *(Output: `layer1: gzip compressed data`)*
6. Decompress the gzip layer:
   ```bash
   mv layer1 layer1.gz
   gzip -d layer1.gz
   ```
7. Verify and read the plain text file:
   ```bash
   file layer1
   cat layer1
   ```

---

## 8. Challenge: `terminal-1-strings` (Ghost in the Dump)

- **Tier**: Medium (Room VIII)
- **Flag Format**: `BK{str1ngs_b1n4ry_extr4ct_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-strings`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-strings), [`labs/terminal/strings.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/strings.sh)

### 8.1 Environment Construction & Challenge Creation
- **Memory Dump Generation**: [`strings.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/strings.sh) creates `/home/student/core.dump` by interleaving 8 KB of raw pseudo-random binary data from `/dev/urandom` with decoy flag strings:
  - `BK{raw_str1ngs_w1th0ut_m4rk3r_decoy1}`
  - `BK{st4l3_m3m0ry_4rt1f4ct_decoy2}`
- **The True Target**: Encapsulated between identifying delimiters:
  `MARKER-BK{str1ngs_b1n4ry_extr4ct_<hmac>}-END`
  Running `cat` fills the terminal with unprintable characters; `strings` filters out binary garbage.

### 8.2 Skills & Concepts Tested
- Extracting printable ASCII text from binary files using `strings`.
- Combining `strings` with `grep`.
- Basic memory artifact analysis.

### 8.3 Flag Location & Mechanics
- **Location**: Embedded at an offset inside `/home/student/core.dump`.

### 8.4 Intended Path of Solving
1. Extract printable strings and search for the `BK` prefix or `MARKER`:
   ```bash
   strings core.dump | grep MARKER
   # OR
   strings core.dump | grep "BK{"
   ```
2. Identify the marked key:
   `MARKER-BK{str1ngs_b1n4ry_extr4ct_...}-END`
3. Copy the flag substring and submit.

---

## 9. Challenge: `terminal-1-log-detective` (Log Detective)

- **Tier**: Hard (Room IX)
- **Flag Format**: `BK{34rl13st_4tt4ck3r_l0g_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-log-detective`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-log-detective), [`labs/terminal/log-detective.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/log-detective.sh)

### 9.1 Environment Construction & Challenge Creation
- **Cross-Log Synthesis**: Creates three realistic log files under `/home/student/`:
  1. `auth.log` (Syslog format: `Mon DD HH:MM:SS`): Shows an attacker IP performing 15 brute-force SSH attempts (`Failed password for root...`) followed by an accepted login.
  2. `web.log` (ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`): Records web traffic from the attacker IP at $T_0 + 3000s$.
  3. `app.log` (Raw UNIX Epoch timestamp format: `1740...`): Records initial recon login probes from the attacker IP at exact base timestamp $T_0$.
- **Noise Distribution**: Noise IPs have timestamps earlier than $T_0$, ensuring students cannot simply pick the minimum epoch timestamp globally. They must first isolate the attacker IP.
- **Root Answer Guard**:
  ```bash
  ANSWER="$(date -u -d "@${T0}" +'%Y-%m-%d %H:%M:%S')"
  printf '%s' "$ANSWER" > /opt/bk/expected
  ```

### 9.2 Skills & Concepts Tested
- Security incident log correlation across multiple heterogeneous formats.
- Identifying brute-force patterns in `auth.log`.
- UNIX timestamp conversion (`date -u -d @<epoch>`).

### 9.3 Flag Location & Mechanics
- **Location**: Root-held inside `/opt/bk/flag`.
- **Validation**: Student must submit the attacker's earliest UTC timestamp: `check YYYY-MM-DD HH:MM:SS`.

### 9.4 Intended Path of Solving
1. Audit `auth.log` to identify the malicious brute-forcing IP address:
   ```bash
   grep "Failed password" auth.log | awk '{print $(NF-3)}' | sort | uniq -c
   ```
   *(Attacker IP identified: e.g., `203.0.113.88`)*
2. Search for all occurrences of that IP across the three logs:
   ```bash
   grep "203.0.113.88" auth.log
   grep "203.0.113.88" web.log
   grep "203.0.113.88" app.log
   ```
3. Examine `app.log` lines for the earliest raw epoch timestamp:
   ```bash
   grep "203.0.113.88" app.log
   ```
   *(Example: `1740124850 LOGIN ok user=svc ip=203.0.113.88`)*
4. Convert the epoch to UTC format:
   ```bash
   date -u -d @1740124850 +'%Y-%m-%d %H:%M:%S'
   ```
   *(Example output: `2025-02-21 08:00:50`)*
5. Submit the normalized timestamp to `check`:
   ```bash
   check 2025-02-21 08:00:50
   ```
6. Receive the flag from `bkguard`.

---

## 10. Challenge: `terminal-1-needle` (Needle by Metadata)

- **Tier**: Hard (Room X)
- **Flag Format**: `BK{m3t4d4t4_4ud1t_n33dl3_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-1-needle`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-1-needle), [`labs/terminal/needle.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/needle.sh)

### 10.1 Environment Construction & Challenge Creation
- **Directory Setup**: Populates `/home/student/store/` with over 400 files.
- **Target Metadata Specification**: Exactly one file satisfies all three criteria simultaneously:
  1. Owner: `archivist` (`id archivist` created by root at startup).
  2. Permission bits: Strictly `0600` (`-rw-------`).
  3. Last modified time: Older than 365 days (`touch -d '2 years ago'`).
- **Traps & Decoys**:
  - 400 files owned by `student` with varying permissions (`644`, `640`, `664`, `600`).
  - 5 near-miss files owned by `archivist` but with mode `0644` and recent modification dates.
  - 1 near-miss file with mode `0600` and modified 3 years ago, but owned by `student`.
- **In-Container Permission Barrier**: Because the target file is mode `0600` and owned by `archivist`, the student account cannot open or `cat` it directly. The student must verify the path with `check <path>`.

### 10.2 Skills & Concepts Tested
- Advanced `find` queries filtering by filesystem metadata rather than filename or content.
- Options: `-user`, `-perm`, `-mtime`.
- Understanding POSIX file ownership and access control boundaries.

### 10.3 Flag Location & Mechanics
- **Location**: Written inside `/home/student/store/ledger_<random>.txt` and guarded in `/opt/bk/flag`.
- **Validation**: Student must find the path and execute `check /home/student/store/ledger_<random>.txt`.

### 10.4 Intended Path of Solving
1. Formulate the `find` command matching the three metadata constraints:
   ```bash
   find store -user archivist -perm 600 -mtime +365
   ```
   *Output returns exactly one file: `store/ledger_7k9a1.txt`.*
2. Attempting `cat store/ledger_7k9a1.txt` returns `Permission denied` (confirming realistic permission barriers).
3. Submit the full path to `check`:
   ```bash
   check /home/student/store/ledger_7k9a1.txt
   ```
4. The root guard compares the path against `/opt/bk/expected` and returns the student's flag.
