import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outDir = path.join(rootDir, 'docs', 'handbooks')
fs.mkdirSync(outDir, { recursive: true })

const htmlPath = path.join(outDir, 'BreachKeep_Student_Handbook.html')
const pdfPath = path.join(outDir, 'BreachKeep_Student_Handbook.pdf')

console.log('Generating BreachKeep Student Teaching Handbook HTML...')

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>The Defender's Compass: A Teacher's Guide to Cybersecurity Foundations</title>
<style>
  @page {
    size: letter;
    margin: 1in;
    @bottom-right {
      content: counter(page);
    }
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a202c;
    line-height: 1.6;
    font-size: 11pt;
    margin: 0;
    padding: 0;
  }

  /* Cover Page */
  .cover {
    page-break-after: always;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%);
    color: white;
    padding: 2rem;
    box-sizing: border-box;
  }
  .cover h1 {
    font-size: 32pt;
    font-weight: 800;
    margin: 0 0 1rem 0;
    letter-spacing: -0.025em;
    color: #f8fafc;
  }
  .cover .subtitle {
    font-size: 16pt;
    font-weight: 300;
    color: #94a3b8;
    max-width: 600px;
    margin-bottom: 3rem;
  }
  .cover .badge {
    background: rgba(20, 184, 166, 0.2);
    border: 1px solid #14b8a6;
    color: #5eead4;
    padding: 6px 16px;
    border-radius: 9999px;
    font-size: 11pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2rem;
  }
  .cover .meta {
    margin-top: auto;
    font-size: 11pt;
    color: #cbd5e1;
  }

  /* Typography & Layout */
  h1, h2, h3, h4 {
    color: #0f172a;
    font-weight: 700;
    page-break-after: avoid;
  }
  h1 { font-size: 22pt; margin-top: 2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
  h2 { font-size: 16pt; margin-top: 1.8rem; color: #0d9488; }
  h3 { font-size: 13pt; margin-top: 1.2rem; }
  p { margin: 0.8rem 0; text-align: justify; }

  /* Page Break Helpers */
  .page-break { page-break-after: always; }
  .chapter-header {
    page-break-before: always;
    padding: 2.5rem 0 1.5rem 0;
    border-bottom: 3px solid #0f766e;
    margin-bottom: 2rem;
  }
  .chapter-header h1 {
    border: none;
    padding: 0;
    margin: 0;
    font-size: 26pt;
    color: #0f172a;
  }
  .chapter-header .chapter-tag {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #0d9488;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  /* Callout Boxes */
  .callout {
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin: 1.2rem 0;
    page-break-inside: avoid;
    font-size: 10.5pt;
  }
  .analogy {
    background: #f0fdfa;
    border-left: 4px solid #0d9488;
    color: #134e4a;
  }
  .analogy strong { color: #0f766e; }

  .teacher-tip {
    background: #f8fafc;
    border-left: 4px solid #3b82f6;
    color: #1e3a8a;
  }
  .teacher-tip strong { color: #1d4ed8; }

  .defense-rule {
    background: #fef2f2;
    border-left: 4px solid #ef4444;
    color: #7f1d1d;
  }
  .defense-rule strong { color: #b91c1c; }

  .why-it-happens {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    color: #78350f;
  }
  .why-it-happens strong { color: #b45309; }

  /* Code Formatting */
  pre, code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }
  code {
    background: #f1f5f9;
    color: #0f172a;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    font-size: 9.5pt;
  }
  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    font-size: 9pt;
    overflow-x: auto;
    page-break-inside: avoid;
    line-height: 1.45;
  }
  pre code {
    background: none;
    color: inherit;
    padding: 0;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2rem 0;
    page-break-inside: avoid;
    font-size: 10pt;
  }
  th, td {
    padding: 0.6rem 0.8rem;
    border: 1px solid #cbd5e1;
    text-align: left;
  }
  th {
    background: #f8fafc;
    color: #0f172a;
    font-weight: 700;
  }
  tr:nth-child(even) {
    background: #f8fafc;
  }

  /* Challenge Cards */
  .challenge-block {
    margin-top: 2rem;
    margin-bottom: 2rem;
    page-break-inside: avoid;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .challenge-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }
  .challenge-title h3 {
    margin: 0;
    font-size: 14pt;
    color: #0f172a;
  }
  .challenge-tag {
    background: #e0f2fe;
    color: #0369a1;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 9pt;
    font-weight: 600;
  }

  .toc {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 2rem 0;
  }
  .toc ul {
    list-style: none;
    padding-left: 0;
  }
  .toc li {
    margin-bottom: 0.5rem;
  }
  .toc a {
    color: #0f766e;
    text-decoration: none;
    font-weight: 600;
  }
</style>
</head>
<body>

<!-- Cover Page -->
<div class="cover">
  <div class="badge">BreachKeep Faculty Curriculum</div>
  <h1>The Defender's Compass</h1>
  <div class="subtitle">A Student Handbook to Cybersecurity Foundations: Exploring Networks, the Web, and Secure Engineering Through the BreachKeep Dungeons</div>
  <div class="meta">
    <p><strong>Course:</strong> Introduction to Applied Cybersecurity (eLabs)</p>
    <p><strong>Focus Dungeons:</strong> Signals (Network) &bull; Trading Post (Web) &bull; The Forge (Secure Coding)</p>
    <p><strong>Target Audience:</strong> Beginners &bull; Aspiring Ethical Hackers &bull; Software Craftsmen</p>
  </div>
</div>

<!-- Preface -->
<div class="page-break">
  <h1>A Note from Your Teacher: Welcome to the Keep!</h1>
  <p>Dear Cadet,</p>
  <p>Welcome to cybersecurity. When people first hear about hacking, their minds often leap to movie clichés: darkened rooms, neon green text cascading across black monitors, and furious typing that miraculously breaks into satellite systems in twelve seconds flat. The reality is both more grounded and far more exciting.</p>
  <p>Cybersecurity is not digital witchcraft. It is the art and science of understanding how systems communicate, discovering the hidden assumptions that developers and architects make, and observing what happens when those assumptions break down. Every vulnerability you will encounter in BreachKeep was not created by malice, but by a very human developer who was tired, rushed, or unaware of how their code would behave under unexpected pressure.</p>
  
  <div class="callout analogy">
    <strong>The Teacher's Mental Model:</strong>
    Think of a secure system like a masterfully constructed building. The network is the plumbing and electrical wiring—the conduits through which all energy and information flow. The web application is the public reception desk and front lobby—where the world comes to interact with the building's services. And secure coding is the architectural blueprint and structural engineering—the careful design that ensures a single unlocked window doesn't cause the entire building to collapse.
  </div>

  <p>In this handbook, we will walk through three core dungeons of BreachKeep together:</p>
  <ol>
    <li><strong>The Network Dungeon ("Signals"):</strong> Learning how machines whisper across physical and virtual wires, how ports act as apartment doors, and how packets can be intercepted, read, and shaped.</li>
    <li><strong>The Web Dungeon ("The Trading Post"):</strong> Exploring the modern browser and server relationship, understanding stateless HTTP, and breaking common misconceptions about client-side safety.</li>
    <li><strong>The Secure Coding Dungeon ("The Forge"):</strong> Transitioning from an attacker who breaks systems to a master craftsperson who builds resilient, unassailable software that protects users and data.</li>
  </ol>
  <p>Do not be afraid to make mistakes. A broken script, an error 500, or a denied connection is not a failure; it is data. It is the system telling you exactly how it thinks. Let's take our first steps together.</p>

  <div class="toc">
    <h3>Table of Contents</h3>
    <ul>
      <li><strong>Part I: The Network Dungeon &mdash; Signals</strong>
        <ul>
          <li>Chapter 1: The Anatomy of a Connection</li>
          <li>Challenges 1&ndash;10: Ports, Scans, Banners, Packets, DNS, HTTP, Protocol Analysis, Firewalls, Forensics, &amp; Pivoting</li>
        </ul>
      </li>
      <li><strong>Part II: The Web Dungeon &mdash; The Trading Post</strong>
        <ul>
          <li>Chapter 2: The Web Architecture &amp; The Illusion of Client Trust</li>
          <li>Challenges 1&ndash;10: Recon, DevTools, Cookies, Client Trust, IDOR, SQLi, Reflected XSS, Headers, Stored XSS, &amp; Exploit Chains</li>
        </ul>
      </li>
      <li><strong>Part III: The Secure Coding Dungeon &mdash; The Forge</strong>
        <ul>
          <li>Chapter 3: The Defensive Engineer's Mindset</li>
          <li>Challenges 1&ndash;8: Prepared Statements, Sanitization, Ownership Checks, Input Validation, CSP, Rate Limiting, Secret Management, &amp; Full Code Audits</li>
        </ul>
      </li>
    </ul>
  </div>
</div>

<!-- PART I: NETWORK DUNGEON -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-tag">Part I &bull; Dungeon 3</div>
    <h1>The Network Dungeon: Whispers on the Wire</h1>
  </div>

  <h2>Chapter 1: How Computers Talk Across the Void</h2>
  <p>Before we touch a terminal, let's understand what a network actually is. A network is simply a group of computers agreed upon a common set of rules (protocols) to exchange messages. If you send a physical letter to a friend, you write an address (street name and number), place a stamp on it, and hand it to the postal service. The postal service doesn't care what is written inside the letter; its only job is reading the envelope and delivering it to the right destination.</p>

  <div class="callout analogy">
    <strong>Real-World Analogy: IP Addresses &amp; Ports</strong><br>
    Imagine an IP address is the physical street address of a massive apartment complex (e.g., <code>10.200.1.5</code>). If you only provide the street address, the mail carrier can reach the building lobby, but they don't know who receives the letter.
    <br><br>
    <strong>Port numbers are the apartment numbers</strong> (e.g., Apartment 80, Apartment 22, Apartment 53). When a letter arrives at the building, the apartment number tells the system which specific tenant (service or daemon) the packet is addressed to.
  </div>

  <p>In Linux networking, services listen on specific ports. Standard port conventions include:</p>
  <ul>
    <li><strong>Port 22 (SSH):</strong> The secure shell for remote administration.</li>
    <li><strong>Port 53 (DNS):</strong> The domain name system phonebook.</li>
    <li><strong>Port 80 (HTTP):</strong> Plaintext web traffic.</li>
    <li><strong>Port 443 (HTTPS):</strong> Encrypted web traffic over TLS.</li>
  </ul>
  <p>Now, let's examine the 10 challenges in the Signals dungeon and discover how attackers and defenders navigate this landscape.</p>

  <!-- Challenge 1: network-ports -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 1: What's Listening Behind the Door? (network-ports)</h3>
      <span class="challenge-tag">Mandatory &bull; Socket Enumeration</span>
    </div>
    <p><strong>The Story &amp; Context:</strong> You log into a remote host. You are told that several services are bound and listening on the machine, but you don't know which port hosts the authentic keep service and which ones are merely decoys or telemetry probes.</p>
    
    <div class="callout teacher-tip">
      <strong>Teacher's Lesson &mdash; Socket Investigation:</strong><br>
      How do you ask a Linux kernel "What programs are currently waiting for incoming network connections?" We use socket statistics tools: <code>ss</code> or <code>netstat</code>.
      <br><br>
      The command <code>ss -tulpn</code> breaks down as:
      <ul>
        <li><code>-t</code>: Display <strong>TCP</strong> sockets.</li>
        <li><code>-u</code>: Display <strong>UDP</strong> sockets.</li>
        <li><code>-l</code>: Show only <strong>listening</strong> sockets (waiting for a connection).</li>
        <li><code>-p</code>: Show the <strong>process</strong> using the socket (requires root).</li>
        <li><code>-n</code>: Show <strong>numeric</strong> port numbers instead of attempting to resolve names.</li>
      </ul>
    </div>

    <p><strong>The Hands-on Path:</strong></p>
    <pre><code>student@signals:~$ ss -ltn
State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port
LISTEN  0       128         127.0.0.1:2451            0.0.0.0:*
LISTEN  0       128         127.0.0.1:3120            0.0.0.0:*
LISTEN  0       128         127.0.0.1:5678            0.0.0.0:*
LISTEN  0       128         127.0.0.1:8290            0.0.0.0:*</code></pre>
    <p>Once you see the open ports, how do you talk to them? You use <code>netcat</code> (<code>nc</code>), known in cybersecurity as the Swiss Army Knife of networking. Running <code>nc 127.0.0.1 5678</code> opens a raw TCP connection, allowing you to read the server's immediate greeting.</p>
  </div>

  <!-- Challenge 2: network-scan -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 2: Mapping the Dark House (network-scan)</h3>
      <span class="challenge-tag">Mandatory &bull; Port Scanning &amp; Nmap</span>
    </div>
    <p><strong>The Concept &amp; Intuition:</strong> In the real world, you cannot log into the target machine to run <code>ss -ltn</code>. You are on the outside looking in. Port scanning is like walking down the hallway of an office building at night and gently turning every door handle to see which offices are unlocked.</p>

    <div class="callout analogy">
      <strong>The TCP Three-Way Handshake:</strong><br>
      TCP connections are polite conversations that require three steps:
      <ol>
        <li><strong>SYN (Synchronize):</strong> "Hello! May I talk to you?" (Sent by client).</li>
        <li><strong>SYN-ACK (Synchronize-Acknowledge):</strong> "Yes, I hear you and I'm open!" (Sent by server if port is open).</li>
        <li><strong>ACK (Acknowledge):</strong> "Great, let's begin!" (Sent by client).</li>
      </ol>
      If the port is closed, the server replies with <strong>RST (Reset)</strong>: "Go away, nobody lives here."
    </div>

    <p><strong>Using Nmap:</strong> To map our target at <code>127.0.0.2</code>, students use <code>nmap</code>:</p>
    <pre><code>student@signals:~$ nmap -sT -p 1-10000 127.0.0.2
Starting Nmap ( https://nmap.org )
Nmap scan report for 127.0.0.2
PORT     STATE SERVICE
2100/tcp open  echo
3400/tcp open  daytime
7890/tcp open  unknown</code></pre>
    <p>Students learn that scanning reveals services without ever touching the server's console. Connecting to port 7890 exposes the hidden vault service.</p>
  </div>

  <!-- Challenge 3: network-banner -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 3: Reading the Welcome Mat (network-banner)</h3>
      <span class="challenge-tag">Fingerprinting &bull; Banner Grabbing</span>
    </div>
    <p><strong>The Concept:</strong> Knowing a port is open is only half the battle; what software is running behind it? Many network daemons eagerly announce their software name, version, and operating system the moment a client connects. This is called a <strong>service banner</strong>.</p>
    
    <div class="callout why-it-happens">
      <strong>Why Do Services Announce Themselves?</strong><br>
      Historically, protocol specifications (like FTP and SMTP) encouraged software to identify itself for administrative diagnostics. In modern security, however, broadcasting <code>Apache 2.4.49</code> or <code>OpenSSH 7.2p2</code> tells an attacker the exact patch level and known CVE vulnerabilities of your server!
    </div>
    <p>Students use <code>nc -nv &lt;ip&gt; &lt;port&gt;</code> or <code>curl -I</code> to capture these banners and identify the specific service version harboring credentials.</p>
  </div>

  <!-- Challenge 4: network-capture -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 4: The Transparent Postal System (network-capture)</h3>
      <span class="challenge-tag">Packet Sniffing &bull; Tshark &amp; Wireshark</span>
    </div>
    <p><strong>The Concept:</strong> When data travels over a network wire or Wi-Fi channel, it is broken into discrete units called <strong>packets</strong>. If communication is not encrypted (e.g., plain HTTP, FTP, or Telnet), anyone positioned between the sender and receiver can read every single byte.</p>
    
    <div class="callout analogy">
      <strong>Postcards vs. Wax-Sealed Letters:</strong><br>
      Plain HTTP is like writing a message on a postcard. Every mail carrier, sorting clerk, and bystander who handles the postcard can read your message without tearing an envelope. HTTPS (TLS) is like placing the message inside an indestructible, tamper-evident steel safe that only the intended recipient can unlock.
    </div>

    <p><strong>The Hands-on Path:</strong> Students inspect a packet capture file (<code>capture.pcap</code>) using command-line Wireshark (<code>tshark</code>):</p>
    <pre><code>student@signals:~$ tshark -r capture.pcap -Y "http.request or http.response"
  1   0.000000    10.0.0.2 -> 10.0.0.1    HTTP GET /login HTTP/1.1
  2   0.004512    10.0.0.1 -> 10.0.0.2    HTTP HTTP/1.1 200 OK (text/html)
  3   0.012930    10.0.0.2 -> 10.0.0.1    HTTP POST /login HTTP/1.1 (application/x-www-form-urlencoded)</code></pre>
    <p>By inspecting packet #3 with <code>tshark -r capture.pcap -T fields -e text</code>, students see raw passwords sent across the wire in plaintext, teaching the non-negotiable necessity of TLS.</p>
  </div>

  <!-- Challenge 5: network-dns -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 5: The Internet's Phonebook (network-dns)</h3>
      <span class="challenge-tag">DNS Reconnaissance &bull; Dig &amp; TXT Records</span>
    </div>
    <p><strong>The Concept:</strong> Humans are terrible at remembering numbers like <code>142.250.190.46</code>, but great at remembering names like <code>google.com</code>. The Domain Name System (DNS) is the global directory that translates names to IP addresses.</p>
    <p>DNS supports many record types:</p>
    <ul>
      <li><strong>A Records:</strong> Maps a domain to an IPv4 address.</li>
      <li><strong>MX Records:</strong> Mail Exchangers that receive email.</li>
      <li><strong>TXT Records:</strong> Arbitrary text metadata, often used for domain verification, SPF email safety, and internal administrator notes.</li>
    </ul>
    <p>Students use the <code>dig</code> tool to query a local DNS server and uncover hidden configuration strings stored inside TXT records:</p>
    <pre><code>student@signals:~$ dig @127.0.0.1 -p 53 internal.keep.lan TXT +short
"ARCHIVE::dns_z0n3_tr4nsf3r_...::"</code></pre>
  </div>

  <!-- Challenge 6: network-http -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 6: The Language of the Web (network-http)</h3>
      <span class="challenge-tag">Protocol Mechanics &bull; Curl &amp; Headers</span>
    </div>
    <p><strong>The Concept:</strong> Web browsers hide the raw HTTP protocol behind pretty graphics. In cybersecurity, we must strip away the browser and speak directly to web servers using terminal tools like <code>curl</code>.</p>
    <div class="callout teacher-tip">
      <strong>Anatomy of an HTTP Request:</strong><br>
      An HTTP request is pure text containing three main elements:
      <ol>
        <li><strong>Request Line:</strong> The method and path (e.g., <code>GET /index.html HTTP/1.1</code>).</li>
        <li><strong>Headers:</strong> Key-value metadata (e.g., <code>User-Agent: curl/7.88.1</code>, <code>X-Custom-Auth: secret</code>).</li>
        <li><strong>Body:</strong> The payload (used in POST and PUT requests).</li>
      </ol>
    </div>
    <p>Students use <code>curl -i -H "X-Warden-Token: secret" http://127.0.0.1:8080/api</code> to manually inject required authentication headers, experiencing firsthand how HTTP requests are structured.</p>
  </div>

  <!-- Challenge 7: network-protocol-id -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 7: Speaking Alien Dialects (network-protocol-id)</h3>
      <span class="challenge-tag">Protocol Triage &bull; Text vs. Binary</span>
    </div>
    <p><strong>The Concept:</strong> Not every protocol on a network is human-readable HTTP or SMTP. Many proprietary, industrial, or gaming protocols communicate in raw binary packets. When an unknown port opens, how do you identify what language it speaks?</p>
    <p>Students connect to mystery endpoints and observe how they respond:</p>
    <ul>
      <li>Does it print ASCII text? (e.g., <code>220 Service Ready</code> &rarr; SMTP/FTP).</li>
      <li>Does it emit binary bytes? (e.g., <code>\x89PNG</code> or <code>\x1f\x8b</code> &rarr; Gzip/Zlib).</li>
      <li>Does it echo back input or expect an immediate binary handshake?</li>
    </ul>
    <p>This develops intuitive diagnostic triage skills required during real-world penetration tests.</p>
  </div>

  <!-- Challenge 8: network-firewall -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 8: The Bouncer at the Gate (network-firewall)</h3>
      <span class="challenge-tag">Defensive Rules &bull; iptables &amp; Ingress Filtering</span>
    </div>
    <p><strong>The Concept:</strong> A firewall is a network traffic filter. The Linux kernel includes a built-in packet filtering framework called <code>netfilter</code>, managed via <code>iptables</code> or <code>nftables</code>.</p>
    <div class="callout defense-rule">
      <strong>The Default-Deny Golden Rule:</strong><br>
      A properly configured firewall should follow <strong>Default Deny</strong>:
      <em>"Block all incoming traffic by default, and explicitly allow only the specific ports and IP addresses that are strictly necessary."</em>
    </div>
    <p>Students inspect firewall tables using <code>iptables -L -n -v</code>, identifying misconfigured rules where specific ports or subnets were inadvertently left open to unauthorized networks.</p>
  </div>

  <!-- Challenge 9: network-pcap-forensics -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 9: Digital Archaeology (network-pcap-forensics)</h3>
      <span class="challenge-tag">Forensics &bull; Stream Reassembly</span>
    </div>
    <p><strong>The Concept:</strong> Large files (like images, archives, or executable binaries) cannot fit in a single 1500-byte network packet. TCP breaks files into dozens or thousands of segments, transmits them out of order, and reassembles them at the receiver.</p>
    <p>Students learn how network forensic analysts extract transmitted files from recorded PCAP streams:</p>
    <pre><code>tshark -r stream.pcap --export-objects "http,./extracted_files"</code></pre>
    <p>Carving files out of packet streams demonstrates how evidence is recovered during incident response investigations.</p>
  </div>

  <!-- Challenge 10: network-pivot -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 10: Stepping Across Islands (network-pivot)</h3>
      <span class="challenge-tag">Advanced &bull; Multi-Hop Network Pivoting</span>
    </div>
    <p><strong>The Concept:</strong> In enterprise security, sensitive internal databases are never connected directly to the public internet. They sit in deep internal network segments. When an attacker compromises an external-facing server (a jump host or bastion), they use that host as a bridge to reach internal networks. This technique is known as <strong>network pivoting</strong>.</p>
    
    <div class="callout analogy">
      <strong>The Island Bridge Analogy:</strong><br>
      Imagine you stand on Island A. Island C is miles away across deep water, and you cannot jump to it. But Island B sits in the middle with a bridge connecting to Island A, and another bridge connecting to Island C. If you walk across the bridge to Island B, you can now reach Island C!
    </div>
    <p>Students configure multi-hop SSH tunnels (<code>ssh -D 1080</code>) or proxy chains to route traffic through compromised intermediate hosts, unlocking deeply protected internal nodes.</p>
  </div>
</div>

<!-- PART II: WEB DUNGEON -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-tag">Part II &bull; Dungeon 4</div>
    <h1>The Web Dungeon: Breaking the Browser's Trust</h1>
  </div>

  <h2>Chapter 2: The Modern Web &amp; The Illusion of Client Trust</h2>
  <p>The web is built on a fundamental division of labor: the <strong>Client</strong> (the student's web browser) and the <strong>Server</strong> (the backend computer hosting databases and business logic). The browser renders HTML, applies CSS styling, and executes JavaScript to create snappy user interfaces.</p>
  
  <p>However, this division creates the single most common vulnerability category in all of computer science: <strong>The Fallacy of Client Trust</strong>.</p>

  <div class="callout defense-rule">
    <strong>The First Law of Web Security:</strong><br>
    <strong>Never trust the client.</strong> The client machine is owned and operated by the user. An attacker has full control over their browser, can inspect every line of front-end JavaScript, can modify every HTTP request, and can tamper with every cookie, parameter, and header before sending it to the server.
  </div>

  <!-- Challenge 1: web-recon -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 1: Read the Map (web-recon)</h3>
      <span class="challenge-tag">Mandatory &bull; Information Disclosure</span>
    </div>
    <p><strong>The Concept:</strong> Search engines like Google crawl the web by following links. Webmasters use a text file at the root of their website called <code>/robots.txt</code> to tell automated crawlers: <em>"Please do not index these private folders."</em></p>
    <div class="callout why-it-happens">
      <strong>The Irony of robots.txt:</strong><br>
      To tell a polite crawler what not to look at, the administrator must list all the secret paths in plain text! An attacker looks at <code>/robots.txt</code> first, treating it as an official treasure map of hidden endpoints.
    </div>
    <pre><code>User-agent: *
Disallow: /keep-backup/
Disallow: /admin-console/</code></pre>
    <p>Visiting <code>/keep-backup</code> immediately reveals exposed development notes and backup indices that were never meant for public eyes.</p>
  </div>

  <!-- Challenge 2: web-devtools -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 2: Under the Hood of Your Browser (web-devtools)</h3>
      <span class="challenge-tag">Browser Inspection &bull; Custom HTTP Headers</span>
    </div>
    <p><strong>The Concept:</strong> Most users only look at the graphical elements rendered on their screen. But web pages communicate dozens of metadata fields in the background via <strong>HTTP Response Headers</strong>.</p>
    <p>Students open their browser Developer Tools (F12) &rarr; <strong>Network Tab</strong>, refresh the page, and inspect the raw response headers for <code>/account</code>. There, hiding in plain sight, sits a header like:</p>
    <pre><code>HTTP/1.1 200 OK
Content-Type: text/plain
X-Keep-Token: S0VZX34wcnRfc2Nhbm5lcl9ubzBi...</code></pre>
    <p>Decoding the Base64 token reveals the flag, teaching students that web security extends far beyond what is visible on the rendered page.</p>
  </div>

  <!-- Challenge 3: web-cookie-trust -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 3: The VIP Wristband Problem (web-cookie-trust)</h3>
      <span class="challenge-tag">Session Tampering &bull; Insecure Cookies</span>
    </div>
    <p><strong>The Concept:</strong> HTTP is <strong>stateless</strong>. When you click from page A to page B, the server forgets who you are unless you provide a token proving your identity. The most common mechanism for this is a <strong>cookie</strong>.</p>
    <div class="callout analogy">
      <strong>The Waterpark Wristband Analogy:</strong><br>
      Imagine a waterpark hands you a paper wristband that says <code>role=guest</code> written in blue ballpoint pen. If the lifeguard at the VIP slide simply glances at the wristband and lets anyone through who has <code>role=admin</code> written on it, what stops a guest from crossing out "guest" with a marker and writing "admin"?
    </div>
    <p>In this challenge, the application checks:</p>
    <pre><code>if (req.cookies.role === 'admin') {
  return res.send("Welcome Warden: " + flag);
}</code></pre>
    <p>By opening DevTools &rarr; Application &rarr; Cookies and editing their cookie from <code>role=user</code> to <code>role=admin</code>, students walk right past the gate, illustrating why authorization must be cryptographically signed (like HMAC-signed JWTs or secure session stores).</p>
  </div>

  <!-- Challenge 4: web-client-trust -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 4: The Honor System at Checkout (web-client-trust)</h3>
      <span class="challenge-tag">Parameter Tampering &bull; Business Logic Bypass</span>
    </div>
    <p><strong>The Concept:</strong> An online store displays an item with a price of $50. The HTML form includes an input field: <code>&lt;input type="hidden" name="price" value="50"&gt;</code>.</p>
    <div class="callout why-it-happens">
      <strong>Why Do Developers Do This?</strong><br>
      Front-end developers often think: <em>"The user cannot change this because it's a hidden field or disabled input."</em> But the user is sending the HTTP POST request! An attacker can open <code>curl</code> or Burp Suite and change the request body to <code>price=0</code> or <code>price=-50</code>.
    </div>
    <p>If the server accepts whatever price the client submits without looking up the true cost in its database, the user gets items for free. Students learn that all business logic and calculations must live strictly on the server.</p>
  </div>

  <!-- Challenge 5: web-idor -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 5: Peeking in Someone Else's Locker (web-idor)</h3>
      <span class="challenge-tag">Broken Access Control &bull; IDOR</span>
    </div>
    <p><strong>The Concept:</strong> Insecure Direct Object References (IDOR) occur when an application takes an ID supplied by the user (like an order number, user ID, or invoice ID) and retrieves the record from the database without verifying if the currently logged-in user actually owns that record.</p>
    <pre><code>// VULNERABLE IDOR IMPLEMENTATION
app.get('/order', (req, res) => {
  const order = db.get("SELECT * FROM orders WHERE id = ?", req.query.id);
  res.json(order); // Oops! We never checked who owns this order!
});</code></pre>
    <p>A student logs in, views their own receipt at <code>/order?id=1042</code>, changes the number in their URL bar to <code>/order?id=1337</code>, and immediately views the administrator's private purchase records. This teaches the importance of checking session identity against resource ownership on every single access.</p>
  </div>

  <!-- Challenge 6: web-sqli -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 6: The Waiter and the Kitchen (web-sqli)</h3>
      <span class="challenge-tag">Database Exploitation &bull; SQL Injection</span>
    </div>
    <p><strong>The Concept:</strong> Databases store structured information. When an application queries a database, it speaks SQL (Structured Query Language). A classic login query looks like:</p>
    <pre><code>SELECT * FROM users WHERE username = 'alice' AND password = 'secretpassword';</code></pre>
    <div class="callout analogy">
      <strong>The Restaurant Ticket Analogy:</strong><br>
      Imagine a waiter writes your order on an order ticket for the kitchen: <em>"Table 4 wants: [CUSTOMER INPUT]"</em>.<br>
      If a customer says: <em>"A steak, AND ALSO GIVE TABLE 4 ALL MONEY IN THE CASH REGISTER"</em>, and the kitchen blindly obeys the entire handwritten ticket as an executive instruction, that is SQL Injection!
    </div>
    <p>If a developer concatenates user input with strings: <code>"SELECT * FROM users WHERE username = '" + user + "'"</code>, an attacker inputs:</p>
    <pre><code>admin' OR '1'='1' --</code></pre>
    <p>The resulting query becomes: <code>SELECT * FROM users WHERE username = 'admin' OR '1'='1' --' ...</code>. Because <code>'1'='1'</code> is always true, and <code>--</code> comments out the password verification, the database logs the attacker in as administrator without a password!</p>
  </div>

  <!-- Challenge 7: web-reflected-xss -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 7: Echoing Poison (web-reflected-xss)</h3>
      <span class="challenge-tag">Client-Side Injection &bull; Reflected XSS</span>
    </div>
    <p><strong>The Concept:</strong> Cross-Site Scripting (XSS) occurs when an application takes untrusted user input and embeds it into the HTML page without sanitizing or escaping it. The victim's browser cannot tell the difference between legitimate code written by the website author and malicious code injected by an attacker.</p>
    <p>In <code>web-reflected-xss</code>, the search box reflects whatever you typed:</p>
    <pre><code>&lt;h1&gt;Results for: &lt;script&gt;alert(1)&lt;/script&gt;&lt;/h1&gt;</code></pre>
    <p>Because the angle brackets <code>&lt; &gt;</code> are rendered directly into the HTML document object model (DOM), the browser executes the script inside the user's active session, allowing an attacker to steal session cookies or perform unauthorized actions.</p>
  </div>

  <!-- Challenge 8: web-headers -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 8: The Return Address Lie (web-headers)</h3>
      <span class="challenge-tag">Access Control Bypass &bull; Header Forgery</span>
    </div>
    <p><strong>The Concept:</strong> Some developers try to restrict administrative portals by checking the <code>X-Forwarded-For</code> or <code>Referer</code> headers, assuming requests claiming to come from <code>127.0.0.1</code> must be internal and trustworthy.</p>
    <p>Students learn that <strong>HTTP request headers are completely controlled by the client</strong>. By supplying <code>curl -H "X-Forwarded-For: 127.0.0.1"</code> or custom origin headers, students demonstrate why security boundaries must never rely on unverified client-asserted metadata.</p>
  </div>

  <!-- Challenge 9: web-stored-xss -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 9: A Time Bomb on the Bulletin Board (web-stored-xss)</h3>
      <span class="challenge-tag">Persistent Injection &bull; Stored XSS</span>
    </div>
    <p><strong>The Concept:</strong> Reflected XSS requires tricking a victim into clicking a crafted link. <strong>Stored XSS</strong> is much more dangerous: the malicious script is submitted to a persistent storage location (like a guestbook, forum post, or profile bio).</p>
    <p>When any other user (including the platform administrator) visits the guestbook, the server pulls the malicious comment out of the database and delivers it to their browser, executing silently inside their session without any link clicking required.</p>
  </div>

  <!-- Challenge 10: web-chain -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 10: The Domino Effect (web-chain)</h3>
      <span class="challenge-tag">Advanced &bull; Multi-Stage Exploit Chaining</span>
    </div>
    <p><strong>The Concept:</strong> In real-world security assessments, a single small vulnerability rarely brings down an entire fortress. Attackers achieve critical compromises by <strong>chaining</strong> multiple low-severity findings together.</p>
    <div class="callout teacher-tip">
      <strong>The 3-Step Exploit Chain:</strong>
      <ol>
        <li><strong>Step 1 (Reconnaissance):</strong> Inspect <code>/robots.txt</code> to discover the hidden administrative endpoint: <code>/keep-admin</code>.</li>
        <li><strong>Step 2 (Access Control Violation):</strong> Visit <code>/keep-admin/vault</code> and receive a 403 Forbidden error stating "admin role required".</li>
        <li><strong>Step 3 (Session Tampering):</strong> Set your browser cookie to <code>role=admin</code> and refresh, unlocking the inner vault!</li>
      </ol>
    </div>
    <p>This challenge brings together all lessons learned in the Web Dungeon, illustrating how small informational leaks pave the way for total administrative compromise.</p>
  </div>
</div>

<!-- PART III: SECURE CODING DUNGEON -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-tag">Part III &bull; Dungeon 5</div>
    <h1>The Secure Coding Dungeon: The Art of Defensive Engineering</h1>
  </div>

  <h2>Chapter 3: The Defensive Engineer's Mindset</h2>
  <p>Breaking a vulnerable application is fun, eye-opening, and thrilling. But anyone can knock down a wall with a sledgehammer; it takes true mastery, deep engineering discipline, and craft to design a wall that cannot be knocked down in the first place.</p>
  
  <p>In <strong>The Forge</strong>, students put on the hardhat of a software engineer. You are handed the actual source code of the vulnerable web application and given an automated test suite. Your mission is twofold:</p>
  <ol>
    <li><strong>Neutralize the exploit:</strong> Make sure malicious inputs and attacks fail completely.</li>
    <li><strong>Keep the application working:</strong> Ensure that legitimate users can still log in, view their orders, and use the system without disruption.</li>
  </ol>

  <!-- Challenge 1: secure-sqli -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 1: Separating Code from Data (secure-sqli)</h3>
      <span class="challenge-tag">Defensive SQL &bull; Prepared Statements</span>
    </div>
    <p><strong>The Flawed Attempt (Blacklisting):</strong> Beginners often try to fix SQL injection by writing filter blacklists:</p>
    <pre><code>// FLAWED FIX &mdash; DO NOT DO THIS!
if (username.includes("'")) return res.status(401).send("No quotes allowed!");</code></pre>
    <p>Why does this fail? First, an attacker can often bypass filters using alternative encodings. Second, what happens when a real user named <strong>O'Brien</strong> tries to log into your service? The blacklist breaks legitimate business functionality!</p>

    <div class="callout defense-rule">
      <strong>The Secure Solution &mdash; Parameterized Queries:</strong><br>
      Instead of pasting strings together, use <strong>Prepared Statements</strong>. A prepared statement pre-compiles the SQL query structure in the database engine first. The user input is then sent separately as pure data parameters. Even if the user enters <code>' OR 1=1 --</code>, the database treats it as a literal string value for a username, never as executable SQL logic!
    </div>

    <pre><code>// SECURE IMPLEMENTATION
const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
const row = stmt.get(username, password);</code></pre>
  </div>

  <!-- Challenge 2: secure-xss -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 2: Teaching the Browser What is Safe (secure-xss)</h3>
      <span class="challenge-tag">Output Encoding &bull; HTML Entity Escaping</span>
    </div>
    <p><strong>The Flawed Attempt (Tag Stripping):</strong></p>
    <pre><code>// FLAWED FIX
const sanitized = input.replace(/&lt;script&gt;/gi, "");</code></pre>
    <p>Stripping <code>&lt;script&gt;</code> tags fails immediately because modern HTML supports dozens of ways to execute JavaScript without script tags: <code>&lt;img src="x" onerror="alert(1)"&gt;</code>, <code>&lt;svg onload="alert(1)"&gt;</code>, or <code>&lt;body onload="..."&gt;</code>.</p>

    <div class="callout defense-rule">
      <strong>The Secure Solution &mdash; Context-Aware HTML Encoding:</strong><br>
      Whenever user data is rendered into an HTML document, convert special characters into their safe HTML entity equivalents:
      <ul>
        <li><code>&amp;</code> &rarr; <code>&amp;amp;</code></li>
        <li><code>&lt;</code> &rarr; <code>&amp;lt;</code></li>
        <li><code>&gt;</code> &rarr; <code>&amp;gt;</code></li>
        <li><code>"</code> &rarr; <code>&amp;quot;</code></li>
        <li><code>'</code> &rarr; <code>&amp;#39;</code></li>
      </ul>
      When the browser sees <code>&amp;lt;script&amp;gt;</code>, it renders the characters as harmless readable text on screen without ever executing them as code.
    </div>
  </div>

  <!-- Challenge 3: secure-idor -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 3: Checking the ID at the Counter (secure-idor)</h3>
      <span class="challenge-tag">Authorization &bull; Session Ownership Binding</span>
    </div>
    <p><strong>The Flawed Fix:</strong> Hardcoding checks for specific IDs (e.g., <code>if (id === 1337) return 403</code>) fails as soon as a new record is inserted.</p>
    <div class="callout defense-rule">
      <strong>The Secure Solution &mdash; Scope Queries to Session Identity:</strong><br>
      Never query the database solely by the client's requested ID. Always bind the query to the authenticated user stored in the session cookie:
    </div>
    <pre><code>// SECURE IMPLEMENTATION
const currentUser = req.session.user; // Authenticated server-side identity
const order = db.prepare('SELECT * FROM orders WHERE id = ? AND owner = ?')
                .get(req.query.id, currentUser);
if (!order) return res.status(404).send("Order not found or unauthorized");</code></pre>
  </div>

  <!-- Challenge 4: secure-client -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 4: Trust, But Verify on the Server (secure-client)</h3>
      <span class="challenge-tag">Input Validation &bull; Server-Side Enforcement</span>
    </div>
    <p><strong>The Concept:</strong> To fix client-side price tampering, the server must validate all incoming data against strict business rules:</p>
    <ul>
      <li>Is the value a valid finite number?</li>
      <li>Is the value strictly greater than zero?</li>
      <li>Better yet: Look up the authentic price in the product catalog database using a product ID rather than trusting a client-supplied price tag!</li>
    </ul>
    <pre><code>// SECURE IMPLEMENTATION
const price = Number(req.body.price);
if (isNaN(price) || price &lt;= 0) {
  return res.status(400).send("Invalid order amount");
}</code></pre>
  </div>

  <!-- Challenge 5: secure-headers -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 5: Armoring the Browser (secure-headers)</h3>
      <span class="challenge-tag">Defense-in-Depth &bull; Security Headers &amp; CSP</span>
    </div>
    <p><strong>The Concept:</strong> Security headers instruct the user's browser to activate its built-in security defenses.</p>
    <table>
      <thead>
        <tr>
          <th>Header</th>
          <th>What It Does</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Content-Security-Policy (CSP)</code></td>
          <td>Restricts where scripts, styles, and images can be loaded from. Prevents unauthorized inline script execution.</td>
        </tr>
        <tr>
          <td><code>X-Frame-Options: DENY</code></td>
          <td>Stops clickjacking by preventing other sites from embedding your page in an iframe.</td>
        </tr>
        <tr>
          <td><code>X-Content-Type-Options: nosniff</code></td>
          <td>Prevents the browser from misinterpreting a text or image file as an executable script.</td>
        </tr>
      </tbody>
    </table>
    <p>Students implement standard headers using modern middleware like <code>helmet</code>.</p>
  </div>

  <!-- Challenge 6: secure-rate-limit -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 6: Calming the Storm (secure-rate-limit)</h3>
      <span class="challenge-tag">Anti-Abuse &bull; Token Buckets &amp; 429 Limiting</span>
    </div>
    <p><strong>The Concept:</strong> Computers can submit thousands of passwords or requests per second. To protect servers from denial-of-service and brute-force attacks, we implement <strong>Rate Limiting</strong>.</p>
    <div class="callout analogy">
      <strong>The Bouncer's Clicker:</strong><br>
      A rate limiter tracks requests per IP address or account over a sliding time window (e.g., maximum 5 attempts per 60 seconds). Once the limit is reached, the server responds with <strong>HTTP 429 Too Many Requests</strong> and a <code>Retry-After</code> header, resetting only after the window expires.
    </div>
  </div>

  <!-- Challenge 7: secure-hide-secret -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 7: Keeping the Keys in the Safe (secure-hide-secret)</h3>
      <span class="challenge-tag">Secrets Management &bull; Environment Decoupling</span>
    </div>
    <p><strong>The Mistake:</strong> Storing API keys, database passwords, or cryptographic secrets directly in source code files.</p>
    <div class="callout why-it-happens">
      <strong>Why Hardcoding Keys Is Fatal:</strong><br>
      Code gets committed to Git repositories, pushed to GitHub, shared with teammates, and included in backups. Once an API key is committed to source control, it is practically public knowledge.
    </div>
    <p><strong>The Secure Pattern:</strong> Store all credentials in external environment variables (accessed via <code>process.env.API_KEY</code>) that are injected into the container at runtime and excluded from source repositories and public configuration endpoints.</p>
  </div>

  <!-- Challenge 8: secure-full-review -->
  <div class="challenge-block">
    <div class="challenge-title">
      <h3>Challenge 8: The Master Builder's Final Inspection (secure-full-review)</h3>
      <span class="challenge-tag">Full-Stack Hardening &bull; Comprehensive Audit</span>
    </div>
    <p><strong>The Capstone Challenge of Defensive Engineering:</strong> In this final test, students review an entire production codebase exhibiting multiple interacting vulnerabilities.</p>
    <p>Students must apply everything they have learned:</p>
    <ul>
      <li>Replace string-concatenated SQL queries with prepared statements.</li>
      <li>Escape all reflected and stored output strings.</li>
      <li>Enforce strict session-bound IDOR authorization matrices.</li>
      <li>Strip sensitive credentials from debug endpoints.</li>
      <li>Configure defensive HTTP headers and rate limiters.</li>
    </ul>
    <p>When the automated test harness runs all attack vectors simultaneously and confirms that every exploit is blocked while the application still functions seamlessly, the student has earned the title of <strong>Warden of the Keep</strong>.</p>
  </div>
</div>

<!-- Epilogue & Quick Reference -->
<div class="page-break">
  <h1>Epilogue: The Path Forward as an Ethical Guardian</h1>
  <p>Congratulations on completing your study of the Signals, Trading Post, and Forge dungeons!</p>
  <p>The technical skills you have explored—socket binding, packet analysis, HTTP protocol mechanics, database injection, client-side script execution, and defensive engineering—are powerful tools. With that power comes a profound ethical responsibility.</p>
  
  <div class="callout analogy">
    <strong>The Ethics of the Craft:</strong><br>
    The knowledge of how to pick a lock can be used by a burglar to rob a house in the night, or by a locksmith to rescue a child trapped in a room. The physical tools are identical; the intent and moral compass of the practitioner make all the difference.
  </div>

  <p>Always practice your skills exclusively on systems you own or have explicit, documented, written permission to test (such as BreachKeep, approved CTFs, and educational labs). Channel your curiosity into building software that protects human privacy, defends vital infrastructure, and makes the digital world a safer place for everyone.</p>

  <h2>Quick Reference Toolkit</h2>
  <table>
    <thead>
      <tr>
        <th>Tool / Command</th>
        <th>Primary Use Case</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>ss -ltn</code></td>
        <td>List local listening TCP sockets and ports without resolving names.</td>
      </tr>
      <tr>
        <td><code>nc -nv &lt;ip&gt; &lt;port&gt;</code></td>
        <td>Connect to a raw TCP socket to grab banners or test communications.</td>
      </tr>
      <tr>
        <td><code>nmap -sT -p &lt;ports&gt; &lt;ip&gt;</code></td>
        <td>Perform a TCP connect port scan across remote targets.</td>
      </tr>
      <tr>
        <td><code>tshark -r &lt;file.pcap&gt;</code></td>
        <td>Analyze recorded packet capture streams from the command line.</td>
      </tr>
      <tr>
        <td><code>curl -i -H "..." &lt;url&gt;</code></td>
        <td>Craft custom HTTP requests with injected headers and view response metadata.</td>
      </tr>
      <tr>
        <td><code>dig @&lt;server&gt; &lt;domain&gt; TXT</code></td>
        <td>Query DNS servers for specific record types and hidden text annotations.</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: center; margin-top: 3rem; color: #64748b; font-size: 10pt;">
    &mdash; <em>BreachKeep Faculty Curriculum &bull; Designed for Curious Minds &bull; Keep Moving Forward</em> &mdash;
  </p>
</div>

</body>
</html>
`

fs.writeFileSync(htmlPath, htmlContent)
console.log('HTML written to:', htmlPath)

console.log('Rendering HTML to PDF via Microsoft Edge headless...')
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"

try {
  execSync(`"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`)
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath)
    console.log(`SUCCESS! PDF created at ${pdfPath} (${stats.size} bytes)`)
  } else {
    console.error('PDF file was not created.')
  }
} catch (e) {
  console.error('Error rendering PDF:', e)
}
