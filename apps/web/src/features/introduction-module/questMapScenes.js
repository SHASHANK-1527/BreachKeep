// Shared quest-map data: the nine introduction scenes and their gate
// placements on introduction-bg.png (percent of map width/height).
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

// Percent-based placements following the trail in the updated
// introduction-bg.png — the path starts at the bottom-left corner and winds
// up through the forest to the castle at the top-right. Coordinates are
// relative to the full-bleed, bar-cropped map container.
export const GATE_SPOTS = [
  { left: 8, top: 93 },   // scene 1 — the trailhead, bottom-left
  { left: 19, top: 84 },  // scene 2 — first bend past the lantern
  { left: 27, top: 74 },  // scene 3 — lower switchback
  { left: 45, top: 62 },  // scene 4 — the fork on the right
  { left: 13, top: 57 },  // scene 5 — the westward excursion
  { left: 55, top: 50 },  // scene 6 — the middle climb
  { left: 34, top: 40 },  // scene 7 — upper-left bend by the lantern
  { left: 64, top: 25 },  // scene 8 — heading east toward the falls
  { left: 78, top: 16 },  // scene 9 — final switchback below the castle
]
