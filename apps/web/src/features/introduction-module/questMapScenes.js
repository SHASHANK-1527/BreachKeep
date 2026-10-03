// Shared quest-map data: the nine introduction scenes and their gate
// placements on introduction-ui.png (percent of map width/height).
// Used by the Introduction page (live interactive gates + task routing).

export const SCENES = [
  {
    to: 'build-tool',
    gate: '/assets/gateways/gate_01_upper_left_purple_portal.webp',
    title: 'The Build Tool',
    desc: "A locked-down file called vault sits in the leaked files. Use the terminal to reveal what's hidden inside.",
    num: 'I',
  },
  {
    to: 'hidden-page',
    gate: '/assets/gateways/gate_02_blue_rune.webp',
    title: "The Page That Shouldn't Exist",
    desc: "Acme's own site tells crawlers to stay away from something. Naturally, you investigate the forbidden path.",
    num: 'II',
  },
  {
    to: 'guestbook',
    gate: '/assets/gateways/gate_03_red_torii.webp',
    title: 'The Guestbook',
    desc: 'Somewhere, an admin still reads every comment posted here. Make that a problem for them.',
    num: 'III',
  },
  {
    to: 'coffee-shop-wifi',
    gate: '/assets/gateways/gate_04_center_right_blue.webp',
    title: 'The Coffee Shop Wifi',
    desc: 'Start the packet capture, then open the one request that everyone on the network can read.',
    num: 'IV',
  },
  {
    to: 'encoded-memo',
    gate: '/assets/gateways/gate_05_lower_left_upper_purple.webp',
    title: 'The Encoded Memo',
    desc: 'Someone thought memo.txt was safely "encrypted." Show them the difference between encoding and encryption.',
    num: 'V',
  },
  {
    to: 'support-form',
    gate: '/assets/gateways/gate_06_lower_middle_blue.webp',
    title: 'The Support Form',
    desc: 'A diagnostic tool runs a real ping. Type a hostname — or something else entirely.',
    num: 'VI',
  },
  {
    to: 'somebodys-invoice',
    gate: '/assets/gateways/gate_07_lower_left_lower_purple.webp',
    title: "Somebody Else's Invoice",
    desc: 'Edit the address bar directly and see whether the invoice actually belongs to you.',
    num: 'VII',
  },
  {
    to: 'dotdotdot-folder',
    gate: '/assets/gateways/gate_08_lower_purple_portal.webp',
    title: "The '../../' Folder",
    desc: "A file-download field with no boundary check. The server never asked which folder you'd stop at.",
    num: 'VIII',
  },
  {
    to: 'phone-call',
    gate: '/assets/gateways/gate_09_bottom_right_green.webp',
    title: 'The Phone Call',
    desc: 'Branching call from "Acme IT Helpdesk." Pick what you say — there is no patch for trust.',
    num: 'IX',
  },
]

// Percent-based placements following introduction-ui.png layout on introduction-bg.png.
// Coordinates specify the center (left, top) and width of each gate as a percentage
// of the map container (1024x1536).
export const GATE_SPOTS = [
  { left: 24.8, top: 21.68, width: 12.2 },  // Scene I: Upper Left Purple Portal (gate_01)
  { left: 27.15, top: 39.36, width: 11.5 }, // Scene II: Blue Rune Gate (gate_02)
  { left: 58.25, top: 30.18, width: 11.8 }, // Scene III: Red Torii Gate (gate_03)
  { left: 62.26, top: 53.35, width: 12.4 }, // Scene IV: Center Right Blue Gate (gate_04)
  { left: 15.72, top: 60.55, width: 11.6 }, // Scene V: Lower Left Upper Purple Gate (gate_05)
  { left: 57.76, top: 76.6, width: 13.0 },  // Scene VI: Lower Middle Blue Gate (gate_06)
  { left: 15.97, top: 78.81, width: 11.8 }, // Scene VII: Lower Left Lower Purple Gate (gate_07)
  { left: 35.16, top: 87.89, width: 12.5 }, // Scene VIII: Lower Purple Portal (gate_08)
  { left: 65.72, top: 91.11, width: 11.8 }, // Scene IX: Bottom Right Green Gate (gate_09)
]
