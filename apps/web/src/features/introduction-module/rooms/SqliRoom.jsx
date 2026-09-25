import { useState } from 'react';
import RoomShell from '../components/RoomShell';

function Hint({ children }) {
  return <span className="im-hint">{children}</span>;
}
function Code({ children }) {
  return <code className="im-code">{children}</code>;
}

const DIALOGUE = {
  home: (
    <>
      This is Acme's public site. Before poking around by hand, check what it's telling search engines <i>not</i>{' '}
      to index. <Hint>Visit /robots.txt</Hint>
    </>
  ),
  robots: (
    <>
      That's an oddly specific thing to hide for a site that "just sells widgets." <Hint>Go look: /portal-8f2c</Hint>
    </>
  ),
  admin: (
    <>
      An admin login, with no link to it anywhere on the real site. This kind of form usually drops your input
      straight into a database query. <Hint>Username: ' OR '1'='1 — any password</Hint>
    </>
  ),
  done: "That worked because the login query trusted your text instead of checking it — your input made the query true for every row in the table.",
};

const MECH = {
  home: "robots.txt is a plain text file almost every website publishes to tell automated crawlers which pages to skip. It's a request, not a lock — anyone can read it. Developers sometimes list sensitive paths there by mistake, pointing right at what they meant to hide.",
  robots: 'A "Disallow" entry is a polite request aimed at well-behaved bots — it has no actual security effect. Anyone who reads the file can see exactly what it\'s pointing at, which is why this is called "security through obscurity": hiding something without restricting access to it.',
  admin: (
    <>
      A typical login check looks something like <Code>SELECT * FROM users WHERE user='&lt;input&gt;' AND pass='...'</Code>.
      If your input contains its own quote mark, you can end that string early and add your own condition —{' '}
      <Code>' OR '1'='1</Code> makes the check true no matter what.
    </>
  ),
  done: 'This bug class is called SQL injection. The fix is almost always the same: never build a query by pasting text into a string. Use parameterised queries / prepared statements instead, which treat input as pure data and never as part of the command.',
};

export default function SqliRoom() {
  const [stage, setStage] = useState('home');
  const [user, setUser] = useState('');
  const [filled, setFilled] = useState(false);
  const [err, setErr] = useState(false);

  function reset() {
    setStage('home'); setUser(''); setErr(false); setFilled(false);
  }
  function hint() {
    if (stage === 'home') setStage('robots');
    else if (stage === 'robots') setStage('admin');
    else if (stage === 'admin') {
      setUser("' OR '1'='1");
      setFilled(true);
      setTimeout(() => setFilled(false), 1200);
    }
  }
  function submit() {
    if (user.includes("' OR '1'='1")) { setStage('done'); setErr(false); }
    else setErr(true);
  }

  return (
    <RoomShell
      caseLabel="CASE 0417 — SCENE 2"
      title="The page that shouldn't exist"
      subtitle="Fake browser · click and type as you would on a real site"
      dialogue={DIALOGUE[stage]}
      mech={MECH[stage]}
      onHint={hint}
      onReset={reset}
      pageTitle="acmewidgets.co"
      flag="FLAG{r0b0ts_txt_g1ves_1t_away}"
      flagShown={stage === 'done'}
    >
      <div className="im-browser">
        <div className="im-addr-row">
          <div className="im-dots"><span></span><span></span><span></span></div>
          <div className="im-addr-bar">
            {stage === 'home' && 'acmewidgets.co/'}
            {stage === 'robots' && 'acmewidgets.co/robots.txt'}
            {stage === 'admin' && 'acmewidgets.co/portal-8f2c/login'}
            {stage === 'done' && 'acmewidgets.co/portal-8f2c/dashboard'}
          </div>
        </div>
        <div className="im-page">
          {stage === 'home' && (
            <>
              <h2 className="im-page-h2">Acme Widgets</h2>
              <p>We make widgets. Contact us for a quote.</p>
              <p><a className="im-plink" onClick={() => setStage('robots')}>robots.txt</a></p>
            </>
          )}
          {stage === 'robots' && (
            <>
              <pre className="im-pre">{'User-agent: *\nDisallow: /portal-8f2c/'}</pre>
              <p><a className="im-plink" onClick={() => setStage('admin')}>/portal-8f2c</a></p>
            </>
          )}
          {stage === 'admin' && (
            <div className="im-login-box">
              <h3 className="im-login-title">Admin portal</h3>
              <label className="im-form-label">Username</label>
              <input
                className={filled ? 'im-filled' : ''}
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
              <label className="im-form-label">Password</label>
              <input type="password" />
              <button className="im-login-btn" onClick={submit} type="button">Log in</button>
              {err && <div className="im-err im-show">Invalid credentials — that input didn't break anything.</div>}
            </div>
          )}
          {stage === 'done' && (
            <>
              <h3 className="im-page-h2">Welcome, admin</h3>
              <p>Authentication bypassed. Session opened without a valid password.</p>
              <p className="im-flag-echo">FLAG&#123;r0b0ts_txt_g1ves_1t_away&#125;</p>
            </>
          )}
        </div>
      </div>
    </RoomShell>
  );
}
