import { useState, useRef, useEffect } from 'react';
import RoomShell from '../components/RoomShell';

function Hint({ children }) {
  return <span className="im-hint">{children}</span>;
}
function Code({ children }) {
  return <code className="im-code">{children}</code>;
}

const BLOB = 'RkxBR3tuMHRfcjM0bF8zbmNyeXB0MTBufQ==';
const INITIAL_LINES = [{ text: 'leak/ mounted.', cls: 'im-echo' }];
const INITIAL_DIALOGUE = (
  <>
    There's a file in here called <Code>memo.txt</Code> that someone clearly thought was safely "encrypted."{' '}
    <Hint>Have a look: ls</Hint>
  </>
);
const INITIAL_MECH =
  "Encoding and encryption are not the same thing. Encoding (like base64) just represents data in a different format — it needs no secret key to reverse, and anyone with the right tool can undo it instantly. Real encryption needs a key you don't have.";

export default function CryptoRoom() {
  const [state, setState] = useState({ sawMemo: false, decoded: false });
  const [lines, setLines] = useState(INITIAL_LINES);
  const [dialogue, setDialogue] = useState(INITIAL_DIALOGUE);
  const [mech, setMech] = useState(INITIAL_MECH);
  const [input, setInput] = useState('');
  const [filled, setFilled] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  function addLine(text, cls = 'im-out') {
    setLines((l) => [...l, { text, cls }]);
  }

  function reset() {
    setState({ sawMemo: false, decoded: false });
    setLines(INITIAL_LINES);
    setDialogue(INITIAL_DIALOGUE);
    setMech(INITIAL_MECH);
    setInput('');
  }

  function hint() {
    let cmd = 'ls';
    if (state.sawMemo && !state.decoded) cmd = 'base64 -d memo.txt';
    else if (!state.sawMemo) cmd = 'cat memo.txt';
    setInput(cmd);
    setFilled(true);
    setTimeout(() => setFilled(false), 1200);
  }

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    addLine('student@leak:~$ ' + cmd, 'im-echo');
    const c = cmd.toLowerCase().replace(/\s+/g, ' ').trim();

    if (c === 'ls' || c === 'ls -la') { addLine('memo.txt'); setDialogue(<>One file. <Hint>cat memo.txt</Hint></>); return; }
    if (c === 'pwd') { addLine('/home/student/leak'); return; }
    if (c === 'whoami') { addLine('student'); return; }
    if (c === 'clear') { setLines([]); return; }
    if (c === 'help') { addLine('available: ls, pwd, whoami, cat <file>, clear — the rest is up to you.'); return; }

    if (c === 'cat memo.txt' || c === 'cat memo') {
      setState((s) => ({ ...s, sawMemo: true }));
      addLine(BLOB);
      setDialogue(
        <>
          That's not readable text — but it has that telltale look of base64: letters, digits, a couple of{' '}
          <Code>=</Code> at the end for padding. <Hint>base64 -d memo.txt</Hint>
        </>
      );
      setMech(
        <>
          <Code>base64</Code> is a way of representing arbitrary bytes using only printable characters — it's how
          binary data gets safely embedded in text (emails, URLs, config files). It's reversible by design; running
          it with <Code>-d</Code> decodes instead of encodes.
        </>
      );
      return;
    }

    if (c.includes('base64') && c.includes('memo')) {
      const decoding = c.includes('-d') || c.includes('decode');
      if (!decoding) {
        addLine('(input already looked like base64 — this just encoded it again into something messier)', 'im-warn');
        setDialogue(
          <>
            That ran it the wrong direction — you just base64-encoded the base64. You want to go the other way:{' '}
            <Hint>base64 -d memo.txt</Hint>
          </>
        );
        return;
      }
      if (!state.sawMemo) {
        addLine("base64: memo.txt: no such content loaded yet — look at the file first.", 'im-warn');
        setDialogue(<>Read the file first: <Hint>cat memo.txt</Hint></>);
        return;
      }
      setState((s) => ({ ...s, decoded: true }));
      addLine('FLAG{n0t_r34l_3ncrypt10n}', 'im-flag');
      setDialogue(
        "And that's the whole lesson: it looked secret, but there was never a key involved — just a different way of writing the same text."
      );
      setMech(
        'Real encryption (AES, RSA, TLS) needs a secret key to reverse; without it, recovering the original data is computationally infeasible. Encoding schemes like base64, hex, or URL-encoding need nothing but the algorithm itself, which is public. If you can decode something with a one-line command and no key, it was never encrypted.'
      );
      return;
    }

    addLine(cmd + ': command not found', 'im-warn');
    if (!state.sawMemo) setDialogue(<>Try: <Hint>ls</Hint></>);
    else if (!state.decoded) setDialogue(<>You've seen the blob — now decode it: <Hint>base64 -d memo.txt</Hint></>);
  }

  return (
    <RoomShell
      caseLabel="CASE 0417 — SCENE 5"
      title="The encoded memo"
      subtitle="Terminal · same free-form rules as the build tool"
      dialogue={dialogue}
      mech={mech}
      onHint={hint}
      onReset={reset}
      pageTitle="~/leak"
      flag="FLAG{n0t_r34l_3ncrypt10n}"
      flagShown={state.decoded}
    >
      <div className="im-term">
        <div className="im-term-bar"><span></span><span></span><span></span></div>
        <div className="im-term-body" ref={bodyRef}>
          {lines.map((l, i) => (
            <div key={i} className={`im-term-line ${l.cls || 'im-out'}`}>{l.text}</div>
          ))}
        </div>
        <div className="im-term-input-row">
          <span className="im-prompt">student@leak:~$</span>
          <input
            className={filled ? 'im-filled' : ''}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { run(input); setInput(''); } }}
            placeholder="type a command…"
            autoComplete="off"
          />
        </div>
      </div>
    </RoomShell>
  );
}
