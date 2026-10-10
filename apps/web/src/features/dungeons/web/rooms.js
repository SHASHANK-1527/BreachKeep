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
    concept: 'Recon: robots.txt, sitemap.xml, and paths a site did not mean to publish.',
    brief: 'Sites leave notes for web crawlers in robots.txt and sitemap.xml — including paths they would rather keep quiet. Those files are public.',
    objective: 'Read robots.txt and sitemap.xml, visit the backup path disclosed in robots.txt, and read the key there.',
    hints: [
      'Every site may have /robots.txt and /sitemap.xml. They list public and crawler paths.',
      'curl -s http://localhost:8080/robots.txt  (or open /robots.txt in the web-app tab).',
      'One Disallow entry is a backup path — request it: curl http://localhost:8080/keep-backup',
    ],
    debrief: 'robots.txt and sitemap.xml are the first things an auditor checks — they provide a free map of the application surface. Never rely on them to hide anything.',
  },
  {
    id: 'web-devtools', tier: 'mandatory', num: 'II', app: true,
    title: 'It’s in the Headers',
    concept: 'Reading response headers / DevTools (not just the page body).',
    brief: 'The public sitemap (/sitemap.xml) discloses member routes like /account. But secrets often ride in the response headers your browser normally hides.',
    objective: 'Inspect the response from /account, read the token header, and decode it to the key.',
    hints: [
      'Check /sitemap.xml to see public routes like /account, then navigate to /account.',
      'The answer is not in the page text. Look at the response HEADERS (DevTools → Network, or curl -i).',
      'curl -i http://localhost:8080/account  — note the X-Keep-Token header.',
      'That token is base64. Decode it: echo <token> | base64 -d',
    ],
    debrief: 'Half of web testing is looking where users don’t: headers, cookies, redirects. DevTools’ Network tab (and curl -i) is where real recon happens.',
  },
  {
    id: 'web-cookie-trust', tier: 'mandatory', num: 'III', app: true,
    title: 'The Role Cookie',
    concept: 'Why a server must never trust a client-set cookie for authorization.',
    brief: 'The members-only vault checks a cookie to decide if you are an admin. Cookies live in YOUR browser — so you control them.',
    objective: 'Set the role cookie to admin and open /vault to read the key.',
    hints: [
      'Visit /vault — it refuses you because your role cookie says "user". Who sets that cookie? You do.',
      'Send it as admin: curl --cookie "role=admin" http://localhost:8080/vault',
      'In the browser: set document.cookie="role=admin" in the console, then reload /vault.',
    ],
    debrief: 'Anything the client can set, the client can forge. Authorization must be decided server-side from a signed session — never from a plain cookie value.',
  },
  {
    id: 'web-client-trust', tier: 'mandatory', num: 'IV', app: true,
    title: 'Name Your Price',
    concept: 'Never trust a price (or any amount) sent by the client.',
    brief: 'The checkout charges whatever price the request says. The price is in the request. You can see where this goes.',
    objective: 'Send a checkout request with a price of 0 (or less) and read the key.',
    hints: [
      'The server reads the "price" field straight from your POST body and trusts it.',
      'curl -d "price=0" http://localhost:8080/checkout',
      'A free (price<=0) order is accepted and returns the key.',
    ],
    debrief: 'Prices, totals, discounts, user IDs — if the client sends them, the client can change them. The server must re-derive anything that matters.',
  },
  {
    id: 'web-idor', tier: 'mandatory', num: 'V', app: true,
    title: 'Somebody Else’s Order',
    concept: 'Insecure Direct Object Reference: no ownership check on an id.',
    brief: 'You can view your own order by its id in the URL. Nothing stops you from asking for an id that isn’t yours.',
    objective: 'Read the admin’s order (a different id than your own) to get the key.',
    hints: [
      'Your order is id 1042: curl "http://localhost:8080/order?id=1042" — it shows only an id check, no owner check.',
      'Try other ids. The admin’s "Vault Key" order is a well-known number.',
      'curl "http://localhost:8080/order?id=1337"  — its secret is the key.',
    ],
    debrief: 'IDOR is one of the most common real-world bugs: the app checks you are logged in, but not that the record is yours. Always enforce ownership on every object.',
  },
  {
    id: 'web-sqli', tier: 'medium', num: 'VI', app: true,
    title: 'The OR Trick',
    concept: 'SQL injection in a login that concatenates input into its query.',
    brief: 'The login builds its SQL query by gluing your input straight in. Rewrite the question it asks the database.',
    objective: 'Bypass the login without valid credentials and read the key.',
    hints: [
      'Your input lands inside the query’s quotes untouched. What if your "username" closed the quote and commented out the rest?',
      'Classic payload as the username:  admin\'--   (with any password).',
      'curl --data-urlencode "username=admin\'--" --data "password=x" http://localhost:8080/portal-8f2c/login',
    ],
    debrief: 'Concatenating input into SQL lets an attacker rewrite the query. The fix is always parameterized queries / prepared statements — input as data, never as code.',
  },
  {
    id: 'web-reflected-xss', tier: 'medium', num: 'VII', app: true,
    title: 'Reflected Script',
    concept: 'Reflected XSS: input echoed into the page and executed.',
    brief: 'The search page drops whatever you typed straight back into the HTML. If you type a script, the browser runs it.',
    objective: 'Land a reflected payload that calls /xss-report from the page, then read /xss-status for the key.',
    hints: [
      'Open /search?q=hello in the web-app tab and View Source — your text appears raw inside the HTML.',
      'The page sets window.KEEP_NONCE. A real payload runs IN the page and reports with that nonce.',
      'Open in the app tab: /search?q=<script>fetch(\'/xss-report?r=reflected-xss&nonce=\'+window.KEEP_NONCE)</script> then visit /xss-status?r=reflected-xss',
    ],
    debrief: 'Reflected XSS turns a link into code execution in the victim’s session. The cure is output encoding — show user input as text, never as HTML.',
  },
  {
    id: 'web-headers', tier: 'medium', num: 'VIII', app: true,
    title: 'Forge the Header',
    concept: 'Request headers as a (broken) access control, and how to send your own.',
    brief: 'An admin panel refuses everyone — unless the request carries a particular header. Browsers won’t send it. You can.',
    objective: 'Send the header /admin-panel demands and read the key.',
    hints: [
      'curl -i http://localhost:8080/admin-panel — the 403 body tells you exactly which header it wants.',
      'Add it yourself with curl -H "Header: value".',
      'curl -H "X-Keep-Role: admin" http://localhost:8080/admin-panel',
    ],
    debrief: 'Trusting a request header (or X-Forwarded-For, or a custom "role" header) for authorization is forgeable by anyone. Headers are input, not identity.',
  },
  {
    id: 'web-stored-xss', tier: 'hard', num: 'IX', app: true,
    title: 'The Guestbook',
    concept: 'Stored XSS: a payload saved once and run against everyone who views it.',
    brief: 'The guestbook saves comments and shows them to every visitor — unescaped. A script you post today runs in every viewer’s browser.',
    objective: 'Store a payload that calls /xss-report when the guestbook is viewed, then read /xss-status for the key.',
    hints: [
      'Post a comment on /guestbook, then reload it and View Source — comments are rendered as raw HTML.',
      'Store a <script> that reports with the page nonce (window.KEEP_NONCE), then load /guestbook to run it.',
      'Comment: <script>fetch(\'/xss-report?r=stored-xss&nonce=\'+window.KEEP_NONCE)</script> ; then /xss-status?r=stored-xss',
    ],
    debrief: 'Stored XSS is the dangerous kind — one injection hits every viewer, including admins. Encode on output and sanitize on input; never render user HTML verbatim.',
  },
  {
    id: 'web-chain', tier: 'hard', num: 'X', app: true,
    title: 'Chain It Together',
    concept: 'Combining recon + broken access control into one attack path.',
    brief: 'No single trick opens the inner vault. You’ll need what recon reveals AND the role-cookie flaw, together.',
    objective: 'Find the hidden admin path from recon, become admin via the cookie flaw, and reach the inner vault for the key.',
    hints: [
      'Recon first: robots.txt lists more than the backup — there is an admin path too.',
      'That path’s inner vault is admin-only. Reuse the trick from the role-cookie room.',
      'curl --cookie "role=admin" http://localhost:8080/keep-admin/vault',
    ],
    debrief: 'Real intrusions chain small flaws: a disclosed path plus a trust bug becomes full access. Defense means closing the chain at every link, not just the obvious one.',
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]))
