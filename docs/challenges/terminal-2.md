# Dungeon 2: Terminal-2 — "Keys to the Keep" Challenge Documentation

The **Keys to the Keep** dungeon explores system security fundamentals: POSIX file permission bits, user and group boundaries, environment variables, automation scripting, scheduled task vulnerabilities, search path hijacking, SUID audits, and privilege escalation via `sudo`.

All rooms build on `breachkeep/base`. Escalation rooms selectively adjust Linux capabilities (`SETFCAP`, `AUDIT_WRITE`) and `no-new-privileges` to permit authentic setuid privilege escalation.

---

## 1. Challenge: `terminal-2-perms` (Read, Write, Execute)

- **Tier**: Mandatory (Room I)
- **Flag Format**: `BK{p3rm1ss10n_m4st3r_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-perms`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-perms), [`labs/terminal/t2-perms.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-perms.sh)

### 1.1 Environment Construction & Challenge Creation
- **File Setup**: Creates `/home/student/run.sh` with initial permissions `0600` (`-rw-------`), owned by `student:student`. The script contains `echo "the keep acknowledges you"`.
- **Verification Engine ([`bkverify.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/bkverify.sh))**:
  Runs `/opt/bk/verify.sh` as root whenever the student runs `check`:
  ```bash
  f=/home/student/run.sh
  [ -x "$f" ] || { echo "run.sh is still not executable"; exit 1; }
  mode=$(stat -c '%a' "$f")
  [ "$mode" = "777" ] && { echo "777 is overly permissive; grant only appropriate permissions"; exit 1; }
  [ "$(stat -c '%A' "$f" | cut -c9)" = "w" ] && { echo "it is world-writable; remove other-write"; exit 1; }
  exit 0
  ```
- The validator enforces the **Principle of Least Privilege**: lazy fixes like `chmod 777` or granting world-write permissions (`chmod o+w`) are explicitly rejected.

### 1.2 Skills & Concepts Tested
- Understanding UNIX permission triplets: User (u), Group (g), Other (o).
- Applying octal and symbolic `chmod` (`chmod u+x` or `chmod 700`/`755`).
- Rejecting unsafe world-writable permissions.

### 1.3 Flag Location & Mechanics
- **Location**: Root-held at `/opt/bk/flag`.
- **Release Condition**: Successful execution of `check` when `run.sh` is executable by the user and not world-writable.

### 1.4 Intended Path of Solving
1. Inspect current permissions:
   ```bash
   ls -l run.sh
   ```
   *(Shows: `-rw------- 1 student student 42 ... run.sh`)*
2. Attempting `./run.sh` returns `Permission denied`.
3. Add execute permissions for the user owner (avoiding 777):
   ```bash
   chmod u+x run.sh
   # OR
   chmod 700 run.sh
   # OR
   chmod 755 run.sh
   ```
4. Test running the script:
   ```bash
   ./run.sh
   ```
5. Trigger validation:
   ```bash
   check
   ```
6. `bkverify` confirms compliance and returns the flag.

---

## 2. Challenge: `terminal-2-groups` (Who Can Read This)

- **Tier**: Mandatory (Room II)
- **Flag Format**: `BK{gr0up_m3mb3rsh1p_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-groups`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-groups), [`labs/terminal/t2-groups.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-groups.sh)

### 2.1 Environment Construction & Challenge Creation
- **Group Setup**: Creates system group `keepers` and adds `student` to it:
  ```bash
  groupadd keepers
  usermod -aG keepers student
  groupadd wardens
  ```
- **Vault File Layout**:
  - `/vault/keyring.txt`: Mode `0640` (`-rw-r-----`), owned by `root:keepers`. Contains the genuine flag `$FLAG`.
  - `/vault/public.txt`: Mode `0644`, public informational note.
  - `/vault/warden-only.txt`: Mode `0640`, owned by `root:wardens`. Contains decoy string `BK{wrong-vault}`. `student` cannot read this file because they are not in the `wardens` group.

### 2.2 Skills & Concepts Tested
- Querying user identities and group memberships (`id`, `groups`).
- Group-level file permissions (the middle triplet in `ls -l`).
- Recognizing why a file is accessible based on group membership rather than file ownership.

### 2.3 Flag Location & Mechanics
- **Path**: `/vault/keyring.txt`.
- Read access is granted because `student` belongs to the `keepers` group.

### 2.4 Intended Path of Solving
1. Check current user identity and group memberships:
   ```bash
   id
   # OR
   groups
   ```
   *(Output shows: `uid=1000(student) gid=1000(student) groups=1000(student),1001(keepers)`)*
2. Inspect the `/vault` directory:
   ```bash
   ls -la /vault
   ```
   *(Shows `/vault/keyring.txt` is readable by group `keepers`, while `/vault/warden-only.txt` is restricted to `wardens`)*
3. Read the authorized file:
   ```bash
   cat /vault/keyring.txt
   ```
4. Copy and submit the retrieved flag.

---

## 3. Challenge: `terminal-2-env` (The Service PIN)

- **Tier**: Mandatory (Room III)
- **Flag Format**: `BK{3nv_v4r_s3cr3ts_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-env`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-env), [`labs/terminal/t2-env.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-env.sh)

### 3.1 Environment Construction & Challenge Creation
- **Configuration File**: Generates an 8-character alphanumeric PIN (`PIN=$(tr -dc 'A-Z0-9' </dev/urandom | head -c8)`) and writes `/etc/keepservice.conf` (mode `0644`):
  ```bash
  export SERVICE_NAME=keepd
  export SERVICE_PIN=<random_PIN>
  export SERVICE_MODE=prod
  ```
- **Validation**: Stores the expected PIN in `/opt/bk/expected`. When `check <PIN>` is run, `/opt/bk/verify.sh` verifies that the submitted parameter matches the generated PIN.

### 3.2 Skills & Concepts Tested
- Investigating system configuration directories (`/etc`).
- Discovering exposed credentials and tokens stored in configuration files.
- Command-line searching with `grep`.

### 3.3 Flag Location & Mechanics
- **Location**: Root-held in `/opt/bk/flag`.
- **Validation**: Student finds the PIN in `/etc/keepservice.conf` and runs `check <PIN>`.

### 3.4 Intended Path of Solving
1. Search `/etc` for files defining a PIN or service secret:
   ```bash
   grep -ri "pin" /etc/ 2>/dev/null
   ```
   *(Output: `/etc/keepservice.conf:export SERVICE_PIN=K8P2N9X1`)*
2. Inspect the configuration file:
   ```bash
   cat /etc/keepservice.conf
   ```
3. Submit the discovered PIN to `check`:
   ```bash
   check K8P2N9X1
   ```
4. Receive the flag.

---

## 4. Challenge: `terminal-2-scripts` (Your First Script)

- **Tier**: Mandatory (Room IV)
- **Flag Format**: `BK{sh3ll_scr1pt_4ud1t_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-scripts`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-scripts), [`labs/terminal/t2-scripts.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-scripts.sh)

### 4.1 Environment Construction & Challenge Creation
- **Starter Template**: Populates `/home/student/solve.sh`:
  ```bash
  #!/bin/bash
  # TODO: print ONLY the number of files ending in .log directly inside "$1"
  ```
- **Automated Grading Sandbox**:
  When `check` is executed, `/opt/bk/verify.sh` dynamically generates a temporary directory with `mktemp -d`, creates $N$ random files ending in `.log` ($2 \le N \le 9$) and 3 distraction `.txt` files. It then executes the student's `solve.sh` as the unprivileged `student` user:
  ```bash
  out=$(setpriv --reuid student --regid student --init-groups bash /home/student/solve.sh "$d" 2>/dev/null | tr -d '[:space:]')
  [ "$out" = "$n" ] && exit 0
  ```
  Hard-coded outputs fail automatically; the script must dynamically calculate the count.

### 4.2 Skills & Concepts Tested
- Writing executable Bash scripts.
- Handling positional command-line parameters (`$1`).
- Filtering by extension and counting outputs with `wc -l` or `find`.

### 4.3 Flag Location & Mechanics
- **Location**: Held inside `/opt/bk/flag`.
- **Validation**: Pass live verification on a randomized test directory.

### 4.4 Intended Path of Solving
1. Open and edit `/home/student/solve.sh` using `nano`:
   ```bash
   nano solve.sh
   ```
2. Implement one of the following standard counting solutions:
   ```bash
   #!/bin/bash
   find "$1" -maxdepth 1 -type f -name "*.log" | wc -l
   ```
   *Alternative implementation:*
   ```bash
   #!/bin/bash
   ls -1 "$1"/*.log 2>/dev/null | wc -l
   ```
3. Save the file and ensure execution bits are set:
   ```bash
   chmod +x solve.sh
   ```
4. Test locally:
   ```bash
   mkdir test_dir
   touch test_dir/a.log test_dir/b.log test_dir/c.txt
   ./solve.sh test_dir
   ```
   *(Outputs `2`)*
5. Execute the validation command:
   ```bash
   check
   ```
6. The test runner confirms accuracy and outputs the flag.

---

## 5. Challenge: `terminal-2-escalation` (What sudo -l Tells You)

- **Tier**: Mandatory (Room V)
- **Flag Format**: `BK{sud0_pr1v_3sc_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-escalation`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-escalation), [`labs/terminal/t2-escalation.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-escalation.sh)

### 5.1 Environment Construction & Challenge Creation
- **Container Hardening Parameters**: Configured in [`dungeons.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/apps/provisioner/src/dungeons.js) with `noNewPriv: false` and extra capabilities `['SETFCAP', 'AUDIT_WRITE']` so `sudo` can execute setuid root transitions without kernel blockage.
- **Root Flag Setup**: Writes the flag to `/root/flag.txt` with permissions `0600` (`root:root`).
- **The Sudoers Misconfiguration**:
  Adds rule file `/etc/sudoers.d/keep`:
  ```sudoers
  student ALL=(root) NOPASSWD: /usr/bin/cat
  ```
  This permits `student` to invoke `/usr/bin/cat` as root without entering a password.

### 5.2 Skills & Concepts Tested
- Auditing user sudo privileges with `sudo -l`.
- Recognizing security risks in delegating file-reading or editor binaries to root.
- Exploiting `NOPASSWD` rules to read sensitive root files.

### 5.3 Flag Location & Mechanics
- **Path**: `/root/flag.txt` (readable only by root).

### 5.4 Intended Path of Solving
1. Query available sudo privileges:
   ```bash
   sudo -l
   ```
   *(Output includes: `(root) NOPASSWD: /usr/bin/cat`)*
2. Read the root flag file using elevated privileges:
   ```bash
   sudo cat /root/flag.txt
   ```
3. Copy and submit the retrieved flag.

---

## 6. Challenge: `terminal-2-cron-watch` (The Nightly Job)

- **Tier**: Medium (Room VI)
- **Flag Format**: `BK{cr0n_j0b_t4mp3r_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-cron-watch`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-cron-watch), [`labs/terminal/t2-cron-watch.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-cron-watch.sh)

### 6.1 Environment Construction & Challenge Creation
- **Root Secret**: Stored at `/opt/bk/flag` (mode `0600`, `root:root`).
- **The Flaw**: An administrative script `/opt/cron/job.sh` has permissions `0666` (`-rw-rw-rw-`, world-writable):
  ```bash
  mkdir -p /opt/cron
  cat > /opt/cron/job.sh <<'J'
  #!/bin/bash
  echo "[cron] maintenance ran at $(date -u)" >> /var/log/keepcron.log 2>/dev/null
  J
  chmod 666 /opt/cron/job.sh
  ```
- **Simulated Cron Daemon**: Runs in the background as root every 5 seconds:
  ```bash
  ( while true; do bash /opt/cron/job.sh >/dev/null 2>&1; sleep 5; done ) &
  ```

### 6.2 Skills & Concepts Tested
- Identifying scheduled cron jobs and investigating associated script paths.
- File permission auditing (detecting world-writable files).
- Command injection into privileged maintenance scripts.

### 6.3 Flag Location & Mechanics
- **Path**: `/opt/bk/flag` (root-readable only).
- **Execution Vector**: Commands appended to `/opt/cron/job.sh` execute as root within 5 seconds.

### 6.4 Intended Path of Solving
1. Inspect the scheduled script and its permissions:
   ```bash
   ls -la /opt/cron/job.sh
   ```
   *(Notice permissions: `-rw-rw-rw- 1 root root`)*
2. Append a command that copies the root flag into the student home directory with read permissions:
   ```bash
   echo 'cat /opt/bk/flag > /home/student/flag.txt && chmod 644 /home/student/flag.txt' >> /opt/cron/job.sh
   ```
3. Wait 5 seconds for the simulated cron daemon to trigger.
4. Read the extracted flag:
   ```bash
   cat /home/student/flag.txt
   ```

---

## 7. Challenge: `terminal-2-path-order` (First in PATH Wins)

- **Tier**: Medium (Room VII)
- **Flag Format**: `BK{p4th_h1j4ck_pr0_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-path-order`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-path-order), [`labs/terminal/t2-path-order.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-path-order.sh)

### 7.1 Environment Construction & Challenge Creation
- **Configuration & Runner**:
  - `/opt/service/run.conf`:
    ```ini
    PATH=/home/student/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    CMD=collect
    ```
  - `/opt/service/run.sh`: Loads `run.conf` and runs `collect` without specifying an absolute binary path.
- **Vulnerability**: `/home/student/bin` is owned by `student` and appears *ahead* of the trusted system directories (`/usr/bin`, `/bin`) in the search order. If an attacker places a custom executable named `collect` inside `/home/student/bin`, the shell invokes the attacker's script instead of the legitimate binary.
- **Validation**: Student must submit the vulnerable directory path via `check /home/student/bin`.

### 7.2 Skills & Concepts Tested
- Understanding the `PATH` environment variable and binary search order resolution.
- Relative vs. absolute binary invocation security implications.
- Auditing system service configuration files.

### 7.3 Flag Location & Mechanics
- **Location**: Root-held at `/opt/bk/flag`.
- **Validation**: Guard expects `/home/student/bin`.

### 7.4 Intended Path of Solving
1. Inspect the service configuration under `/opt/service`:
   ```bash
   cat /opt/service/run.conf
   cat /opt/service/run.sh
   ```
2. Analyze the search PATH components from left to right:
   `/home/student/bin` is checked first before `/usr/local/bin` and `/usr/bin`.
3. Check permissions of `/home/student/bin`:
   ```bash
   ls -ld /home/student/bin
   ```
   *(Directory is owned and writable by `student`)*
4. Submit the hijackable directory:
   ```bash
   check /home/student/bin
   ```
5. Receive the flag.

---

## 8. Challenge: `terminal-2-suid-audit` (The Odd SUID Out)

- **Tier**: Medium (Room VIII)
- **Flag Format**: `BK{su1d_b1n4ry_hunt_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-suid-audit`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-suid-audit), [`labs/terminal/t2-suid-audit.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-suid-audit.sh)

### 8.1 Environment Construction & Challenge Creation
- **SUID Binary Implant**: Copies the standard `/bin/cp` utility to `/usr/local/bin/keepbackup` and sets the SUID bit:
  ```bash
  cp /bin/cp /usr/local/bin/keepbackup
  chown root:root /usr/local/bin/keepbackup
  chmod 4755 /usr/local/bin/keepbackup
  ```
- **Validation**: Student audits all SUID binaries, recognizes that `keepbackup` is an unauthorized custom utility, and submits `check /usr/local/bin/keepbackup`.

### 8.2 Skills & Concepts Tested
- Locating SUID/SGID binaries using `find -perm -4000`.
- Distinguishing legitimate standard operating system binaries (`passwd`, `sudo`, `mount`) from anomalous or dangerous binaries.
- Evaluating the security risks of SUID copies of core utilities.

### 8.3 Flag Location & Mechanics
- **Location**: Guarded in `/opt/bk/flag`.
- **Validation**: Expected submission is `/usr/local/bin/keepbackup`.

### 8.4 Intended Path of Solving
1. Enumerate all SUID-root binaries across the filesystem:
   ```bash
   find / -perm -4000 -type f 2>/dev/null
   ```
2. Review the resulting list:
   - `/usr/bin/passwd` (Standard)
   - `/usr/bin/gpasswd` (Standard)
   - `/usr/bin/su` (Standard)
   - `/usr/local/bin/keepbackup` (**Anomalous**)
3. Submit the path of the abnormal binary:
   ```bash
   check /usr/local/bin/keepbackup
   ```
4. Receive the flag.

---

## 9. Challenge: `terminal-2-misconfig-chain` (Two Small Mistakes)

- **Tier**: Hard (Room IX)
- **Flag Format**: `BK{m1sc0nf1g_ch41n_r00t_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-misconfig-chain`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-misconfig-chain), [`labs/terminal/t2-misconfig-chain.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-misconfig-chain.sh)

### 9.1 Environment Construction & Challenge Creation
- **Architecture**:
  - `/opt/chain/run.sh`: Owned by `root:root`, mode `0755` (read-only to users). Iterates over every script in `/opt/chain/plugins/*.sh` and executes them as root.
  - `/opt/chain/plugins/`: Mode `0777` (`rwxrwxrwx`, world-writable directory).
- **Vulnerability Chain**: While the runner script itself cannot be modified, any unprivileged user can create an arbitrary shell script inside the `plugins/` directory. Within 5 seconds, root executes the newly placed script.
- **Root Flag Location**: Mode `0600` at `/opt/bk/flag`.

### 9.2 Skills & Concepts Tested
- Chaining multi-part vulnerabilities (secure script + insecure directory permissions).
- Exploiting automated plugin/job runner directories.
- Infiltrating batch execution frameworks.

### 9.3 Flag Location & Mechanics
- **Location**: `/opt/bk/flag` (root-only).

### 9.4 Intended Path of Solving
1. Inspect the service components under `/opt/chain`:
   ```bash
   cat /opt/chain/run.sh
   ls -ld /opt/chain/plugins
   ```
   *(Notice that `/opt/chain/plugins` has mode `rwxrwxrwx`)*
2. Create an executable payload script inside the plugins directory that copies the flag to the student's home directory:
   ```bash
   cat > /opt/chain/plugins/loot.sh <<'EOF'
   #!/bin/bash
   cat /opt/bk/flag > /home/student/chain_flag.txt
   chmod 644 /home/student/chain_flag.txt
   EOF
   chmod +x /opt/chain/plugins/loot.sh
   ```
3. Wait 5 seconds for the loop runner to execute `loot.sh`.
4. Read the retrieved flag:
   ```bash
   cat /home/student/chain_flag.txt
   ```

---

## 10. Challenge: `terminal-2-audit-report` (Harden the Keep)

- **Tier**: Hard (Room X)
- **Flag Format**: `BK{sys_4ud1t_cl34r_<16_hex_hmac>}`
- **Source Files**: [`labs/terminal/Dockerfile.terminal-2-audit-report`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/Dockerfile.terminal-2-audit-report), [`labs/terminal/t2-audit-report.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/terminal/t2-audit-report.sh)

### 10.1 Environment Construction & Challenge Creation
- **Blue Team Objective**: The student acts as a security administrator. They are granted full passwordless sudo (`student ALL=(root) NOPASSWD: ALL`).
- **Three Planted Vulnerabilities**:
  1. World-writable administrative script: `/opt/cron/job.sh` (mode `0666`).
  2. World-writable storage directory: `/srv/data` (mode `0777`).
  3. World-readable credentials configuration: `/etc/keep/secret.conf` (mode `0644`).
- **Verification Logic**:
  `/opt/bk/verify.sh` checks:
  ```bash
  [ "$(stat -c '%A' /opt/cron/job.sh 2>/dev/null | cut -c9)" = "w" ] && msg="$msg /opt/cron/job.sh still world-writable;"
  [ "$(stat -c '%A' /srv/data 2>/dev/null | cut -c9)" = "w" ]        && msg="$msg /srv/data still world-writable;"
  [ "$(stat -c '%A' /etc/keep/secret.conf 2>/dev/null | cut -c8)" = "r" ] && msg="$msg /etc/keep/secret.conf still world-readable;"
  [ -z "$msg" ] && exit 0
  ```
  The challenge clears only when all three vulnerabilities are remediated.

### 10.2 Skills & Concepts Tested
- Defensive system hardening and compliance auditing.
- Hunting world-writable files and directories (`find / -perm -0002`).
- Securing credential files (`chmod 600` or `chmod 640`).
- Applying administrative fixes using `sudo chmod`.

### 10.3 Flag Location & Mechanics
- **Location**: Guarded in `/opt/bk/flag`.
- **Validation**: System audit verification script confirms all 3 security issues are resolved.

### 10.4 Intended Path of Solving
1. Audit the filesystem for world-writable files and directories:
   ```bash
   find /opt -perm -0002 -ls 2>/dev/null
   find /srv -perm -0002 -ls 2>/dev/null
   find /etc/keep -ls 2>/dev/null
   ```
2. Remediate the world-writable script `/opt/cron/job.sh`:
   ```bash
   sudo chmod 755 /opt/cron/job.sh
   ```
3. Remediate the world-writable directory `/srv/data`:
   ```bash
   sudo chmod 755 /srv/data
   ```
4. Remediate the world-readable configuration `/etc/keep/secret.conf`:
   ```bash
   sudo chmod 600 /etc/keep/secret.conf
   ```
5. Run the validation check:
   ```bash
   check
   ```
6. The audit script verifies all three fixes and prints the flag.
