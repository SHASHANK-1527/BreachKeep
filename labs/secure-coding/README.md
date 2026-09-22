# Secure Coding Dungeon (Blue team)
Each room gives the student the Trading Post source (../web) with ONE vulnerability
to fix. On "Submit fix", the harness reruns the original exploit AND a functional
test. The room clears only when the exploit now fails and the app still works.

Rooms (spec section 8.5 / curriculum Class 5):
  secure-sqli   -> parameterise the login query
  secure-xss    -> encode output in /search
  secure-idor   -> add ownership check to /order
  secure-client -> re-derive price server-side in /checkout
  ...plus hash-password, hide-secret, lock-door, rate-limit, validate-upload, full-review
