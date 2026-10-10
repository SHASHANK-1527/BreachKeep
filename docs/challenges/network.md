# Dungeon 3: Network — "Signals" Challenge Documentation

The **Signals** dungeon immerses students in network security fundamentals: TCP socket discovery, port scanning, service banner identification, packet capture inspection (`tshark`), DNS zone reconnaissance, manual HTTP protocol crafting, cleartext protocol analysis, firewall policy auditing, and multi-hop network pivoting.

All containers in this dungeon start with `NET_CAPS = ['CHOWN', 'DAC_OVERRIDE', 'FOWNER', 'SETUID', 'SETGID', 'SETPCAP', 'NET_BIND_SERVICE']` allowing them to bind privileged ports (such as DNS :53 and HTTP :80) while running on the isolated `bk_labs` network.

---

## 1. Challenge: `network-ports` (What’s Listening)

- **Tier**: Mandatory (Room I)
- **Flag Format**: `BK{p0rt_sc4nn3r_n00b_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-ports`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-ports), [`labs/network/ports.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/ports.sh), [`labs/network/netlib.py`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/netlib.py)

### 1.1 Environment Construction & Challenge Creation
- **Service Construction**: Uses [`netlib.py`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/netlib.py) to bind 4 background TCP servers on localhost (`127.0.0.1`):
  1. Port `FLAGPORT` ($4000 \le P \le 7999$): Replies with the student's authentic flag `$FLAG`.
  2. Port `D1` ($2000 \le P \le 2999$): Decoy replying with `keep-metrics: ok\n`.
  3. Port `D2` ($3000 \le P \le 3999$): Decoy replying with `keep-health: alive\n`.
  4. Port `D3` ($8000 \le P \le 8999$): Decoy replying with `nothing to see here\n`.

### 1.2 Skills & Concepts Tested
- Local listening socket enumeration using `ss`, `netstat`, or `lsof`.
- Interacting with raw TCP sockets using `nc` (netcat).
- Distinguishing operational services from sensitive endpoints.

### 1.3 Flag Location & Mechanics
- **Location**: Network socket stream served on `127.0.0.1:<FLAGPORT>`.

### 1.4 Intended Path of Solving
1. Enumerate listening TCP sockets on the local interface:
   ```bash
   ss -tulpn
   # OR
   ss -ltn
   ```
   *(Identifies listening ports, e.g., 2451, 3120, 5678, 8290)*
2. Connect to each listening port using `nc`:
   ```bash
   nc 127.0.0.1 2451
   nc 127.0.0.1 3120
   nc 127.0.0.1 5678
   ```
3. When connected to port 5678, the socket prints:
   `BK{p0rt_sc4nn3r_n00b_...}`
4. Copy and submit the flag.

---

## 2. Challenge: `network-scan` (Scan the Target)

- **Tier**: Mandatory (Room II)
- **Flag Format**: `BK{nm4p_sw33p_m4st3r_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-scan`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-scan), [`labs/network/scan.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/scan.sh)

### 2.1 Environment Construction & Challenge Creation
- **Target Topology**: Target host runs at `target.keep` (`127.0.0.2`).
- **Target Services**:
  - Vault Port (`KEEP`, between 6000 and 8999): Responds with `keep-vault: BK{...}\n`.
  - Noise Ports: Port A (echo-service), Port B (time-service), Port C (quote-service).
- Because services reside on high non-standard ports up to 9000, default port scans (which only scan top 1000 ports) miss the vault.

### 2.2 Skills & Concepts Tested
- Port scanning with `nmap`.
- Specifying custom port ranges with `-p`.
- Using unprivileged TCP connect scans (`nmap -sT`).

### 2.3 Flag Location & Mechanics
- **Location**: Listening on `target.keep:<KEEP>` (`127.0.0.2:<KEEP>`).

### 2.4 Intended Path of Solving
1. Scan the remote target across the extended port range:
   ```bash
   nmap -sT -p 1-10000 127.0.0.2
   # OR
   nmap -sT -p 1-10000 target.keep
   ```
   *(Reveals open ports, e.g., 1420, 2850, 4710, 7842)*
2. Connect to the open ports with `nc` to identify the services:
   ```bash
   nc 127.0.0.2 7842
   # OR
   nc target.keep 7842
   ```
   *(Returns: `keep-vault: BK{nm4p_sw33p_m4st3r_...}`)*
3. Copy and submit the flag.

---

## 3. Challenge: `network-banner` (Grab the Banner)

- **Tier**: Mandatory (Room III)
- **Flag Format**: `BK{b4nn3r_gr4bb1ng_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-banner`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-banner), [`labs/network/banner.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/banner.sh)

### 3.1 Environment Construction & Challenge Creation
- **Banner Daemon**: Binds a mock FTP server on port `PORT` ($5000 \le P \le 7999$) that immediately sends an RFC-style greeting upon connection (`read_first=False`):
  `220 KeepFTP <VER> ready\r\n`
  Where `VER` is a randomized version string (e.g., `4.7.12`).
- **Validation**: Student must extract the isolated version string and run `check <version>`.

### 3.2 Skills & Concepts Tested
- Service banner grabbing.
- Identifying software names and version identifiers.
- Vulnerability research prerequisites (mapping software versions to known CVEs).

### 3.3 Flag Location & Mechanics
- **Location**: Root-held at `/opt/bk/flag`.
- **Expected String**: Stored in `/opt/bk/expected`.

### 3.4 Intended Path of Solving
1. Read the designated port from `README.txt` (or scan for it):
   ```bash
   cat README.txt
   ```
   *(Example: "A service is listening on 127.0.0.1 port 6214.")*
2. Connect to the port using `nc`:
   ```bash
   nc 127.0.0.1 6214
   ```
   *(Server emits: `220 KeepFTP 4.7.12 ready`)*
3. Extract the version number (`4.7.12`) and verify with `check`:
   ```bash
   check 4.7.12
   ```
4. `bkguard` releases the flag.

---

## 4. Challenge: `network-capture` (Clear-Text on the Wire)

- **Tier**: Mandatory (Room IV)
- **Flag Format**: `BK{p4ck3t_sn1ff3r_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-capture`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-capture), [`labs/network/capture.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/capture.sh), [`labs/network/mkpcap.py`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/mkpcap.py)

### 4.1 Environment Construction & Challenge Creation
- **Binary PCAP Synthesis**: [`mkpcap.py`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/mkpcap.py) compiles `/home/student/capture.pcap` with binary headers (`0xa1b2c3d4`, magic microseconds).
- **Traffic Profile**: Records an HTTP session between client `10.0.0.50` and server `10.0.0.9`. It contains a stylesheet GET, an HTTP POST to `/login` containing form-encoded credentials, and a subsequent GET request:
  ```http
  POST /login HTTP/1.1
  Host: shop.keep
  Content-Type: application/x-www-form-urlencoded

  username=quartermaster&password=BK{p4ck3t_sn1ff3r_<hmac>}
  ```

### 4.2 Skills & Concepts Tested
- Packet capture analysis via CLI using `tshark`.
- Protocol display filters (`-Y http` or `-Y http.request.method=="POST"`).
- Reassembling TCP streams with `follow,tcp,ascii`.

### 4.3 Flag Location & Mechanics
- **Path**: Inside the POST payload in `/home/student/capture.pcap`.

### 4.4 Intended Path of Solving
1. Skim the packet capture with `tshark`:
   ```bash
   tshark -r capture.pcap
   ```
2. Filter for HTTP POST requests:
   ```bash
   tshark -r capture.pcap -Y 'http.request.method == "POST"' -T fields -e text
   # OR follow the TCP stream:
   tshark -q -r capture.pcap -z follow,tcp,ascii,1
   ```
3. Locate the plaintext body:
   `username=quartermaster&password=BK{p4ck3t_sn1ff3r_...}`
4. Copy the flag parameter and submit.

---

## 5. Challenge: `network-dns` (Ask the Right Record)

- **Tier**: Mandatory (Room V)
- **Flag Format**: `BK{dns_z0n3_tr4nsf3r_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-dns`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-dns), [`labs/network/dns.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/dns.sh)

### 5.1 Environment Construction & Challenge Creation
- **DNS Server**: Runs `dnsmasq` bound to `127.0.0.1:53` with zone configuration:
  ```conf
  txt-record=flag.keep,<FLAG>
  txt-record=keep.info,the key is a TXT record named flag.keep
  address=/gateway.keep/127.0.0.1
  address=/vault.keep/127.0.0.2
  ```

### 5.2 Skills & Concepts Tested
- Querying DNS servers using `dig` or `nslookup`.
- Understanding DNS record types: `A` (host addresses) vs. `TXT` (text/verification metadata).
- Directing queries to specific nameservers (`dig @127.0.0.1`).

### 5.3 Flag Location & Mechanics
- **Record**: TXT record for `flag.keep`.

### 5.4 Intended Path of Solving
1. Query the local nameserver for the informational domain hinted in the brief:
   ```bash
   dig @127.0.0.1 keep.info TXT +short
   ```
   *(Returns: `"the key is a TXT record named flag.keep"`)*
2. Query the revealed record:
   ```bash
   dig @127.0.0.1 flag.keep TXT +short
   ```
   *(Returns: `"BK{dns_z0n3_tr4nsf3r_...}"`)*
3. Remove surrounding quotes and submit the flag.

---

## 6. Challenge: `network-http` (HTTP by Hand)

- **Tier**: Medium (Room VI)
- **Flag Format**: `BK{h34d3rs_4nd_m3th0ds_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-http`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-http), [`labs/network/http.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/http.sh)

### 6.1 Environment Construction & Challenge Creation
- **HTTP Server**: Custom Python HTTP server running on `127.0.0.1:80`.
- **Access Control Logic**:
  - Request to `/`: Returns instructions hinting at `/vault`.
  - Request to `/vault` without header: Returns `403 Forbidden` with body:
    `forbidden: this endpoint needs the header  X-Keep-Access: open\n`
  - Request to `/vault` with `X-Keep-Access: open`: Returns `200 OK` with the flag.

### 6.2 Skills & Concepts Tested
- Crafting custom HTTP requests via CLI using `curl`.
- Adding request headers with `curl -H`.
- Analyzing HTTP status codes (`403` vs `200`) and response headers (`curl -i`).

### 6.3 Flag Location & Mechanics
- **Endpoint**: `http://127.0.0.1/vault` when requested with `X-Keep-Access: open`.

### 6.4 Intended Path of Solving
1. Query the web root:
   ```bash
   curl -i http://127.0.0.1/
   ```
   *(Response mentions `/vault`)*
2. Query `/vault`:
   ```bash
   curl -i http://127.0.0.1/vault
   ```
   *(Response status 403: `needs the header X-Keep-Access: open`)*
3. Supply the requested header:
   ```bash
   curl -s -H "X-Keep-Access: open" http://127.0.0.1/vault
   ```
   *(Returns: `vault open. key: BK{h34d3rs_4nd_m3th0ds_...}`)*
4. Copy and submit the flag.

---

## 7. Challenge: `network-protocol-id` (Name the Protocol)

- **Tier**: Medium (Room VII)
- **Flag Format**: `BK{pr0t0c0l_4n4lys1s_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-protocol-id`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-protocol-id), [`labs/network/protocol-id.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/protocol-id.sh)

### 7.1 Environment Construction & Challenge Creation
- **Multi-Protocol PCAP Generation**: Generates `/home/student/traffic.pcap` mixing three standard application protocols:
  1. HTTP on port 80: Static unauthenticated GET request.
  2. SMTP on port 25: Unauthenticated envelope negotiation (`MAIL FROM`, `RCPT TO`).
  3. FTP on port 21: Authentication exchange transmitting `USER quartermaster` and `PASS s3cr3t-stores` in cleartext.
- **Answer Guard**: Student must submit the lowercase protocol name `ftp` via `check ftp`.

### 7.2 Skills & Concepts Tested
- Triaging multi-protocol packet captures.
- Identifying cleartext authentication vulnerabilities in legacy protocols (FTP vs HTTP vs SMTP).
- Using protocol analysis tools.

### 7.3 Flag Location & Mechanics
- **Location**: Root-held at `/opt/bk/flag`.
- **Validation**: Expected submission is `ftp`.

### 7.4 Intended Path of Solving
1. Inspect protocol summaries in the capture:
   ```bash
   tshark -r traffic.pcap
   ```
2. Search for password credentials across all streams:
   ```bash
   tshark -r traffic.pcap -Y 'ftp.request.command == "PASS" || http.request.method == "POST" || smtp'
   ```
3. Notice that FTP on port 21 is transmitting `PASS s3cr3t-stores`.
4. Submit the lowercase protocol name to `check`:
   ```bash
   check ftp
   ```
5. Receive the flag.

---

## 8. Challenge: `network-firewall` (Read the Firewall)

- **Tier**: Medium (Room VIII)
- **Flag Format**: `BK{f1r3w4ll_byp4ss_r0cks_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-firewall`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-firewall), [`labs/network/firewall.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/firewall.sh)

### 8.1 Environment Construction & Challenge Creation
- **Firewall Policy**: Generates `/etc/keep/rules.v4` formatted for `iptables-restore`:
  - Default policies: `INPUT DROP`, `FORWARD DROP`, `OUTPUT ACCEPT`.
  - Loopback (`-i lo`) and stateful (`RELATED,ESTABLISHED`) rules accept traffic.
  - Decoy probe rules log and DROP or REJECT ports `NOISE1` and `NOISE2`.
  - Exactly one inbound rule accepts external TCP traffic:
    `-A INPUT -p tcp --dport <ALLOW> -j ACCEPT`
    Where `ALLOW` is a randomized port between 2000 and 52000.
- **Validation**: Student submits `check <ALLOW>`.

### 8.2 Skills & Concepts Tested
- Reading and auditing Linux `iptables` packet filtering rulesets.
- Differentiating default policies, stateful inspection rules, and service exposure rules.
- Determining net attack surfaces from configuration files.

### 8.3 Flag Location & Mechanics
- **Location**: Guarded in `/opt/bk/flag`.
- **Validation**: Expected answer is `$ALLOW`.

### 8.4 Intended Path of Solving
1. Inspect the firewall ruleset:
   ```bash
   cat /etc/keep/rules.v4
   ```
2. Identify the default policy: `:INPUT DROP [0:0]` (all inbound dropped unless explicitly permitted).
3. Search for inbound ACCEPT rules on external interfaces:
   ```bash
   grep "INPUT.*ACCEPT" /etc/keep/rules.v4
   ```
   *(Locates: `-A INPUT -p tcp --dport 38421 -j ACCEPT`)*
4. Submit the port to `check`:
   ```bash
   check 38421
   ```
5. Receive the flag.

---

## 9. Challenge: `network-pcap-forensics` (Recover the File)

- **Tier**: Hard (Room IX)
- **Flag Format**: `BK{w1r3sh4rk_pcap_d1gg3r_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-pcap-forensics`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-pcap-forensics), [`labs/network/pcap-forensics.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/pcap-forensics.sh)

### 9.1 Environment Construction & Challenge Creation
- **PCAP Obfuscation**: Generates `/home/student/transfer.pcap`. The capture records an HTTP request for `/backup`. The HTTP response payload contains a base64-encoded string:
  ```http
  HTTP/1.1 200 OK
  Content-Type: text/plain

  file: backup.b64
  cmVjb3ZlcmVkLWZpbGUKa2V5OiBCS3t3MXIzc2g0cmtfcGNhcF9kMWdnM3JfNDFhMmI0YzZkOGUwZjEyM30K
  ```
- Because the payload is base64-encoded, running `strings transfer.pcap | grep "BK{"` yields zero results.

### 9.2 Skills & Concepts Tested
- Network forensic carving.
- Reconstructing TCP data streams.
- Recognizing Base64 encoded blobs and decoding via CLI.

### 9.3 Flag Location & Mechanics
- **Path**: Encoded inside the HTTP response in `/home/student/transfer.pcap`.

### 9.4 Intended Path of Solving
1. Extract the TCP conversation stream using `tshark`:
   ```bash
   tshark -q -r transfer.pcap -z follow,tcp,ascii,0
   ```
2. Inspect the HTTP payload and copy the long Base64 string.
3. Decode the string using `base64 -d`:
   ```bash
   echo "cmVjb3ZlcmVkLWZpbGUKa2V5OiBCS3t3MXIzc2g0cmtfcGNhcF9kMWdnM3Jf...==" | base64 -d
   ```
   *(Decodes to:*
   ```text
   recovered-file
   key: BK{w1r3sh4rk_pcap_d1gg3r_...}
   ```
4. Copy and submit the flag.

---

## 10. Challenge: `network-pivot` (Pivot the Network)

- **Tier**: Hard (Room X)
- **Flag Format**: `BK{subn3t_p1v0t_4ch13v3d_<16_hex_hmac>}`
- **Source Files**: [`labs/network/Dockerfile.network-pivot`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/Dockerfile.network-pivot), [`labs/network/pivot.sh`](file:///c:/Users/KIIT/cyber-classes/BreachKeep/labs/network/pivot.sh)

### 10.1 Environment Construction & Challenge Creation
- **Multi-Hop Topology**: Simulates three internal network hops running on loopback aliases:
  1. Hop 1 (`127.0.0.2:5000`): Entrypoint. Connecting reveals:
     `recon host.\nnext hop: 127.0.0.3 port <PORTB>\npassphrase: <PASS>\n`
  2. Hop 2 (`127.0.0.3:<PORTB>`): Intermediary gateway. Connecting without credentials returns `denied`. Sending the passphrase string `<PASS>` reveals:
     `accepted. final host: 127.0.0.4 port <PORTC>\n`
  3. Hop 3 (`127.0.0.4:<PORTC>`): The internal vault. Connecting returns the authentic flag:
     `vault. key: BK{subn3t_p1v0t_4ch13v3d_<hmac>}\n`
- All ports (`PORTB`, `PORTC`) and the 6-character passphrase (`PASS`) are randomized on startup.

### 10.2 Skills & Concepts Tested
- Multi-host internal network pivoting concepts.
- Piping authentication credentials across network sockets.
- Lateral movement recon and note-taking.

### 10.3 Flag Location & Mechanics
- **Location**: Socket response served on `127.0.0.4:<PORTC>`.

### 10.4 Intended Path of Solving
1. Connect to the initial foothold host:
   ```bash
   nc 127.0.0.2 5000
   ```
   *(Returns: `recon host. next hop: 127.0.0.3 port 6841 passphrase: kx9qfa`)*
2. Connect to the second hop and transmit the required passphrase:
   ```bash
   printf "kx9qfa\n" | nc 127.0.0.3 6841
   ```
   *(Returns: `accepted. final host: 127.0.0.4 port 9245`)*
3. Connect to the final vault destination:
   ```bash
   nc 127.0.0.4 9245
   ```
   *(Returns: `vault. key: BK{subn3t_p1v0t_4ch13v3d_...}`)*
4. Copy and submit the flag.
