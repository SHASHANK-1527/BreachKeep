# Introduction module — integration steps

Built for a React app using React Router v6. Three open rooms, no gating —
students can jump between them or leave mid-scene at any time.

## What's in this folder

```
introduction-module/
├── IntroductionModule.jsx   entry point — owns its own nested routes
├── RoomGrid.jsx              the room list at /dashboard/introduction
├── introduction.css          scoped styles (everything lives under .im-scope)
├── components/
│   └── RoomShell.jsx         shared brief panel + stage layout for every room
└── rooms/
    ├── BinexpRoom.jsx        "The build tool" — free-form simulated terminal
    ├── SqliRoom.jsx          "The page that shouldn't exist" — fake browser
    └── XssRoom.jsx           "The guestbook" — fake browser
```

## 1. Copy the folder in

Drop `introduction-module/` wherever you keep feature folders, e.g.:

```
src/features/introduction-module/
```

The imports inside these files use relative paths (`./RoomGrid`,
`./rooms/BinexpRoom`, etc.) and don't assume anything about the rest of your
app, so you can rename the folder or move it without editing internals —
just update the import path where you mount it (step 2).

## 2. Mount the routes

Find wherever your app defines the route(s) under `/dashboard` and add:

```jsx
import IntroductionModule from './features/introduction-module/IntroductionModule';

// ...inside your <Routes>:
<Route path="/dashboard/introduction/*" element={<IntroductionModule />} />
```

The trailing `/*` is required — `IntroductionModule` renders its own nested
`<Routes>` for the grid and each room. This one line gives you:

| URL | Renders |
|---|---|
| `/dashboard/introduction` | Room grid |
| `/dashboard/introduction/build-tool` | Binary exploitation room |
| `/dashboard/introduction/hidden-page` | SQL injection room |
| `/dashboard/introduction/guestbook` | XSS room |

**If you're on React Router v5**, swap the `<Routes>`/`<Route element={...}>`
pattern inside `IntroductionModule.jsx` for `<Switch>`/`<Route component={...}>`
— the route paths and everything else stays the same.

## 3. Add the button on your dashboard

In your existing dashboard page component:

```jsx
import { Link } from 'react-router-dom';

<Link to="/dashboard/introduction" className="your-existing-button-class">
  Introduction module
</Link>
```

Use whatever button/card styling your dashboard already has — nothing here
depends on it.

## 4. That's it — no global CSS changes

`introduction.css` is imported once, inside `IntroductionModule.jsx`, and
every rule in it is scoped under a single `.im-scope` wrapper class with
`im-` prefixed class names throughout. It won't override or collide with
your existing site styles, and your existing styles won't bleed into it.

If you'd rather not pull in Sora / IBM Plex Mono from Google Fonts, delete
the `@import` line at the top of `introduction.css` — everything falls back
to system sans-serif / monospace cleanly.

## Notes for extending it later

- Each room is self-contained state + JSX — no shared store, no routing
  logic beyond the paths above. Cloning `rooms/SqliRoom.jsx` (fake-browser
  pattern) or `rooms/BinexpRoom.jsx` (free-form terminal pattern) is the
  fastest way to add a new teaser later; add it to `RoomGrid.jsx`'s
  `OPEN_ROOMS` array and a new `<Route>` in `IntroductionModule.jsx`.
- The six "Locked" cards in `RoomGrid.jsx` are static placeholders hinting
  at future dungeons (MITM, crypto, command injection, IDOR, path
  traversal, social engineering) — edit or remove them freely, they don't
  wire up to anything yet.
- Flags are plain strings rendered client-side for this teaser purpose —
  there's no submission/validation step, matching the "just a hook, not a
  real challenge" brief. If you later want completion to actually count
  toward something, that's the one piece that would need a backend call
  added to each room's flag-reveal branch.
