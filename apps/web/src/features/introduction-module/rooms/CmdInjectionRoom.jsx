import { useState, useRef, useEffect } from 'react';
import RoomShell from '../components/RoomShell';

function Hint({ children }) {
  return <span className="im-hint">{children}</span>;
}
function Code({ children }) {
  return <code className="im-code">{children}</code>;
}

const INITIAL_LINES = [];
const INITIAL_DIALOGUE = (
  <>
    Acme's support site has a "network diagnostics" tool for staff — type a hostname, it pings it. Try it normally
    first. <Hint>acmewidgets.co</Hint>
  </>
);
const INITIAL_MECH =
  "Tools like this are often built by just handing your text to the system's own shell to run a real ping command. That's convenient for the developer and extremely dangerous, because the shell doesn't know the difference between \"a hostname\" and \"a hostname, and then also run this other command.\"";

export default function CmdInjectionRoom() {
  const [state, setState] = useState({ ranNormal: false, foundWhoami: false, flagShown: false });
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

  const [resetKey, setResetKey] = useState(0);

  function reset() {
    setResetKey((k) => k + 1);
    setState({ ranNormal: false, foundWhoami: false, flagShown: false });
    setLines(INITIAL_LINES);
    setDialogue(INITIAL_DIALOGUE);
    setMech(INITIAL_MECH);
    setInput('');
  }

  function hint() {
    let cmd = 'acmewidgets.co';
    if (state.ranNormal && !state.foundWhoami) cmd = 'acmewidgets.co; whoami';
    else if (state.foundWhoami && !state.flagShown) cmd = 'acmewidgets.co; cat flag.txt';
    setInput(cmd);
    setFilled(true);
    setTimeout(() => setFilled(false), 1200);
  }

  function run(raw) {
    const val = raw.trim();
    if (!val) return;
    addLine('$ diagnostics --host "' + val + '"', 'im-echo');

    const sepMatch = val.match(/;|&&/);
    if (!sepMatch) {
      addLine(`PING ${val}: 4 packets transmitted, 4 received, 0% packet loss`);
      setState((s) => ({ ...s, ranNormal: true }));
      setDialogue(
        <>
          Works as advertised. Support tools like this usually just pass your text straight into a real shell
          command behind the scenes — what happens if you give it two commands instead of one?{' '}
          <Hint>acmewidgets.co; whoami</Hint>
        </>
      );
      return;
    }

    const host = val.slice(0, sepMatch.index).trim();
    const injected = val.slice(sepMatch.index + sepMatch[0].length).trim();
    const injectedLower = injected.toLowerCase();

    addLine(`PING ${host || '(empty)'}: 4 packets transmitted, 4 received, 0% packet loss`);

    if (injectedLower === 'whoami') {
      addLine('acme-support-vm', 'im-out');
      setState((s) => ({ ...s, foundWhoami: true }));
      setDialogue(
        <>
          You're not just pinging anymore — that <Code>;</Code> ended the ping command and started a brand new one,
          which ran on Acme's actual server. See what's sitting on it. <Hint>acmewidgets.co; cat flag.txt</Hint>
        </>
      );
      setMech(
        <>
          <Code>;</Code> and <Code>&amp;&amp;</Code> are shell metacharacters — they mean "run this, then run that"
          to the shell interpreting the line, regardless of what the developer intended the input field to hold.
          Anything that builds a command by concatenating user input is exposed to this.
        </>
      );
      return;
    }

    if (injectedLower.includes('cat') && injectedLower.includes('flag')) {
      if (!state.foundWhoami) {
        addLine('cat: flag.txt: Permission denied', 'im-warn');
        setDialogue(<>Not yet — confirm you can run arbitrary commands first: <Hint>acmewidgets.co; whoami</Hint></>);
        return;
      }
      addLine('the keep has issued your flag below — submit it to clear this scene.', 'im-flag');
      setState((s) => ({ ...s, flagShown: true }));
      setDialogue(
        'A ping tool just handed you arbitrary command execution on their server. This is one of the most severe bug classes out there precisely because it goes straight from "text field" to "full control."'
      );
      setMech(
        "The fix isn't better input filtering (attackers find ways around blocklists) — it's never building shell commands from user input at all. Use language APIs that pass arguments as separate, literal values (never through a shell), and validate the hostname against a strict allow-pattern before it's used for anything."
      );
      return;
    }

    addLine(`${injected}: command not found (in this simulation)`, 'im-warn');
    if (!state.foundWhoami) setDialogue(<>That command doesn't exist here — try something that definitely does: <Hint>acmewidgets.co; whoami</Hint></>);
    else setDialogue(<>Try: <Hint>acmewidgets.co; cat flag.txt</Hint></>);
  }

  return (
    <RoomShell
      caseLabel="CASE 0417 — SCENE 6"
      title="The support form"
      subtitle="Diagnostic tool · type a hostname, or something else entirely"
      dialogue={dialogue}
      mech={mech}
      onHint={hint}
      onReset={reset}
      pageTitle="Network diagnostics"
      roomId="support-form"
      solved={state.flagShown}
      resetKey={resetKey}
    >
      <div className="im-term">
        <div className="im-term-bar"><span></span><span></span><span></span></div>
        <div className="im-term-body" ref={bodyRef}>
          {lines.length === 0 && <div className="im-term-line im-echo">no diagnostics run yet</div>}
          {lines.map((l, i) => (
            <div key={i} className={`im-term-line ${l.cls || 'im-out'}`}>{l.text}</div>
          ))}
        </div>
        <div className="im-term-input-row">
          <span className="im-prompt">host:</span>
          <input
            className={filled ? 'im-filled' : ''}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { run(input); setInput(''); } }}
            placeholder="acmewidgets.co"
            autoComplete="off"
          />
        </div>
      </div>
    </RoomShell>
  );
}
