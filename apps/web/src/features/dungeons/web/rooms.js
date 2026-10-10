// Web "Trading Post" dungeon — attack a deliberately vulnerable web app. Every
// room boots the app (per-student) plus a shell; `app: true` makes the room page
// offer an "Open web app" button alongside the terminal. The flag is gated to
// each room's intended vulnerability.

export const DUNGEON_ID = 'web'
export const DUNGEON_TITLE = 'The Trading Post'
export const DUNGEON_BLURB =
  'Attack a deliberately broken web shop — the OWASP classics, hands-on: recon, access control, injection, and XSS.'

export const TIERS = {
  mandatory: { label: 'Mandatory', note: 'Clear all of these to unlock the medium rooms.' },
  medium: { label: 'Medium', note: 'Unlocks after every mandatory room is cleared.' },
  hard: { label: 'Hard', note: 'Unlocks after 2 of the 3 medium rooms are cleared.' },
}

export const ROOMS = [
  {
    id: 'web-recon', tier: 'mandatory', num: 'I', app: true,
    title: 'Read the Map',
    concept: 'Reconnaissance: Crawler manifests (robots.txt & sitemap.xml) disclosing hidden paths.',
    brief: 'Every security audit begins with reconnaissance. Before launching attacks, auditors inspect public crawler manifests to uncover unlinked directories, private admin portals, and forgotten backups that site owners forgot to hide.',
    objective: 'Explore the Trading Post, inspect robots.txt and sitemap.xml to discover the unlinked backup directory, and retrieve the relic key.',
    hints: [
      'Open the Trading Post storefront in the web-app tab and look at the footer, or directly navigate to /robots.txt and /sitemap.xml.',
      'Web crawlers look at /robots.txt to know which paths they shouldn’t index. Auditors read it for the exact same reason.',
      'Notice the "Disallow: /keep-backup/" entry in robots.txt. Visit http://localhost:8080/keep-backup in your browser or run: curl http://localhost:8080/keep-backup',
    ],
    debrief: 'robots.txt and sitemap.xml are public files meant for search engines, not access control. Listing sensitive or backup paths there simply hands attackers a free map of your application.',
  },
  {
    id: 'web-devtools', tier: 'mandatory', num: 'II', app: true,
    title: 'It’s in the Headers',
    concept: 'Deep Observation: Inspecting hidden HTTP response headers using browser DevTools.',
    brief: 'When web servers respond to your browser, only part of the message is rendered on the screen. Critical session tokens and metadata travel invisibly in HTTP headers. The Trading Post has an "Account" page, but simply reading the page text won\'t reveal your key.',
    objective: 'Navigate to your Account profile, inspect the raw HTTP response headers in browser DevTools (or curl -i), and decode the base64 token.',
    hints: [
      'Click "Account" in the Trading Post navigation bar (or visit /account in your browser).',
      'The page explains that session tokens are exchanged via response headers to prevent DOM scraping. The key is NOT in the HTML!',
      'Press F12 to open Developer Tools, go to the Network tab, and reload /account. Click on the "account" request and inspect the "Response Headers" for X-Keep-Token.',
      'Alternatively in the terminal: curl -i http://localhost:8080/account',
      'The header value is Base64 encoded. Decode it in DevTools Console using atob("<token>") or in terminal: echo "<token>" | base64 -d',
    ],
    debrief: 'Half of web application testing is observing what normal users ignore: headers, cookies, and status codes. DevTools’ Network tab is where security analysis truly begins.',
  },
  {
    id: 'web-cookie-trust', tier: 'mandatory', num: 'III', app: true,
    title: 'The Role Cookie',
    concept: 'Broken Access Control: Why servers must never trust client-controlled cookies for authorization.',
    brief: 'The Trading Post features a restricted members-only "Vault" in the navigation bar. When you attempt to enter, the door slams shut with Access Denied! How did the server determine your rank, and where does that identity live?',
    objective: 'Observe your browser cookies, tamper with the "role" cookie to claim the "admin" identity, and unlock the Vault.',
    hints: [
      'Click "Vault" in the top navigation (or visit /vault). The denial screen reveals that your identity is currently evaluated as role=guest.',
      'How does the server know your role? Open DevTools (F12) → Application / Storage tab → Cookies (or type document.cookie in the Console).',
      'Notice the cookie named "role" with value "guest". The server blindly trusts whatever value your browser presents!',
      'Double-click the cookie value in DevTools and change it to "admin", then refresh /vault.',
      'Alternatively, set it via Console: document.cookie="role=admin; path=/"  (or via terminal: curl --cookie "role=admin" http://localhost:8080/vault).',
    ],
    debrief: 'Cookies reside on the client machine, meaning the user has absolute control over them. Authorization must always be validated server-side from signed session tokens, never plain cookie values.',
  },
  {
    id: 'web-client-trust', tier: 'mandatory', num: 'IV', app: true,
    title: 'Name Your Price',
    concept: 'Parameter Tampering: Never trusting prices or amounts submitted by the client browser.',
    brief: 'Browsing the Trading Post inventory, you spot the coveted "Grand Citadel Flag Key" priced at 9,999 Gold. But your recruit purse contains 0 Gold. Clicking purchase declines the transaction. Where did the server get that price from?',
    objective: 'Observe the checkout POST request in DevTools or element source, tamper with the price parameter to set it to 0, and claim the Flag Key.',
    hints: [
      'Visit the catalog (/) and click "Purchase (9999g)" on the Grand Citadel Flag Key.',
      'Observe the transaction decline screen: it reveals that your browser submitted an HTTP POST request to /checkout with price=9999.',
      'Right-click the "Purchase (9999g)" button on the store catalog and select "Inspect Element". Look at the hidden input: <input type="hidden" name="price" value="9999">.',
      'In DevTools Elements tab, double-click value="9999", change it to "0", and click Purchase again!',
      'Alternatively, tamper with the request via DevTools Network tab, Burp Suite, or terminal: curl -d "price=0" -d "item=Grand Citadel Flag Key" http://localhost:8080/checkout',
    ],
    debrief: 'Prices, discounts, item IDs, and permissions should never be calculated or trusted from the client side. The server must look up authoritative prices in its own database.',
  },
  {
    id: 'web-idor', tier: 'mandatory', num: 'V', app: true,
    title: 'Somebody Else’s Order',
    concept: 'Insecure Direct Object Reference (IDOR): Accessing arbitrary records by manipulating URL parameters.',
    brief: 'The Trading Post provides an "Order Dispatch Lookup" tool (/orders) to track shipments. When you look up your sample receipt (#1042), you observe how the application structures the URL. Can you inspect records belonging to other people?',
    objective: 'Observe the order lookup URL structure, tamper with the query parameter to access the Warden’s secret order (#1337), and extract the key.',
    hints: [
      'Click "Orders" in the navigation bar (or visit /orders) and track your sample order #1042.',
      'Look at your browser’s URL bar: notice it navigated to /order?id=1042.',
      'Observe that the backend fetches the order directly by that numeric ID without verifying whether you actually own it.',
      'Citadel records indicate the Warden’s classified order was logged under the elite number #1337.',
      'Change the URL in your browser to /order?id=1337 (or run: curl "http://localhost:8080/order?id=1337") to read the manifest secret.',
    ],
    debrief: 'IDOR occurs when an application exposes a direct reference to an internal database object without validating access control. Always verify that the authenticated user owns the requested record.',
  },
  {
    id: 'web-sqli', tier: 'medium', num: 'VI', app: true,
    title: 'The Warden Portal Bypass',
    concept: 'SQL Injection: Breaking query logic by injecting SQL syntax into authentication forms.',
    brief: 'In the navigation bar, there is a restricted "Warden Portal" at /portal-8f2c. You do not possess valid credentials, but legacy portals frequently concatenate form inputs directly into database queries without sanitization.',
    objective: 'Observe the login form, inject SQL control characters into the username input to bypass authentication, and enter the Warden Portal.',
    hints: [
      'Click "Warden Portal" in the navbar (or visit /portal-8f2c/login). Try submitting a test login with username "admin" and password "test".',
      'Behind the scenes, the backend concatenates inputs into a query: SELECT * FROM users WHERE username = \'<INPUT>\' AND password = \'...\'',
      'What happens if your username contains a single quote (\')? It breaks out of the string boundary!',
      'Inject SQL syntax to comment out the rest of the query: enter admin\'-- as the username with any arbitrary password.',
      'Alternatively via curl: curl -d "username=admin\'--" -d "password=x" http://localhost:8080/portal-8f2c/login',
    ],
    debrief: 'Concatenating user input directly into SQL strings allows attackers to redefine the logic of the query. Always use parameterized queries (prepared statements) so user input is treated strictly as data.',
  },
  {
    id: 'web-reflected-xss', tier: 'medium', num: 'VII', app: true,
    title: 'Reflected Script',
    concept: 'Reflected XSS: Executing JavaScript in victim browsers via unsanitized search input reflection.',
    brief: 'The Trading Post header features a search bar to filter catalog wares. When you submit a search query, the page reflects your search terms in the results. If user input is embedded into HTML without encoding, browsers will execute it as live code.',
    objective: 'Observe how search input is rendered in the HTML, craft a script payload that calls /xss-report with the page nonce, and retrieve the key.',
    hints: [
      'Type a test term like "sword" into the search bar in the header (or visit /search?q=sword).',
      'Right-click and select "View Page Source" (or inspect the DOM). Notice that your search term is printed raw into the HTML without HTML entity escaping!',
      'The page initializes a security token at window.KEEP_NONCE. When a real script executes in the page context, it can report to /xss-report with this nonce.',
      'Try searching with an executable script tag: /search?q=<script>fetch(\'/xss-report?r=reflected-xss&nonce=\'+window.KEEP_NONCE)</script>',
      'Once the script triggers, check the status endpoint: open /xss-status?r=reflected-xss (or curl http://localhost:8080/xss-status?r=reflected-xss) to claim your key!',
    ],
    debrief: 'Reflected XSS occurs when untrusted input is included immediately in dynamic web output without proper contextual escaping. Context-aware output encoding prevents browsers from parsing input as script tags.',
  },
  {
    id: 'web-headers', tier: 'medium', num: 'VIII', app: true,
    title: 'Forge the Header',
    concept: 'Broken Reverse Proxy Trust: Manipulating client-supplied HTTP request headers.',
    brief: 'Reconnaissance reveals an internal administrative panel at /admin-panel. Visiting the page returns an HTTP 403 Forbidden error with a gateway diagnostic log. The server expects trusted reverse proxy headers to verify admin status.',
    objective: 'Inspect the gateway rejection message, forge the expected X-Keep-Role header, and unlock the admin panel.',
    hints: [
      'Visit /admin-panel in your browser or run: curl -i http://localhost:8080/admin-panel',
      'Read the 403 Forbidden diagnostic message: notice it reports that the header "X-Keep-Role" was missing or not set to "admin".',
      'Standard browsers don’t allow typing custom request headers into the address bar, but HTTP clients and penetration tools do.',
      'Send the request with the forged header: curl -H "X-Keep-Role: admin" http://localhost:8080/admin-panel',
      'Alternatively in DevTools Console: fetch("/admin-panel", {headers: {"X-Keep-Role": "admin"}}).then(r=>r.text()).then(console.log)',
    ],
    debrief: 'Trusting client-supplied request headers (such as X-Forwarded-For or custom role headers) for security decisions is fatally flawed. Attackers can forge any HTTP request header at will.',
  },
  {
    id: 'web-stored-xss', tier: 'hard', num: 'IX', app: true,
    title: 'The Traveler Guestbook',
    concept: 'Stored XSS: Storing malicious scripts that execute in the browser of every subsequent visitor.',
    brief: 'The Trading Post hosts a traveler "Guestbook" (/guestbook) where visitors post public notes. Unlike reflected XSS which requires sending a malicious link to a victim, stored XSS is saved in the database and automatically triggers whenever anyone views the page.',
    objective: 'Post a comment containing an active script payload, observe it executing upon viewing the guestbook, and claim the flag.',
    hints: [
      'Open "Guestbook" in the navbar (or visit /guestbook). Post a friendly greeting and observe how comments appear in the list.',
      'Inspect the page source (Ctrl+U). Notice that comments are placed straight into the HTML without sanitizing HTML tags.',
      'Post a comment containing a payload that calls the XSS reporting endpoint: <script>fetch(\'/xss-report?r=stored-xss&nonce=\'+window.KEEP_NONCE)</script>',
      'Reload the /guestbook page so the script executes in your browser session with window.KEEP_NONCE.',
      'Visit /xss-status?r=stored-xss (or curl http://localhost:8080/xss-status?r=stored-xss) to verify the execution and get your key!',
    ],
    debrief: 'Stored XSS is one of the highest-severity client-side flaws: one attacker submission can compromise every user or administrator viewing the feed. Input must be sanitized and output must always be HTML-encoded.',
  },
  {
    id: 'web-chain', tier: 'hard', num: 'X', app: true,
    title: 'Chain It Together',
    concept: 'Exploit Chaining: Combining reconnaissance and access control tampering to compromise protected assets.',
    brief: 'Real-world penetration tests rarely rely on single isolated bugs. Hardened environments require chaining multiple minor oversights together. The Citadel’s inner sanctum is locked behind both obscurity and privilege verification.',
    objective: 'Combine the hidden path revealed during robots.txt recon with the cookie tampering technique to breach /keep-admin/vault.',
    hints: [
      'Revisit the crawler recon findings from Room I: check /robots.txt again.',
      'Notice the disallow entry for "/keep-admin/". What lies behind /keep-admin/vault?',
      'If you visit /keep-admin/vault directly, it blocks you: "forbidden: admin only".',
      'Remember the cookie tampering technique from Room III: set your cookie role=admin (via DevTools Application tab, document.cookie="role=admin", or curl).',
      'Request the inner vault with your forged cookie: curl --cookie "role=admin" http://localhost:8080/keep-admin/vault (or refresh the page in your browser with the cookie set).',
    ],
    debrief: 'Attackers don’t see isolated vulnerabilities — they see pathways. A minor information disclosure (robots.txt path) chained with a broken access control (untrusted role cookie) leads to complete system compromise.',
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]))
