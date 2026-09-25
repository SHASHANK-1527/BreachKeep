import { useState, useRef, useEffect } from 'react';
import RoomShell from '../components/RoomShell';

function Hint({ children }) {
  return <span className="im-hint">{children}</span>;
}
function Code({ children }) {
  return <code className="im-code">{children}</code>;
}

const INITIAL_LINES = [{ text: 'leak/ mounted.', cls: 'im-echo' }];
const INITIAL_DIALOGUE = (
  <>
    A folder from the leak just landed on this machine. You don't know what's in it yet —{' '}
    <Hint>start by looking: ls</Hint>
  </>
);
const INITIAL_MECH =
  "Binaries keep readable text embedded inside them — function names, messages, file paths — left over from compiling. Reading that text is usually the fastest way to learn what a program can do without touching its assembly.";

export default function BinexpRoom() {
  const [state, setState] = useState({ ranVault: false, foundSecret: false, unlocked: false, flagShown: false });
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
    setState({ ranVault: false, foundSecret: false, unlocked: false, flagShown: false });
    setLines(INITIAL_LINES);
    setDialogue(INITIAL_DIALOGUE);
    setMech(INITIAL_MECH);
    setInput('');
  }

  function hint() {
    let cmd = 'ls';
    if (state.ranVault && !state.foundSecret) cmd = 'strings vault | grep -i secret';
    else if (state.foundSecret && !state.unlocked) cmd = './vault --unlock';
    else if (state.unlocked && !state.flagShown) cmd = 'reveal';
    else if (!state.ranVault) cmd = './vault';
    setInput(cmd);
    setFilled(true);
    setTimeout(() => setFilled(false), 1200);
  }

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    addLine('student@leak:~$ ' + cmd, 'im-echo');
    const c = cmd.toLowerCase().replace(/\s+/g, ' ').trim();

    if (c === 'ls' || c === 'ls -la' || c === 'ls -l' || c === 'dir') {
      addLine('README.txt   vault*');
      setDialogue(
        state.ranVault ? (
          <>
            Same two files. You've already run <Code>vault</Code> — try looking inside it instead:{' '}
            <Hint>strings vault</Hint>
          </>
        ) : (
          <>
            Two things here: a readme, and <Code>vault</Code> — that <Code>*</Code> means it's executable.{' '}
            <Hint>Run it: ./vault</Hint>
          </>
        )
      );
      return;
    }
    if (c === 'pwd') { addLine('/home/student/leak'); return; }
    if (c === 'whoami') { addLine('student'); return; }
    if (c === 'clear') { setLines([]); return; }
    if (c === 'help') { addLine('available: ls, pwd, whoami, cat <file>, clear — the rest is up to you.'); return; }

    if (c === 'cat readme.txt' || c === 'cat readme') {
      addLine('Property of Acme Widgets Ltd. Internal build — do not redistribute.');
      addLine("(built by the intern, please don't judge us — M.)");
      return;
    }
    if (c === 'cat vault') {
      addLine('cat: vault: appears to be a binary file — try `strings vault` instead of `cat`.', 'im-warn');
      return;
    }

    if (c === './vault' || c === 'sh vault' || c === 'bash vault') {
      if (c !== './vault') {
        addLine(cmd + ': not quite how you run a local binary — try ./vault', 'im-warn');
        setDialogue(
          <>
            Close — but a local file needs to be run with <Hint>./vault</Hint>, not a shell wrapped around it.
          </>
        );
        return;
      }
      addLine('Acme Vault v1.0 — license check passed. Nothing else happens.');
      setState((s) => ({ ...s, ranVault: true }));
      setDialogue(
        <>
          Runs clean, does basically nothing — which is itself a little suspicious for a "build tool." Let's see
          what's actually compiled into it. <Hint>strings vault</Hint>
        </>
      );
      setMech(
        <>
          <Code>strings</Code> scans a file and prints every readable run of text it finds inside — it works on any
          binary, not just this one, and needs no special access. It's often the very first command run on an
          unfamiliar executable.
        </>
      );
      return;
    }

    if (
      c === 'vault' ||
      c === '/vault' ||
      c === 'run vault' ||
      c === 'execute vault' ||
      c === './vault.exe' ||
      c.startsWith('sudo ')
    ) {
      if (c === 'vault') {
        addLine('vault: command not found', 'im-warn');
        setDialogue(
          <>
            Right idea — wrong syntax. <Code>vault</Code> is a file sitting right here, not a system command. Local
            files need a path in front of them: <Hint>./vault</Hint>
          </>
        );
        return;
      }
      if (c === '/vault') {
        addLine('bash: /vault: No such file or directory', 'im-warn');
        setDialogue(
          <>
            That path starts from the root of the filesystem — vault isn't there, it's right here in the current
            folder. Try <Hint>./vault</Hint>
          </>
        );
        return;
      }
      if (c.startsWith('sudo ')) {
        addLine(cmd + ': no elevated access needed — you can already run this.', 'im-warn');
        setDialogue(
          <>
            You already have permission — no <Code>sudo</Code> needed. Just <Hint>./vault</Hint>
          </>
        );
        return;
      }
      addLine(cmd + ': not quite — try ./vault', 'im-warn');
      setDialogue(
        <>
          Almost. The exact command is <Hint>./vault</Hint>
        </>
      );
      return;
    }

    if (c.includes('strings') && c.includes('vault')) {
      const grepped = c.includes('grep');
      setState((s) => ({ ...s, foundSecret: true }));
      if (grepped) {
        addLine('unlock_secret_mode  — 0x4016a0');
        setDialogue(
          <>
            There it is — a function that never gets called anywhere in normal execution. Nothing calls it...
            unless you tell it to. <Hint>./vault --unlock</Hint>
          </>
        );
        setMech(
          "That function name surviving compilation and showing up in strings is exactly the kind of thing you're trained to notice: code that exists but has no normal path leading to it. Real teams find backdoors and disabled debug modes this way."
        );
      } else {
        addLine('USAGE: vault [file]\nAcme Vault v1.0\nlicense_check_ok\nunlock_secret_mode\n(c) Acme Widgets Ltd.');
        setDialogue(
          <>
            Lot of noise in there — one line looks like a real function name and doesn't belong with the rest. Cut
            the noise: <Hint>strings vault | grep -i secret</Hint>
          </>
        );
        setMech(
          <>
            The <Code>|</Code> (pipe) sends one command's output straight into another as input. <Code>grep -i secret</Code>{' '}
            then filters that flood of text down to just the lines containing "secret," ignoring case. "Dump
            everything, then filter" is one of the most-used patterns in this field.
          </>
        );
      }
      return;
    }

    if (c.includes('vault') && (c.includes('unlock') || c.includes('secret'))) {
      if (!state.foundSecret) {
        addLine('vault: unrecognized flag', 'im-warn');
        setDialogue(
          <>
            That flag doesn't exist as far as the binary's letting on — you'd have no way to guess it yet. Look
            inside first: <Hint>strings vault | grep -i secret</Hint>
          </>
        );
        return;
      }
      setState((s) => ({ ...s, unlocked: true }));
      addLine('[unlock_secret_mode] condition met.');
      addLine('type: reveal');
      setDialogue(
        <>
          That's the function firing. Something's listening now. <Hint>reveal</Hint>
        </>
      );
      setMech(
        <>
          Passing a flag like <Code>--unlock</Code> is just handing the program an extra piece of input to branch
          on. The function existed the whole time — it was only ever "hidden" in the sense that nothing in normal
          use ever pointed at it.
        </>
      );
      return;
    }

    if (c === 'reveal') {
      if (!state.unlocked) {
        addLine('reveal: nothing is listening for that yet.', 'im-warn');
        setDialogue("Not yet — nothing's been unlocked. Go trigger the hidden function first.");
        return;
      }
      if (state.flagShown) return;
      setState((s) => ({ ...s, flagShown: true }));
      addLine('FLAG{h1dd3n_func_f0und}', 'im-flag');
      setDialogue(
        'That\'s the whole shape of it: functionality hidden in plain sight, found by inspection, triggered on purpose. The rest of the semester is mostly "how do you find this faster, and on things that fight back."'
      );
      setMech(
        "This whole approach — poking at a program with no access to its source code — is called black-box analysis. It scales up to real reverse engineering with tools like Ghidra or IDA, but the instinct is the same one you just used: look for what doesn't add up."
      );
      return;
    }

    addLine(cmd + ': command not found', 'im-warn');
    if (!state.ranVault) setDialogue(<>Not sure what that does here. Try looking around first: <Hint>ls</Hint></>);
    else if (!state.foundSecret) setDialogue(<>You've run vault already — now look inside it: <Hint>strings vault</Hint></>);
    else if (!state.unlocked) setDialogue(<>You found the function name — now call it: <Hint>./vault --unlock</Hint></>);
    else setDialogue(<>Type: <Hint>reveal</Hint></>);
  }

  return (
    <RoomShell
      caseLabel="CASE 0417 — SCENE 1"
      title="The build tool"
      subtitle="Terminal · figure it out as you go, nothing is off limits to try"
      dialogue={dialogue}
      mech={mech}
      onHint={hint}
      onReset={reset}
      pageTitle="~/leak"
      flag="FLAG{h1dd3n_func_f0und}"
      flagShown={state.flagShown}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') { run(input); setInput(''); }
            }}
            placeholder="type a command…"
            autoComplete="off"
          />
        </div>
      </div>
    </RoomShell>
  );
}
