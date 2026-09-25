import { useState } from 'react';
import RoomShell from '../components/RoomShell';

function Hint({ children }) {
  return <span className="im-hint">{children}</span>;
}

const OWN_ID = '1042';
const INITIAL_DIALOGUE = (
  <>
    This is your invoice from Acme's billing portal, at <code className="im-code">/invoices/1042</code>. Nothing
    wrong with looking at your own invoice — <Hint>but try changing that number in the address bar.</Hint>
  </>
);
const INITIAL_MECH =
  "Most apps check that you're logged in before showing an invoice — far fewer check that the invoice actually belongs to you. If the only thing standing between you and someone else's record is a number in the URL, that's the whole vulnerability.";

export default function IdorRoom() {
  const [currentId, setCurrentId] = useState(OWN_ID);
  const [addr, setAddr] = useState(OWN_ID);
  const [status, setStatus] = useState('own'); // own | stranger | notfound
  const [dialogue, setDialogue] = useState(INITIAL_DIALOGUE);
  const [mech, setMech] = useState(INITIAL_MECH);

  function reset() {
    setCurrentId(OWN_ID); setAddr(OWN_ID); setStatus('own');
    setDialogue(INITIAL_DIALOGUE); setMech(INITIAL_MECH);
  }

  function go(id) {
    const clean = id.trim();
    setCurrentId(clean);
    if (clean === OWN_ID) {
      setStatus('own');
      setDialogue(<>That's still your own invoice. Try a different number — any other one in the system. <Hint>e.g. 1043</Hint></>);
      return;
    }
    if (/^\d{4}$/.test(clean)) {
      setStatus('stranger');
      setDialogue("That's not your account, and nothing stopped you from loading it — no password, no extra check, just a different number.");
      setMech(
        "This class of bug is called an insecure direct object reference (IDOR): the app used a plain, guessable ID to fetch a record and never re-checked ownership server-side. The fix is a server-side check on every request — \"does this invoice belong to this logged-in user?\" — not hiding the ID better or making it less guessable."
      );
      return;
    }
    setStatus('notfound');
    setDialogue(<>Nothing at that address. Invoice IDs here look like 4-digit numbers — try one close to your own. <Hint>e.g. 1043</Hint></>);
  }

  function hint() { setAddr('1043'); go('1043'); }

  return (
    <RoomShell
      caseLabel="CASE 0417 — SCENE 7"
      title="Somebody else's invoice"
      subtitle="Fake browser · edit the address bar directly"
      dialogue={dialogue}
      mech={mech}
      onHint={hint}
      onReset={reset}
      pageTitle="acmewidgets.co billing"
      flag="FLAG{just_ch4ng3_th3_1d}"
      flagShown={status === 'stranger'}
    >
      <div className="im-browser">
        <div className="im-addr-row">
          <div className="im-dots"><span></span><span></span><span></span></div>
          <input
            className="im-addr-input"
            value={`acmewidgets.co/invoices/${addr}`}
            onChange={(e) => setAddr(e.target.value.replace(/^.*\/invoices\//, ''))}
            onKeyDown={(e) => { if (e.key === 'Enter') go(addr); }}
          />
          <button className="im-go-btn" type="button" onClick={() => go(addr)}>Go</button>
        </div>
        <div className="im-page">
          {status === 'own' && (
            <div className="im-invoice-card">
              <h3 className="im-login-title">Invoice #1042</h3>
              <p>Billed to: you (student@acmewidgets-demo)</p>
              <p>Amount: $86.00 — Widget maintenance plan</p>
              <p>Card: ending 4417</p>
            </div>
          )}
          {status === 'stranger' && (
            <div className="im-invoice-card">
              <h3 className="im-login-title">Invoice #{currentId}</h3>
              <p>Billed to: Kavya R. (kavya.r@example.com)</p>
              <p>Amount: $1,240.00 — Bulk widget order</p>
              <p>Card: ending 9098</p>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", marginTop: 12 }}>FLAG&#123;just_ch4ng3_th3_1d&#125;</p>
            </div>
          )}
          {status === 'notfound' && (
            <div className="im-invoice-card">
              <h3 className="im-login-title">404</h3>
              <p>No invoice at that ID.</p>
            </div>
          )}
        </div>
      </div>
    </RoomShell>
  );
}
