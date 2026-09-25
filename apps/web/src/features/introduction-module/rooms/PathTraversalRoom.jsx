import { useState } from 'react';
import RoomShell from '../components/RoomShell';

function Hint({ children }) {
  return <span className="im-hint">{children}</span>;
}
function Code({ children }) {
  return <code className="im-code">{children}</code>;
}

const NORMAL_FILES = ['brochure.pdf', 'pricing.pdf', 'warranty.pdf'];
const INITIAL_DIALOGUE = (
  <>
    Acme's docs page downloads whatever filename you give it. Try it with a real one first.{' '}
    <Hint>brochure.pdf</Hint>
  </>
);
const INITIAL_MECH =
  "A download tool like this usually just glues your filename onto a folder path on the server and opens whatever's there. It's built assuming you'll only ever ask for the files it meant to offer you.";

export default function PathTraversalRoom() {
  const [input, setInput] = useState('brochure.pdf');
  const [output, setOutput] = useState(null);
  const [flagShown, setFlagShown] = useState(false);
  const [triedNormal, setTriedNormal] = useState(false);
  const [dialogue, setDialogue] = useState(INITIAL_DIALOGUE);
  const [mech, setMech] = useState(INITIAL_MECH);

  function reset() {
    setInput('brochure.pdf'); setOutput(null); setFlagShown(false); setTriedNormal(false);
    setDialogue(INITIAL_DIALOGUE); setMech(INITIAL_MECH);
  }

  function hint() {
    setInput(triedNormal ? '../../config/db_credentials.txt' : 'brochure.pdf');
  }

  function download() {
    const val = input.trim();
    if (NORMAL_FILES.includes(val)) {
      setTriedNormal(true);
      setOutput({ ok: true, text: `Downloaded ${val} — Acme Widgets product literature.` });
      setDialogue(
        <>
          That worked exactly as intended. But nothing checked that "brochure.pdf" was the only kind of filename
          allowed. <Hint>What if you ask for a file outside this folder — try: ../secret.txt</Hint>
        </>
      );
      return;
    }
    const upCount = (val.match(/\.\.\//g) || []).length;
    if (upCount === 0) {
      setOutput({ ok: false, text: `404 — no file named "${val}" on this server.` });
      return;
    }
    if (upCount === 1) {
      setOutput({ ok: false, text: 'Permission denied — that only steps up one folder, and there\'s nothing sensitive right there.' });
      setDialogue(
        <>
          Close — <Code>../</Code> once only moves up a single folder. Older, more sensitive files live further
          back than that. <Hint>Try going up twice: ../../config/db_credentials.txt</Hint>
        </>
      );
      return;
    }
    setFlagShown(true);
    setOutput({
      ok: true,
      text: `Downloaded ${val} —\n\nDB_HOST=internal-db.acme.local\nDB_USER=svc_billing\nDB_PASS=Tr0ub4dor&3\n\nFLAG{tw0_d0ts_tw1ce}`,
    });
    setDialogue(
      "Two levels up was enough to leave the folder this tool was ever meant to serve files from, and land on a config file with real database credentials in it."
    );
    setMech(
      <>
        This is path traversal: <Code>../</Code> is a normal filesystem instruction meaning "go up one directory,"
        and if a server builds a file path by gluing your input onto a base folder without checking the result, you
        can walk it right out of that folder. The fix is to resolve the final path and reject anything that lands
        outside the intended directory — not to just filter out the string <Code>../</Code>, which has plenty of
        encodings and workarounds.
      </>
    );
  }

  return (
    <RoomShell
      caseLabel="CASE 0417 — SCENE 8"
      title='The "../../" folder'
      subtitle="Fake browser · a file-download field with no boundary check"
      dialogue={dialogue}
      mech={mech}
      onHint={hint}
      onReset={reset}
      pageTitle="acmewidgets.co/docs"
      flag="FLAG{tw0_d0ts_tw1ce}"
      flagShown={flagShown}
    >
      <div className="im-browser">
        <div className="im-addr-row">
          <div className="im-dots"><span></span><span></span><span></span></div>
          <div className="im-addr-bar">acmewidgets.co/docs/download</div>
        </div>
        <div className="im-page">
          <h2 className="im-page-h2">Documentation downloads</h2>
          <p>Available: brochure.pdf, pricing.pdf, warranty.pdf</p>
          <div className="im-gform" style={{ maxWidth: 340 }}>
            <label className="im-form-label">File to download</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') download(); }}
              style={{ width: '100%', padding: '8px 9px', border: '1px solid #d3d6dc', borderRadius: 6, fontSize: 13, fontFamily: "'IBM Plex Mono',monospace" }}
            />
            <button className="im-post-btn" type="button" onClick={download}>Download</button>
          </div>
          {output && (
            <pre className="im-pre" style={{ marginTop: 16, color: output.ok ? '#14161c' : '#a33b34' }}>
              {output.text}
            </pre>
          )}
        </div>
      </div>
    </RoomShell>
  );
}
