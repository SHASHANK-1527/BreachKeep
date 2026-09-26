import { useState } from 'react';
import { reportComplete } from '../reportComplete.js';
import RoomShell from '../components/RoomShell';

function Hint({ children }) {
  return <span className="im-hint">{children}</span>;
}

const NODES = {
  start: {
    agent: "Acme IT Helpdesk, this is Priya — can I get your employee ID to pull up your account?",
    options: [
      { id: 'confident', label: "\"I'm actually the new regional sales director — don't have it memorized yet, and I've got a client call in ten minutes.\"", next: 'verify' },
      { id: 'weak', label: "\"Uh, I don't really know it — can you just reset my password?\"", next: 'fail_weak' },
      { id: 'fake', label: "\"It's 1234.\"", next: 'fail_fake' },
    ],
  },
  verify: {
    agent: "Oh, welcome aboard! One more thing before I reset it — who's your manager?",
    options: [
      { id: 'specific', label: "\"Rob Alvarez — he's regional, reports up to Diane in the Denver office.\"", next: 'success' },
      { id: 'vague', label: "\"I don't know off the top of my head, can we skip that?\"", next: 'fail_vague' },
    ],
  },
  success: {
    agent: "Great, that matches what's in our system. Resetting your password now — temporary one just went to your email. You're all set!",
    options: [],
  },
  fail_weak: {
    agent: "I can't reset anything without verifying identity first — I'll need to open a ticket instead, sorry.",
    options: [],
  },
  fail_fake: {
    agent: "That ID doesn't match anything in our system. I'm going to have to escalate this call.",
    options: [],
  },
  fail_vague: {
    agent: "Without that confirmation I can't proceed over the phone — please go through the ticket system instead.",
    options: [],
  },
};

const INITIAL_DIALOGUE = (
  <>
    You're calling Acme's helpdesk pretending to be a locked-out employee. No exploit here — just be confident and
    specific enough that verification feels like a formality. <Hint>Pick how you open the call.</Hint>
  </>
);
const INITIAL_MECH =
  "Social engineering targets people and process, not code. It works because urgency and confident, specific-sounding detail (a real title, a real-sounding manager name) make a request feel routine, and verification steps get skipped under that pressure. There's no patch for this — only process that holds even when someone claims authority or urgency.";

export default function SocialEngineeringRoom() {
  const [nodeId, setNodeId] = useState('start');
  const [transcript, setTranscript] = useState([{ from: 'agent', text: NODES.start.agent }]);
  const [dialogue, setDialogue] = useState(INITIAL_DIALOGUE);
  const [mech, setMech] = useState(INITIAL_MECH);

  const success = nodeId === 'success';
  const failed = nodeId.startsWith('fail_');

  function reset() {
    setNodeId('start');
    setTranscript([{ from: 'agent', text: NODES.start.agent }]);
    setDialogue(INITIAL_DIALOGUE);
    setMech(INITIAL_MECH);
  }

  function choose(opt) {
    const nextNode = NODES[opt.next];
    setTranscript((t) => [...t, { from: 'you', text: opt.label.replace(/^"|"$/g, '') }, { from: 'agent', text: nextNode.agent }]);
    setNodeId(opt.next);
    if (opt.next === 'success') {
      reportComplete('phone-call');
      setDialogue("That's the whole scene — a real-sounding title, a small amount of urgency, and one specific-sounding detail was enough to skip verification entirely.");
    } else if (opt.next.startsWith('fail_')) {
      setDialogue(<>That got the call escalated instead of resolved. <Hint>Reset the scene and try a more confident, specific story.</Hint></>);
    } else {
      setDialogue(<>They're asking one more question before proceeding. <Hint>Answer with something specific-sounding, not a shrug.</Hint></>);
    }
  }

  function hint() {
    if (nodeId === 'start') choose(NODES.start.options[0]);
    else if (nodeId === 'verify') choose(NODES.verify.options[0]);
  }

  const currentOptions = NODES[nodeId]?.options || [];

  return (
    <RoomShell
      caseLabel="CASE 0417 — SCENE 9"
      title="The phone call"
      subtitle="Branching call · pick what you say"
      dialogue={dialogue}
      mech={mech}
      onHint={hint}
      onReset={reset}
      pageTitle="Incoming call — Acme IT Helpdesk"
      flag="FLAG{c0nf1dence_1s_the_expl0it}"
      flagShown={success}
    >
      <div className="im-browser" style={{ background: '#0c0e13', color: '#e9ebf1' }}>
        <div className="im-addr-row" style={{ background: '#191d27', borderBottom: '1px solid #2b313f' }}>
          <div className="im-dots"><span></span><span></span><span></span></div>
          <div className="im-addr-bar" style={{ background: 'transparent', border: 'none', color: '#8d94a6' }}>
            live call · 00:4{transcript.length}
          </div>
        </div>
        <div className="im-page" style={{ background: '#0c0e13' }}>
          <div className="im-chat-log">
            {transcript.map((m, i) => (
              <div key={i} className={`im-bubble ${m.from === 'agent' ? 'im-bubble-agent' : 'im-bubble-you'}`}>
                {m.text}
              </div>
            ))}
          </div>
          {currentOptions.length > 0 && (
            <div className="im-choices">
              {currentOptions.map((opt) => (
                <button key={opt.id} className="im-choice-btn" type="button" onClick={() => choose(opt)}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {failed && (
            <button className="im-post-btn" type="button" onClick={reset} style={{ marginTop: 12 }}>
              Try again
            </button>
          )}
        </div>
      </div>
    </RoomShell>
  );
}
