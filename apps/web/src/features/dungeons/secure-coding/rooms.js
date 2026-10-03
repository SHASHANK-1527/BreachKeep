// Secure Coding "The Forge" dungeon — fix the Trading Post (blue team). Each
// room opens server.js in an in-browser editor (editor: true); a Save/Run calls
// the room's grader, which reruns the exploit + a functional test and reveals
// the flag only when the exploit fails AND the app still works.

export const DUNGEON_ID = 'secure-coding'
export const DUNGEON_TITLE = 'The Forge'
export const DUNGEON_BLURB =
  'Now defend. Fix the same flaws you learned to exploit — each clears only when the attack fails and the app still works.'

export const TIERS = {
  mandatory: { label: 'Mandatory', note: 'Clear all of these to unlock the medium rooms.' },
  medium: { label: 'Medium', note: 'Unlocks after every mandatory room is cleared.' },
  hard: { label: 'Hard', note: 'Unlocks after 2 of the 3 medium rooms are cleared.' },
}

export const ROOMS = [
  {
    id: 'secure-sqli', tier: 'mandatory', num: 'I', editor: true,
    title: 'Parameterize the Login',
    concept: 'Fix SQL injection with prepared statements.',
    brief: 'The login glues username/password straight into a SQL string. Close the injection without breaking real logins.',
    objective: 'Edit the login so admin\'-- no longer gets in, but admin / super-secret-pw still does. Then Run checks.',
    hints: [
      'The query is built by string concatenation — your input becomes part of the SQL.',
      'Use a parameterized query: pass username/password as bound values, not inside the string.',
      'db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password)',
    ],
    debrief: 'Parameterized queries send input as data, never as code — the single most important fix against SQL injection.',
  },
  {
    id: 'secure-xss', tier: 'mandatory', num: 'II', editor: true,
    title: 'Encode the Output',
    concept: 'Fix reflected XSS by encoding output.',
    brief: 'The search page drops your query into HTML unescaped, so a <script> runs. Encode it so it shows as text.',
    objective: 'Make /search render the query as text (no executing <script>), while still showing the words. Run checks.',
    hints: [
      'The problem is output, not input: you are inserting raw user text into HTML.',
      'HTML-encode the query before putting it in the response: & < > " \' become entities.',
      'Replace special chars (e.g. a small escape function) so <script> renders as &lt;script&gt;.',
    ],
    debrief: 'Output encoding is the core XSS defense: treat everything from the user as text to display, never as HTML to execute.',
  },
  {
    id: 'secure-idor', tier: 'mandatory', num: 'III', editor: true,
    title: 'Check Ownership',
    concept: 'Fix IDOR by enforcing per-object ownership.',
    brief: 'The order endpoint returns any id to anyone. The request identifies the user with a uid cookie — use it.',
    objective: 'Only let the owner read an order (uid cookie must match the order\'s owner); return 403 otherwise. Run checks.',
    hints: [
      'The handler looks up the row by id but never checks who is asking.',
      'The requester is in req.cookies.uid; each order row has an owner field.',
      'After fetching the row: if (row.owner !== req.cookies.uid) return res.status(403)...',
    ],
    debrief: 'Authentication is not authorization. Every object lookup must verify the caller is allowed THIS record — not just that they are logged in.',
  },
  {
    id: 'secure-client', tier: 'mandatory', num: 'IV', editor: true,
    title: 'Don’t Trust the Price',
    concept: 'Fix client-side trust by validating/deriving server-side.',
    brief: 'Checkout accepts whatever price the request sends — including 0. Stop trusting the client’s number.',
    objective: 'Reject a non-positive price (a free order must not go through), while a normal positive price still works. Run checks.',
    hints: [
      'The server uses Number(req.body.price) directly and treats <= 0 as a free order.',
      'Never trust a client-supplied amount. At minimum, reject anything not greater than 0.',
      'if (!(price > 0)) return res.status(400).send(...)  (ideally look the price up server-side).',
    ],
    debrief: 'Any value the client can send, the client can change. Prices, totals and quantities must be validated or re-derived on the server.',
  },
  {
    id: 'secure-headers', tier: 'medium', num: 'V', editor: true,
    title: 'Set the Guards',
    concept: 'Add basic security response headers.',
    brief: 'Responses ship with no protective headers, leaving browsers to guess content types and allow framing.',
    objective: 'Send X-Content-Type-Options: nosniff and an X-Frame-Options header on responses. Run checks.',
    hints: [
      'Browsers behave more safely when you tell them to: MIME-sniffing off, framing restricted.',
      'Add a middleware (app.use) that sets the headers on every response.',
      'res.set("X-Content-Type-Options","nosniff"); res.set("X-Frame-Options","DENY")',
    ],
    debrief: 'Security headers are cheap, high-value defense-in-depth: nosniff stops MIME confusion, X-Frame-Options blocks clickjacking.',
  },
  {
    id: 'secure-rate-limit', tier: 'medium', num: 'VI', editor: true,
    title: 'Slow the Brute Force',
    concept: 'Rate-limit the login endpoint.',
    brief: 'The login accepts unlimited guesses as fast as they come — perfect for brute forcing. Put a ceiling on it.',
    objective: 'After enough attempts, the login must start returning 429; a first, normal attempt must not be blocked. Run checks.',
    hints: [
      'Count attempts (e.g. per IP) and refuse once they cross a threshold.',
      'Keep a simple in-memory counter keyed by req.ip; increment on each login call.',
      'if (count > 10) return res.status(429).send("Too many attempts")  (before checking creds).',
    ],
    debrief: 'Rate limiting turns an instant password-guessing attack into an impractical one. Real apps also add backoff, lockouts and monitoring.',
  },
  {
    id: 'secure-hide-secret', tier: 'medium', num: 'VII', editor: true,
    title: 'Un-hardcode the Secret',
    concept: 'Remove a hardcoded secret and stop leaking it.',
    brief: 'An API key is hardcoded in the source and echoed by /config. Secrets do not belong in code or in responses.',
    objective: 'Make /config stop exposing the hardcoded key (read config from the environment instead). Run checks.',
    hints: [
      'The literal key sits in the source and is returned by the /config endpoint.',
      'Secrets come from the environment (process.env), not source — and should not be sent to clients at all.',
      'Drop the hardcoded value and the line that returns it; read from process.env if you need it.',
    ],
    debrief: 'Hardcoded secrets leak through source control and endpoints. Keep them in the environment / a secret store, and never return them to clients.',
  },
  {
    id: 'secure-full-review', tier: 'hard', num: 'VIII', editor: true,
    title: 'Full Review',
    concept: 'Fix SQLi, XSS, IDOR and price-trust together.',
    brief: 'A release review: all four core flaws must be closed in one pass, and the app must still work end to end.',
    objective: 'Fix the login (SQLi), /search (XSS), /order (IDOR) and /checkout (price) so every check passes at once. Run checks.',
    hints: [
      'This is the four mandatory fixes combined — do them all in the one file.',
      'Parameterize the query, encode the search output, check order ownership, reject non-positive prices.',
      'Run the checks to see which of the four still fail, and fix those.',
    ],
    debrief: 'Real hardening is holistic: one missed flaw undoes the rest. A review pass fixes every known issue and proves the app still functions.',
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]))
