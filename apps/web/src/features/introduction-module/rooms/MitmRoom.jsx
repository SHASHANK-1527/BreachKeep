import { useState } from 'react';
import { reportComplete } from '../reportComplete.js';
import RoomShell from '../components/RoomShell';

function Hint({ children }) {
  return <span className="im-hint">{children}</span>;
}

const PACKETS = [
  { id: 1, proto: 'https', label: 'TLS 1.3 → mail.google.com' },
  { id: 2, proto: 'https', label: 'TLS 1.3 → api.spotify.com' },
  { id: 3, proto: 'http', label: 'HTTP POST → legacy-support.acmewidgets.co/login' },
  { id: 4, proto: 'https', label: 'TLS 1.3 → cdn.acmewidgets.co' },
  { id: 5, proto: 'https', label: 'TLS 1.3 → fonts.googleapis.com' },
];

const INITIAL_DIALOGUE = (
  <>
    You're on the same coffee-shop wifi as someone logging into Acme's old support portal — the one that never
    got migrated to HTTPS. <Hint>Start the capture and see what's flying across the network.</Hint>
  </>
);
const INITIAL_MECH =
  'HTTPS (TLS) encrypts traffic between a browser and a server, so anyone else on the network — including you here — only sees scrambled noise. Plain HTTP sends everything as readable text. Public wifi puts you on the same network as everyone else using it, which is exactly what makes that difference matter.';

export default function MitmRoom() {
  const [stage, setStage] = useState('idle'); // idle -> capturing -> done
  const [dialogue, setDialogue] = useState(INITIAL_DIALOGUE);
  const [mech, setMech] = useState(INITIAL_MECH);

  function reset() {
    setStage('idle');
    setDialogue(INITIAL_DIALOGUE);
    setMech(INITIAL_MECH);
  }

  function startCapture() {
    setStage('capturing');
    setDialogue(
      <>
        Most of this is TLS-encrypted — gibberish to you without a private key you don't have. But one of these
        rows isn't. <Hint>Find the plain HTTP request and open it.</Hint>
      </>
    );
  }

  function openPacket(p) {
    if (p.proto !== 'http') return;
    setStage('done'); reportComplete('coffee-shop-wifi');
    setDialogue(
      "There it is — a full username and password, sent in the clear, readable by anyone else sharing this network."
    );
    setMech(
      'This is exactly why "just use public wifi carefully" isn\'t really a defense — the fix has to be on the server: force HTTPS everywhere, and never let a login form submit over plain HTTP. As the person on the network, there was nothing wrong with what you did; the site made this readable by not encrypting it.'
    );
  }

  function hint() {
    if (stage === 'idle') { startCapture(); return; }
    if (stage === 'capturing') { openPacket(PACKETS.find((p) => p.proto === 'http')); return; }
  }

  return (
    <RoomShell
      caseLabel="CASE 0417 — SCENE 4"
      title="The coffee shop wifi"
      subtitle="Packet capture · start it, then open the one request that isn't encrypted"
      dialogue={dialogue}
      mech={mech}
      onHint={hint}
      onReset={reset}
      pageTitle="Capture — coffeeshop-guest"
      flag="FLAG{pl41ntext_http_sn1ff3d}"
      flagShown={stage === 'done'}
    >
      <div className="im-browser">
        <div className="im-addr-row">
          <div className="im-dots"><span></span><span></span><span></span></div>
          <div className="im-addr-bar">interface: wlan0 · filter: none</div>
        </div>
        <div className="im-page">
          {stage === 'idle' && (
            <>
              <h2 className="im-page-h2">Packet capture</h2>
              <p>Nothing captured yet.</p>
              <button className="im-post-btn" type="button" onClick={startCapture}>Start capture</button>
            </>
          )}
          {stage !== 'idle' && (
            <div className="im-packet-list">
              {PACKETS.map((p) => (
                <div
                  key={p.id}
                  className={`im-packet ${p.proto === 'https' ? 'im-packet-locked' : 'im-packet-open'}`}
                  onClick={() => openPacket(p)}
                >
                  <span className="im-packet-icon">{p.proto === 'https' ? '🔒' : '⚠'}</span>
                  <span>{p.label}</span>
                </div>
              ))}
              {stage === 'done' && (
                <pre className="im-pre" style={{ marginTop: 14 }}>
{`POST /login HTTP/1.1
Host: legacy-support.acmewidgets.co
Content-Type: application/x-www-form-urlencoded

username=support_intern&password=Summer2024!`}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </RoomShell>
  );
}
