// Network "Signals" dungeon — ports, services, protocols, and traffic. Each
// room boots its own target services inside the student's container, so every
// scan/sniff/query hits something real. Same shape as the terminal dungeons.

export const DUNGEON_ID = 'network'
export const DUNGEON_TITLE = 'Signals'
export const DUNGEON_BLURB =
  'Ports, services, protocols, and the traffic between them — how to see a network and pull secrets off the wire.'

export const TIERS = {
  mandatory: { label: 'Mandatory', note: 'Clear all of these to unlock the medium rooms.' },
  medium: { label: 'Medium', note: 'Unlocks after every mandatory room is cleared.' },
  hard: { label: 'Hard', note: 'Unlocks after 2 of the 3 medium rooms are cleared.' },
}

export const ROOMS = [
  {
    id: 'network-ports',
    tier: 'mandatory',
    num: 'I',
    title: 'What’s Listening',
    concept: 'Enumerating listening TCP ports (ss, nmap) and talking to them (nc).',
    brief: 'Several services are listening on this host. One hands back the key; the rest are noise. Find them, then talk to each.',
    objective: 'Enumerate the open ports and connect to the one that returns the key.',
    hints: [
      'A service has to be listening on a port before anything can reach it. List what is listening.',
      'ss -ltn shows listening TCP sockets; nmap -sT 127.0.0.1 scans them. Note the ports.',
      'Connect to each with  nc 127.0.0.1 <port>  — one replies with BK{...}.',
    ],
    debrief: 'Enumerating listening ports is step one of touching any machine. ss/nmap to find them, nc to speak to them — the whole dungeon builds on this.',
  },
  {
    id: 'network-scan',
    tier: 'mandatory',
    num: 'II',
    title: 'Scan the Target',
    concept: 'Port-scanning a remote host and identifying its services with nmap.',
    brief: 'A target host sits on the lab network at 127.0.0.2. You don’t know its open ports — scan to find them, then find the service holding the key.',
    objective: 'Scan 127.0.0.2, find its open ports, and read the key from the vault service.',
    hints: [
      'You are scanning another host now, not localhost. Point nmap at 127.0.0.2.',
      'Services can live on high ports; scan a wide range: nmap -sT -p 1-10000 127.0.0.2',
      'Connect to each open port with nc; the vault prefixes its reply with "keep-vault:".',
    ],
    debrief: 'A port scan is how you map an unknown host before touching it. -sT (TCP connect) needs no privileges and is the reliable default.',
  },
  {
    id: 'network-banner',
    tier: 'mandatory',
    num: 'III',
    title: 'Grab the Banner',
    concept: 'Banner grabbing: reading the software + version a service announces.',
    brief: 'Many services announce their software and exact version the moment you connect. That version is the start of every vulnerability lookup.',
    objective: 'Connect to the service, read its version from the banner, and submit it: check <version>',
    hints: [
      'The README names the port. Just connecting is often enough to make a service introduce itself.',
      'nc 127.0.0.1 <port>  prints the banner, e.g.  220 KeepFTP 3.7.2 ready',
      'Submit only the version number (like 3.7.2):  check 3.7.2',
    ],
    debrief: 'Version banners are gold to both attackers and defenders — they turn "some FTP server" into "exactly this build, with these known CVEs".',
  },
  {
    id: 'network-capture',
    tier: 'mandatory',
    num: 'IV',
    title: 'Clear-Text on the Wire',
    concept: 'Reading a packet capture to recover a plaintext credential (tshark).',
    brief: 'A user logged in over plain HTTP, so their password crossed the network in the clear. It was captured. Read it back.',
    objective: 'Open capture.pcap, follow the login request, and read the password (the key).',
    hints: [
      'A .pcap is recorded traffic. tshark reads it: tshark -r capture.pcap  (and -Y http for just HTTP).',
      'Find the POST login, then read that conversation in plain text by following its TCP stream.',
      'tshark -q -r capture.pcap -z follow,tcp,ascii,1  — the password in the body is BK{...}.',
    ],
    debrief: 'This is why plaintext protocols are fatal: anyone who can capture the traffic reads the password. tshark + follow-stream is the everyday tool for it.',
  },
  {
    id: 'network-dns',
    tier: 'mandatory',
    num: 'V',
    title: 'Ask the Right Record',
    concept: 'DNS record types and querying them with dig (TXT in particular).',
    brief: 'DNS carries more than addresses. Someone published the key in a TXT record on the local DNS server.',
    objective: 'Query the DNS server for the right record and read the key.',
    hints: [
      'dig queries DNS. A records are addresses; TXT records carry arbitrary text.',
      'Point dig at the local server: dig @127.0.0.1 keep.info TXT +short  (it hints the real name).',
      'dig @127.0.0.1 flag.keep TXT +short  — the TXT value is BK{...}.',
    ],
    debrief: 'TXT records quietly hold verification tokens, SPF data, and — too often — things that should never be public. Knowing record types is core recon.',
  },
  {
    id: 'network-http',
    tier: 'medium',
    num: 'VI',
    title: 'HTTP by Hand',
    concept: 'Crafting HTTP requests and headers directly (curl / raw nc).',
    brief: 'A web service guards its /vault endpoint behind a specific request header. A browser won’t send it — but you can.',
    objective: 'Send the request header the vault requires and read the key it returns.',
    hints: [
      'Explore first: curl -i http://127.0.0.1/  and  curl -i http://127.0.0.1/vault — read what it tells you.',
      'The vault wants a header. Add one with curl -H "Name: value".',
      'curl -s -H "X-Keep-Access: open" http://127.0.0.1/vault  — returns BK{...}.',
    ],
    debrief: 'HTTP is just text you can type yourself. Being able to set arbitrary methods and headers by hand is the basis of all web testing.',
  },
  {
    id: 'network-protocol-id',
    tier: 'medium',
    num: 'VII',
    title: 'Name the Protocol',
    concept: 'Recognising protocols in a mixed capture and which leak credentials.',
    brief: 'A capture mixes several protocols. Exactly one of them sent a login password in the clear. Which protocol was it?',
    objective: 'Identify the protocol that carried the cleartext password and submit it: check <protocol>',
    hints: [
      'tshark labels each packet with its protocol. Skim the overview: tshark -r traffic.pcap',
      'Web browsing and mail envelopes are there too, but only one protocol sent USER/PASS in the clear.',
      'Filter by a protocol to confirm (e.g. tshark -r traffic.pcap -Y ftp), then: check <name lowercase>',
    ],
    debrief: 'Telling protocols apart by their ports and dissected fields is how you triage a capture fast — and spot the legacy cleartext ones that shouldn’t be in use.',
  },
  {
    id: 'network-firewall',
    tier: 'medium',
    num: 'VIII',
    title: 'Read the Firewall',
    concept: 'Interpreting an iptables ruleset to find what is actually allowed.',
    brief: 'A saved iptables ruleset drops everything inbound except what a rule explicitly allows. Find the one service port open to the world.',
    objective: 'Read /etc/keep/rules.v4 and submit the single allowed inbound TCP port: check <port>',
    hints: [
      'The INPUT policy is DROP, so only an explicit ACCEPT lets traffic in. Read the file top to bottom.',
      'Ignore the loopback and "established/related" ACCEPTs — those aren’t a service port.',
      'Find the  -A INPUT -p tcp --dport <N> -j ACCEPT  line and submit N:  check <N>',
    ],
    debrief: 'Reading firewall rules tells you your real attack surface (and, as a defender, whether the box exposes only what you intended).',
  },
  {
    id: 'network-pcap-forensics',
    tier: 'hard',
    num: 'IX',
    title: 'Recover the File',
    concept: 'Reassembling a transferred file from a capture and decoding it.',
    brief: 'A file was downloaded in this capture, but its contents were base64-encoded on the wire — so searching for BK{ finds nothing. Recover and decode it.',
    objective: 'Follow the stream, carve out the base64 the server sent, and decode it to the key.',
    hints: [
      'Searching for the flag directly fails because the payload is encoded. First recover the transferred text.',
      'tshark -q -r transfer.pcap -z follow,tcp,ascii,0  shows the stream — note the long base64 line.',
      'echo \'<that base64 line>\' | base64 -d  — the decoded text holds BK{...}.',
    ],
    debrief: 'Real forensic recovery is exactly this: reassemble what crossed the wire, recognise the encoding, and decode it back to the original artifact.',
  },
  {
    id: 'network-pivot',
    tier: 'hard',
    num: 'X',
    title: 'Pivot the Network',
    concept: 'Chaining host-to-host: each host reveals how to reach the next.',
    brief: 'You have a foothold on one host; the key lives on another you can’t see yet. Each host tells you how to reach the next — follow the trail.',
    objective: 'Start at 127.0.0.2:5000, follow each hop (passing along what it gives you), and read the key on the final host.',
    hints: [
      'Begin at the known host: nc 127.0.0.2 5000 — it names the next host, a port, and a passphrase.',
      'Connect to that next host and SEND it the passphrase: printf \'<pass>\\n\' | nc 127.0.0.3 <port>',
      'That host reveals the FINAL host and port — connect there (nc) for BK{...}. Keep notes of each hop.',
    ],
    debrief: 'Pivoting — using one compromised host to reach the next — is how real intrusions move through a network. Mapping the path is the whole skill.',
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]))
