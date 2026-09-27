import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Instructor demo - "The unpatched wing".
 *
 * Not one of the nine scenes: it is not in INTRO_ROOMS, it issues no flag and it
 * records nothing. It exists to be projected in class. Where the nine scenes are
 * scripted teasers that recognise a payload, everything here is genuinely
 * exploitable inside the browser tab:
 *
 *  - the login runs a real (tiny) SQL evaluator over a string-concatenated
 *    query, so any working injection works and a broken one raises a parse
 *    error, exactly as a real database would;
 *  - the vault trusts a client-held role token, which the student edits;
 *  - the search box reflects input unescaped into a sandboxed iframe, so a
 *    payload actually executes in front of the class.
 *
 * Nothing here talks to the API, and the iframe is sandboxed without
 * allow-same-origin, so the executing payload cannot reach the real app, its
 * cookies or its session.
 */

const USERS = [
  { id: 1, username: 'warden', password: 'l4nt3rn-k3ys', role: 'admin' },
  { id: 2, username: 'cadet', password: 'firstlight', role: 'user' },
];

/* ---------------------------------------------------------------------------
 * A deliberately naive SQL subset: SELECT ... WHERE <predicates>.
 * Enough to be honestly injectable - tautologies, -- comments, and a real
 * parse error on malformed input.
 * ------------------------------------------------------------------------- */

function stripComments(where) {
  const cut = where.indexOf('--');
  return cut === -1 ? where : where.slice(0, cut);
}

function readOperand(raw, row) {
  const tok = raw.trim();
  if (!tok) throw new Error('empty operand');
  if (tok.includes("'")) {
    // A quoted literal, and nothing else: an odd number of quotes means the
    // student left a string open, which is exactly the error a real engine gives.
    if (!tok.startsWith("'") || !tok.endsWith("'") || tok.length < 2 || (tok.match(/'/g) || []).length !== 2) {
      throw new Error(`unterminated string near ${tok}`);
    }
    return tok.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(tok)) return tok;
  if (/^[a-z_][a-z0-9_]*$/i.test(tok)) {
    if (!(tok in row)) throw new Error(`unknown column '${tok}'`);
    return String(row[tok]);
  }
  throw new Error(`cannot parse ${tok}`);
}

function evalPredicate(pred, row) {
  const parts = pred.split('=');
  if (parts.length !== 2) throw new Error(`syntax error near ${pred.trim() || "''"}`);
  return readOperand(parts[0], row) === readOperand(parts[1], row);
}

// OR binds loosest, AND tighter - the same precedence a real engine uses, which
// is why the tautology has to go in the *last* condition to pay off.
function evalWhere(where, row) {
  return stripComments(where)
    .split(/\s+OR\s+/i)
    .some((group) =>
      group
        .split(/\s+AND\s+/i)
        .every((pred) => evalPredicate(pred, row)),
    );
}

function runQuery(where) {
  for (const row of USERS) {
    if (evalWhere(where, row)) return row;
  }
  return null;
}

/* ------------------------------------------------------------------------- */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function DemoVulnRoom() {
  /* --- 1. SQL injection ---------------------------------------------- */
  const [username, setUsername] = useState('cadet');
  const [password, setPassword] = useState('wrong-guess');
  const [loginOut, setLoginOut] = useState(null);

  const query = useMemo(
    () => `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`,
    [username, password],
  );

  function login() {
    const where = query.slice(query.indexOf('WHERE') + 6);
    let out;
    try {
      const row = runQuery(where);
      out = row
        ? { hit: true, text: `${query}\n\n-> 1 row\nSigned in as ${row.username} (role: ${row.role})` }
        : { hit: false, text: `${query}\n\n-> 0 rows\nInvalid credentials.` };
    } catch (e) {
      out = { hit: false, text: `${query}\n\nQuery error: ${e.message}` };
    }
    setLoginOut(out);
  }

  /* --- 2. Client-trusted role --------------------------------------- */
  const [roleToken, setRoleToken] = useState('user');
  const [vaultOut, setVaultOut] = useState(null);

  function openVault() {
    // The whole bug: the check reads a value the client controls.
    setVaultOut(
      roleToken.trim() === 'admin'
        ? { hit: true, text: 'GET /vault -> 200\n\nWelcome, warden. Ledger, keys and roster are yours.' }
        : { hit: false, text: `GET /vault -> 403\n\nMembers only. (role = ${roleToken || 'unset'})` },
    );
  }

  /* --- 3. Reflected XSS -------------------------------------------- */
  const [term, setTerm] = useState('<img src=x onerror="document.body.innerHTML=\'&lt;h2&gt;this ran&lt;/h2&gt;\'">');
  const [escaped, setEscaped] = useState(false);
  const [reflected, setReflected] = useState(null);

  function search() {
    const body = escaped ? escapeHtml(term) : term;
    setReflected(
      `<!doctype html><meta charset="utf-8">` +
        `<body style="margin:0;padding:10px;font:13px/1.5 system-ui;background:#0d0f14;color:#dfe6ee">` +
        `<h1 style="font-size:15px;margin:0 0 6px">Results for ${body}</h1>` +
        `<p style="margin:0;opacity:.6">No matches.</p></body>`,
    );
  }

  function resetAll() {
    setUsername('cadet');
    setPassword('wrong-guess');
    setLoginOut(null);
    setRoleToken('user');
    setVaultOut(null);
    setEscaped(false);
    setReflected(null);
  }

  return (
    <div className="im-room-view">
      <div className="im-brief">
        <div className="im-case-tag">Instructor demo</div>
        <h2 className="im-brief-title">The unpatched wing</h2>
        <div className="im-sub">Three real bugs, running in this tab. No flag, no score.</div>
        <div className="im-dialogue">
          The nine scenes are staged: they recognise the payload you were nudged towards. This wing is
          not. The login below builds its query by gluing your text into a string and hands it to a
          small evaluator, so the injection you invent is the injection that runs &mdash; and a malformed
          one gives you a parse error to work from. Drive it on the projector, then ask the room to
          predict the next result before you click.
        </div>
        <div className="im-dialogue-mech">
          <span className="im-mech-label">How this works</span>
          Every bug here is the same shape: a value the attacker controls is treated as something the
          program trusts &mdash; as query syntax, as an authorisation decision, as markup. The fix is never
          a longer blocklist; it is keeping data and code apart at the boundary.
        </div>
        <button className="im-btn im-teal im-outline im-small im-hint-btn" onClick={resetAll} type="button">
          Reset all three
        </button>
      </div>

      <div className="im-stage">
        <div className="im-stage-head">
          <h1 className="im-stage-title">Acme Trading Post &mdash; staging</h1>
          <div className="im-actions">
            <Link className="im-btn im-ghost im-small" to="/dashboard/introduction">
              &larr; All challenges
            </Link>
          </div>
        </div>

        <div className="im-demo-banner">
          <span className="im-demo-tag">Demo only</span>
          <p>
            Deliberately vulnerable, and sandboxed: nothing here reaches the API, your session or
            anyone else&rsquo;s account. It awards no flag and does not count toward the nine.
          </p>
        </div>

        <div className="im-demo-grid">
          {/* 1 */}
          <section className="im-demo-card">
            <h3>1 &middot; Staff login &mdash; SQL injection</h3>
            <p>
              Try <code>warden</code> with any password. Then try to get in as the warden without
              knowing it. Watch which field the tautology has to go in.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login();
              }}
            >
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                spellCheck={false}
                autoComplete="off"
                aria-label="Demo username"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                spellCheck={false}
                autoComplete="off"
                aria-label="Demo password"
              />
              <button className="im-btn im-small" type="submit">
                Log in
              </button>
            </form>
            <pre className="im-demo-src">
              const q = <b>{'`... WHERE username = \'${username}\' AND password = \'${password}\'`'}</b>;{'\n'}
              db.prepare(q).get()
            </pre>
            {loginOut && (
              <pre className={`im-demo-out ${loginOut.hit ? 'im-demo-hit' : ''}`}>{loginOut.text}</pre>
            )}
          </section>

          {/* 2 */}
          <section className="im-demo-card">
            <h3>2 &middot; The vault &mdash; broken access control</h3>
            <p>
              The server decides who you are by reading a value your own browser sent. Edit it and ask
              again.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                openVault();
              }}
            >
              <input
                value={roleToken}
                onChange={(e) => setRoleToken(e.target.value)}
                placeholder="role cookie"
                spellCheck={false}
                autoComplete="off"
                aria-label="Demo role cookie"
              />
              <button className="im-btn im-small" type="submit">
                GET /vault
              </button>
            </form>
            <pre className="im-demo-src">
              {'app.get(\'/vault\', (req, res) => {\n  if ('}<b>{'req.cookies.role === \'admin\''}</b>
              {') return res.send(SECRET)\n  res.status(403).send(\'Members only\')\n})'}
            </pre>
            {vaultOut && (
              <pre className={`im-demo-out ${vaultOut.hit ? 'im-demo-hit' : ''}`}>{vaultOut.text}</pre>
            )}
          </section>

          {/* 3 */}
          <section className="im-demo-card">
            <h3>3 &middot; Search &mdash; reflected XSS</h3>
            <p>
              The result heading is built by pasting your term straight into HTML. The frame below is
              sandboxed, so the payload runs where it can do no harm. Tick the box to apply the fix and
              run the same payload again.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="search term"
                spellCheck={false}
                autoComplete="off"
                aria-label="Demo search term"
              />
              <button className="im-btn im-small" type="submit">
                Search
              </button>
            </form>
            <label className="im-demo-fix">
              <input
                type="checkbox"
                checked={escaped}
                onChange={(e) => setEscaped(e.target.checked)}
              />{' '}
              Escape the output (the fix)
            </label>
            <pre className="im-demo-src">
              res.send(`&lt;h1&gt;Results for <b>{escaped ? '${escapeHtml(q)}' : '${q}'}</b>&lt;/h1&gt;`)
            </pre>
            {reflected && (
              <iframe
                className="im-demo-frame"
                title="Reflected search results (sandboxed)"
                sandbox="allow-scripts"
                srcDoc={reflected}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
