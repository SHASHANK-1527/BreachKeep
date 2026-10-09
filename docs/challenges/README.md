# BreachKeep Challenge Architecture & Dungeon Master Index

Welcome to the comprehensive technical documentation for all challenge rooms and dungeons in **BreachKeep**. This manual covers the pedagogical design, container infrastructure, flag cryptography, anti-cheat barriers, and step-by-step solution paths for all **49 challenge rooms** across 6 dungeons.

---

## 1. Global Platform & Environment Architecture

BreachKeep is engineered as a gated, multi-tier cybersecurity education platform. Challenges are hosted inside disposable Linux containers created dynamically on demand.

```
                           +---------------------------+
                           |  Student Browser (React)  |
                           +-------------+-------------+
                                         |
                       +-----------------+-----------------+
                       | (HTTPS / WSS through Nginx Proxy) |
                       v                                   v
             +-------------------+               +-------------------+
             |    apps/api       |               | apps/provisioner  |
             | Express + MongoDB |               | Dockerode Manager |
             | Auth, Flags, DB   |               +---------+---------+
             +-------------------+                         |
                                              Docker Engine Socket (/var/run/docker.sock)
                                                           |
                      +------------------------------------+------------------------------------+
                      |                                                                         |
                      v                                                                         v
      [ Isolated Lab Network: bk_labs ]                                              [ Bridge Host Network ]
      (internal: true, no internet egress)                                           (published host ports)
                      |                                                                         |
        +-------------+-------------+                                             +-------------+-------------+
        | Per-Student Lab Container |                                             | Shared Capstone Target    |
        | ttyd shell (:7681)        |                                             | Keep Admin Portal         |
        | Web app (:8080)           |                                             | SSH (:2222), Web (:8088)  |
        +---------------------------+                                             +---------------------------+
```

### 1.1 The Container Lifecycle & Provisioner
- **Single Point of Docker Control**: Only [`apps/provisioner`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/apps/provisioner/src/server.js) interacts with the Docker daemon. The main API never touches Docker directly.
- **Isolated User-Defined Bridge (`bk_labs`)**: Challenge containers run on an internal Docker bridge network (`internal: true`). Containers have no default route to the external internet, preventing students from using challenges as egress proxies or attacking outbound networks.
- **Multi-Port Reverse Proxy**:
  - `ttyd` interactive terminal sessions run on port `7681`. The provisioner proxies `/labs/<container_name>` directly to port 7681 with WebSocket upgrades enabled.
  - Web targets (like The Trading Post) listen on port `8080`. The provisioner proxies `/app/<container_name>` to port 8080, stripping the path prefix.
  - Authentication to both proxy targets uses a per-session random hex token minted during provisioning and passed via query string or path-scoped session cookie (`bk_<container_name>`).

### 1.2 Linux Container Hardening & Security Controls
To prevent privilege escalation and lateral movement on the host, containers are launched with granular Linux capability restrictions ([`apps/provisioner/src/dungeons.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/apps/provisioner/src/dungeons.js)):
- **Default Posture**: `CapDrop: ['ALL']` with `SecurityOpt: ['no-new-privileges']`.
- **Guard Rooms**: Require root at entrypoint initialization to configure filesystems, drop privileges, and isolate flags. They receive `GUARD_CAPS = ['CHOWN', 'DAC_OVERRIDE', 'FOWNER', 'SETUID', 'SETGID', 'SETPCAP']` while keeping `no-new-privileges: true`.
- **Escalation Rooms**: Specifically teach `sudo` privilege escalation. These containers require `SETFCAP` and `AUDIT_WRITE` and explicitly disable `no-new-privileges` (`noNewPriv: false`) to allow setuid binaries to elevate permissions.
- **Network Rooms**: Grant `NET_BIND_SERVICE` allowing internal daemons to bind privileged ports (such as DNS on port 53 or HTTP on port 80).
- **Resource Constraints**: Strict process limits (`PidsLimit: 128`), CPU throttling (`NanoCpus`), and memory caps (`256m`).

---

## 2. Flag Cryptography & Anti-Cheat Mechanisms

### 2.1 Unforgeable Per-Student HMAC Flags
Flags are dynamically computed per student, per room using HMAC-SHA256:
$$\text{Flag} = \text{"BK\{"} + \text{ROOM\_SLUG} + \text{"\_"} + \text{HMAC-SHA256}(\text{userId} + \text{":"} + \text{roomId}, \text{FLAG\_HMAC\_SECRET})[0..16] + \text{"\}"}$$

- **No Hard-Coded Real Flags**: Every student receives a mathematically unique flag. Sharing flags between students is completely useless.
- **Verification**: The API endpoint `POST /api/flags/submit` ([`apps/api/src/controllers/flagController.js`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/apps/api/src/controllers/flagController.js)) computes the expected HMAC for the authenticated session's user ID and validates submissions using constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.

### 2.2 Decoy Flags & Anti-Grepping Traps
To discourage naive automated scans (e.g., `grep -ri "BK{" /`), challenge generators plant dozens of syntactically identical **decoy flags** matching the room's prefix:
- Example: `BK{d0t_f1l3s_unv31l3d_a1b2c3d4e5f60718}`
- Submitting a decoy flag triggers intelligent detection in `flagController.js`:
  ```json
  {
    "correct": false,
    "hint": "That's a decoy flag! Blind grepping won't work — follow the challenge instructions to find the genuine key."
  }
  ```

### 2.3 Environment Variable Purging (`env -u BK_FLAG`)
Early container prototypes leaked flags via environment variables (`echo $BK_FLAG` or `/proc/1/environ`). All BreachKeep challenge entrypoint scripts execute:
```bash
exec setpriv --reuid student --regid student --init-groups env -u BK_FLAG ttyd ...
```
This guarantees that neither the student's interactive shell nor any unprivileged child processes can inspect the flag through the environment.

### 2.4 Root-Held Answer Guards (`bkguard` & `bkverify`)
For task-oriented challenges (where the student must perform an analysis or fix a script rather than discover a static file), the flag is stored in `/opt/bk/flag` (mode `0600`, owned by `root:root`).
- **`bkguard.sh`**: Runs in the background as root. Watches `/home/student/.bk_answer`. Validates that the submitted answer file is a legitimate, regular file owned by the `student` user (blocking symlink attacks against `/opt/bk/expected`). On a correct match, it emits the flag to `/home/student/.bk_result`.
- **`bkverify.sh`**: Runs `/opt/bk/verify.sh` as root against the student's submission or system state. If the verification script exits with status 0, the real flag is released.

---

## 3. Dungeon Master Catalog

| Dungeon ID | Title | Challenges | Focus Area | Detailed Specification Document |
| :--- | :--- | :--- | :--- | :--- |
| **`terminal-1`** | **First Steps** | 10 Rooms | Linux navigation, filters, pipelines, archives, logs | [terminal-1.md](file:///c:/Users/KIIT/cyber-classes/BreachKeep/docs/challenges/terminal-1.md) |
| **`terminal-2`** | **Keys to the Keep** | 10 Rooms | POSIX permissions, groups, environment, cron, SUID, sudo | [terminal-2.md](file:///c:/Users/KIIT/cyber-classes/BreachKeep/docs/challenges/terminal-2.md) |
| **`network`** | **Signals** | 10 Rooms | Port enumeration, nmap, banner grabbing, PCAP, DNS, HTTP, pivoting | [network.md](file:///c:/Users/KIIT/cyber-classes/BreachKeep/docs/challenges/network.md) |
| **`web`** | **The Trading Post** | 10 Rooms | OWASP Top 10: Recon, DevTools, cookie tampering, IDOR, SQLi, XSS | [web.md](file:///c:/Users/KIIT/cyber-classes/BreachKeep/docs/challenges/web.md) |
| **`secure-coding`**| **The Forge** | 8 Rooms | Blue Team code remediation: prepared queries, output encoding, auth | [secure-coding.md](file:///c:/Users/KIIT/cyber-classes/BreachKeep/docs/challenges/secure-coding.md) |
| **`capstone`** | **The Gauntlet** | 1 Master Box | Full-scope CTF: Recon -> Credential Leak -> SSH Foothold -> GTFOBins Root | [capstone.md](file:///c:/Users/KIIT/cyber-classes/BreachKeep/docs/challenges/capstone.md) |

---

## 4. Challenge Room Slugs Reference

| Room ID | Slug Prefix | Intended Target Concept |
| :--- | :--- | :--- |
| `terminal-1-first-steps` | `cd_ls_c4t_b4s1cs` | Tree traversal without find |
| `terminal-1-reading` | `sp3c1f1c_l1n3_r34d3r` | Direct line jumping (`sed -n`) |
| `terminal-1-hidden` | `d0t_f1l3s_unv31l3d` | Dotfile discovery (`ls -a`) |
| `terminal-1-finding` | `f1nd_10k_d4t_sp3c14l1st` | Multi-parameter `find` stacking |
| `terminal-1-grep` | `g0ld3n_t1ck3t_c4s3_1gn0r3d` | Case-insensitive recursive grep |
| `terminal-1-pipes` | `p1p3_fr3qu3ncy_pr0` | Log frequency analysis pipeline |
| `terminal-1-archives` | `p33l_th3_c0mpr3ss10n` | Header-based archive unpeeling |
| `terminal-1-strings` | `str1ngs_b1n4ry_extr4ct` | Binary printable character carving |
| `terminal-1-log-detective`| `34rl13st_4tt4ck3r_l0g` | Cross-format timestamp correlation |
| `terminal-1-needle` | `m3t4d4t4_4ud1t_n33dl3` | File identification by owner/mtime/perms |
| `terminal-2-perms` | `p3rm1ss10n_m4st3r` | Principle of least privilege `chmod` |
| `terminal-2-groups` | `gr0up_m3mb3rsh1p` | Secondary group authorization |
| `terminal-2-env` | `3nv_v4r_s3cr3ts` | Configuration secret discovery |
| `terminal-2-scripts` | `sh3ll_scr1pt_4ud1t` | Parameterized bash automation |
| `terminal-2-escalation`| `sud0_pr1v_3sc` | Overbroad sudoers rule exploitation |
| `terminal-2-cron-watch` | `cr0n_j0b_t4mp3r` | Privilege escalation via writable cron task |
| `terminal-2-path-order` | `p4th_h1j4ck_pr0` | PATH precedence security boundary |
| `terminal-2-suid-audit` | `su1d_b1n4ry_hunt` | Anomalous SUID binary identification |
| `terminal-2-misconfig-chain`| `m1sc0nf1g_ch41n_r00t` | Chaining locked runner + writable plugin dir |
| `terminal-2-audit-report` | `sys_4ud1t_cl34r` | Blue-team filesystem vulnerability hardening |
| `network-ports` | `p0rt_sc4nn3r_n00b` | Socket enumeration & raw interaction |
| `network-scan` | `nm4p_sw33p_m4st3r` | Multi-host subnet scanning (`nmap -sT`) |
| `network-banner` | `b4nn3r_gr4bb1ng` | Service fingerprinting via banner grabbing |
| `network-capture` | `p4ck3t_sn1ff3r` | Cleartext HTTP credential extraction (`tshark`) |
| `network-dns` | `dns_z0n3_tr4nsf3r` | DNS TXT record enumeration |
| `network-http` | `h34d3rs_4nd_m3th0ds` | Custom HTTP header manipulation |
| `network-protocol-id` | `pr0t0c0l_4n4lys1s` | Protocol triage & plaintext detection |
| `network-firewall` | `f1r3w4ll_byp4ss_r0cks` | iptables ingress filter policy auditing |
| `network-pcap-forensics`| `w1r3sh4rk_pcap_d1gg3r` | Stream reassembly & Base64 carving |
| `network-pivot` | `subn3t_p1v0t_4ch13v3d` | Multi-hop internal network pivoting |
| `web-recon` | `d1r_bust3r_3num` | Web reconnaissance via `robots.txt` |
| `web-devtools` | `c0ns0l3_h4ck3r` | Response header investigation |
| `web-cookie-trust` | `c00k13_m0d1f13r` | Client-side cookie role tampering |
| `web-client-trust` | `cl13nt_s1d3_byp4ss` | Business logic bypass via parameter tampering |
| `web-idor` | `1d0r_p4r4m_t4mp3r` | Insecure direct object reference exploitation |
| `web-sqli` | `un10n_s3l3ct_byp4ss` | SQL injection login bypass (`' OR '1'='1`) |
| `web-reflected-xss` | `xss_scr1pt_4l3rt` | Reflected cross-site scripting payload |
| `web-headers` | `c0rs_h34d3r_sp00f` | Header-based access control forging |
| `web-stored-xss` | `p3rs1st3nt_p4yl04d` | Persistent stored XSS injection |
| `web-chain` | `full_ch41n_3xpl01t` | Multi-vulnerability exploit chaining |
| `secure-sqli` | `pr3p4r3d_st4t3m3nts_w1n` | Prepared statements implementation |
| `secure-xss` | `s4n1t1z3_y0ur_1nputs` | Context-aware HTML entity encoding |
| `secure-idor` | `s3ss10n_b4s3d_4uth` | Per-object session ownership verification |
| `secure-client` | `s3rv3r_v4l1d4t10n_ru13s` | Server-side numerical input validation |
| `secure-headers` | `csp_str1ct_h34d3rs` | Defensive HTTP security headers |
| `secure-rate-limit` | `t0k3n_buck3t_l1m1t` | Brute-force rate limiting (HTTP 429) |
| `secure-hide-secret` | `k33p_3nv_s3cr3t` | Credential decoupling & environment isolation |
| `secure-full-review` | `c0d3_4ud1t_ch4mp10n` | Full-stack application hardening review |
| `capstone-gauntlet` | `capstone_gauntlet` | Multi-stage penetration test to root |
