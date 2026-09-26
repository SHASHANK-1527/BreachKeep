// Shared quest-map data: the nine introduction scenes and their gate
// placements on introduction-ui.png (percent of map width/height).
// Used by both the Introduction page (live gates + trials selector)
// and the dashboard's pre-sorting view (caged, static gates).

export const SCENES = [
  {
    to: 'build-tool',
    gate: '/assets/intro-gates/gate_01_blue.png',
    title: 'The Build Tool',
    desc: "A locked-down file called vault sits in the leaked files. Use the terminal to reveal what's hidden inside.",
    num: 'I',
  },
  {
    to: 'hidden-page',
    gate: '/assets/intro-gates/gate_02_gold.png',
    title: "The Page That Shouldn't Exist",
    desc: "Acme's own site tells crawlers to stay away from something. Naturally, you investigate the forbidden path.",
    num: 'II',
  },
  {
    to: 'guestbook',
    gate: '/assets/intro-gates/gate_03_blue.png',
    title: 'The Guestbook',
    desc: 'Somewhere, an admin still reads every comment posted here. Make that a problem for them.',
    num: 'III',
  },
  {
    to: 'coffee-shop-wifi',
    gate: '/assets/intro-gates/gate_04_purple.png',
    title: 'The Coffee Shop Wifi',
    desc: 'Start the packet capture, then open the one request that everyone on the network can read.',
    num: 'IV',
  },
  {
    to: 'encoded-memo',
    gate: '/assets/intro-gates/gate_05_green.png',
    title: 'The Encoded Memo',
    desc: 'Someone thought memo.txt was safely "encrypted." Show them the difference between encoding and encryption.',
    num: 'V',
  },
  {
    to: 'support-form',
    gate: '/assets/intro-gates/gate_06_cyan.png',
    title: 'The Support Form',
    desc: 'A diagnostic tool runs a real ping. Type a hostname — or something else entirely.',
    num: 'VI',
  },
  {
    to: 'somebodys-invoice',
    gate: '/assets/intro-gates/gate_07_red.png',
    title: "Somebody Else's Invoice",
    desc: 'Edit the address bar directly and see whether the invoice actually belongs to you.',
    num: 'VII',
  },
  {
    to: 'dotdotdot-folder',
    gate: '/assets/intro-gates/gate_08_cyan.png',
    title: 'The "../../" Folder',
    desc: "A file-download field with no boundary check. The server never asked which folder you'd stop at.",
    num: 'VIII',
  },
  {
    to: 'phone-call',
    gate: '/assets/intro-gates/gate_09_red.png',
    title: 'The Phone Call',
    desc: 'Branching call from "Acme IT Helpdesk." Pick what you say — there is no patch for trust.',
    num: 'IX',
  },
]

// Percent-based placements following the winding golden stone path in
// introduction-ui.png — the path starts at the bottom-left trailhead and
// winds up through the forest, past cliffs and waterfalls on the right,
// to the castle at the top-right. Coordinates are relative to the full-bleed
// map container (100vw x 100vh), matching the artwork 1:1.
export const GATE_SPOTS = [
  { left: 10, top: 90 },  // scene I  — trailhead, bottom-left on the winding path
  { left: 17, top: 81 },  // scene II — first bend near stone lantern on grassy rise
  { left: 59, top: 73 },  // scene III — lower S-bend on cliff edge overlooking river
  { left: 47, top: 65 },  // scene IV — fork where paths diverge near waterfall
  { left: 17, top: 60 },  // scene V  — westward excursion past lantern on elevated platform
  { left: 43, top: 50 },  // scene VI — middle climb on upper path, near rocky outcrop
  { left: 22, top: 43 },  // scene VII — upper-left bend by ancient lantern on ridge
  { left: 35, top: 35 },  // scene VIII — eastward stretch toward the falls/cliffs
  { left: 20, top: 30 },  // scene IX  — final gate before the castle bridge (upper-right)
]
