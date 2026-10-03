# BreachKeep Web Architecture

## Overview

The `apps/web` folder is a **React + Vite** application that serves as the frontend for the BreachKeep cyber security training platform. It features a gated access model with two separate bundles: a public landing page and a protected application shell.

## Tech Stack

- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.0
- **Routing**: React Router DOM 6.26.0
- **Authentication**: Google OAuth (@react-oauth/google)
- **Styling**: CSS (inline styles and imported stylesheets)

## Project Structure

```
apps/web/
├── index.html              # Entry point for gated app bundle
├── landing.html            # Entry point for public landing bundle
├── vite.config.js          # Vite configuration with dual build modes
├── package.json            # Dependencies & scripts
├── Dockerfile              # Container configuration
├── public/                 # Static assets (served as-is, not bundled)
├── dist/                   # Build output (app/ and landing/ subdirs)
└── src/
    ├── main.jsx            # App bundle entry point
    ├── landing-entry.jsx   # Landing page entry point
    ├── app/                # Core application context & routing
    ├── pages/              # Page components (route destinations)
    ├── components/         # Reusable UI components
    ├── features/           # Feature modules (self-contained functionality)
    ├── shell/              # Layout wrapper, themes, navigation
    ├── sanctum/            # Visual effects & animations
    └── styles/             # Global stylesheets
```

## Core Directories

### `/app` - Application Core
Central application setup, state management, and routing.

**Files:**
- `App.jsx` - Root component with React Router configuration and page routing
- `AuthContext.jsx` - Global authentication state (user, login, logout)
- `GateContext.jsx` - Gate access state (httpOnly cookie managed by backend)
- `api.js` - Unified API client with automatic credential handling

**Key Features:**
- Dual auth provider setup: AuthProvider wraps GateProvider
- Session-based authentication via httpOnly `bk_session` cookie
- Gate protection via httpOnly `bk_gate` cookie (nginx enforced)
- Protected routes with `RequireSession` wrapper component

### `/pages` - Route Destinations
Full-page components representing distinct views/routes.

**Pages:**
- `Enter.jsx` - Login/signup/verification page
- `Landing.jsx` - Public landing page for unauthenticated users
- `Dashboard.jsx` - Main hub with dungeon list and profile access
- `Dungeon.jsx` - Individual dungeon/challenge view
- `Onboarding.jsx` - Initial user setup and house sorting
- `Account.jsx` - User profile management (display name, avatar, password, etc.)
- `ResetPassword.jsx` - Password reset flow
- `admin/AdminPanel.jsx` - Administrative controls and user management

### `/components` - Reusable Elements
Smaller, reusable UI components that don't span full pages.

**Components:**
- `FlagSubmit.jsx` - Flag/answer submission form for challenges

### `/features` - Feature Modules
Self-contained feature bundles with their own logic, styling, and subcomponents.

**Modules:**
- `introduction-module/` - Interactive introduction/tutorial module
  - `IntroductionModule.jsx` - Main module component
  - `RoomGrid.jsx` - Room layout grid
  - `rooms/` - Individual room components
  - `components/` - Feature-specific sub-components
  - `introduction.css` - Module-specific styling
  - `reportComplete.js` - Progress/completion tracking

### `/shell` - Layout & Navigation
Top-level layout, navigation shells, and theme configuration.

**Components:**
- `HubShell.jsx` - Primary application layout wrapper
- `CagedGates.jsx` - Access control UI component
- `SortingCeremony.jsx` - House sorting ceremony/onboarding
- `IntroButton.jsx` - Intro module launcher
- `styles/`
  - `hub-shell.css` - Main layout styling
  - `themes/` - Four house themes (rimeguard, emberkeep, arcweave, voltgrid)

**Theme System:**
CSS is scoped by `[data-house]` attribute, allowing all themes to be loaded simultaneously and switched via data attributes.

### `/sanctum` - Visual Effects
Animation and visual effect components for enhanced UI/UX.

**Components:**
- `ParticleField.jsx` - Particle effect animation
- `PortalWarp.jsx` - Portal/warp visual effect
- `StoneGate.jsx` - Gate/door visual effect
- `useSfx.js` - Custom hook for sound effects
- `sanctum.css` - Effect-specific styling

### `/styles` - Global Styling
Application-wide stylesheets applied to all pages.

**Files:**
- `custom-pages.css` - Global page styling

## `/public` - Static Assets

Static files served as-is without bundling via Vite. Referenced in components via absolute paths (e.g., `/center_spire_clean.png`). All files are copied to the root of the dist/ output on build.

**Complete File Listing:**

### Core Icons
- `favicon.svg` - Browser tab icon (16x16, used in index.html)
- `icons.svg` - SVG sprite containing inline icon definitions

### Hero Scene Backgrounds (Primary)
- `rimeguard_fortress_scene.jpg` - Icy fortress backdrop for RimeGuard house theme
- `emberkeep_fortress_scene.jpg` - Volcanic fortress backdrop for EmberKeep house theme
- `voltgrid_cybercity_scene.jpg` - Cyber city backdrop for VoltGrid house theme

### Hero Scene Backgrounds (Alternative/Test)
- `rimeguard_fortress_scene_cleansky.jpg` - RimeGuard variant with cleaner sky
- `emberkeep_fortress_scene_cleansky.jpg` - EmberKeep variant with cleaner sky
- `emberkeep_fortress_scene_test.jpg` - Test version of EmberKeep scene
- `test_clean_emberkeep.jpg` - Clean test variant
- `test_perfection.jpg` - Test/reference image
- `test_real_volcano.jpg` - Volcano reference image
- `test_true_emberkeep.jpg` - True EmberKeep test variant
- `test_volcano_art.jpg` - Volcano artwork reference

### Spire & Crystal Elements
- `center_spire_clean.png` - Central spire decoration (generic/primary)
- `center_spire_crop.png` - Cropped variant of center spire
- `crystal_core.png` - Generic crystal core decoration
- `gem_crop.png` - Cropped gem asset (generic)
- `rimeguard_gem_crop.png` - RimeGuard-themed gem
- `ember_crystal_core.png` - EmberKeep-themed crystal core
- `voltgrid_core.png` - VoltGrid-themed core element
- `voltgrid_crystal_core.png` - VoltGrid-themed crystal core

### Cloud Decorations
- `cloud_left.png` - Generic left-side cloud
- `cloud_right.png` - Generic right-side cloud
- `ember_cloud_left.png` - EmberKeep-themed left cloud
- `ember_cloud_right.png` - EmberKeep-themed right cloud
- `voltgrid_cloud_left.png` - VoltGrid-themed left cloud
- `voltgrid_cloud_right.png` - VoltGrid-themed right cloud

### Asset Subdirectory
- `assets/` - Contains additional static resources (subdirectory)

**Usage Pattern:**
Images are referenced in component styles using absolute paths:
```css
backgroundImage: 'url(/rimeguard_fortress_scene.jpg)'
```
This works in both dev (Vite serves from public/) and production (nginx serves from dist root).

## Build & Deployment

### Vite Configuration
The application uses **dual-mode builds** via Vite:

```bash
npm run build           # Builds the gated app to dist/app/
npm run build:landing  # Builds the landing page to dist/landing/
npm run dev            # Starts dev server with HMR and API proxying
```

**Dev Server Proxying:**
- `/api/*` → proxies to `http://localhost:5000` (main API)
- `/labs/*` → proxies to `http://localhost:5050` (lab environments)

**Production Bundles:**
- `dist/app/` - Protected application (served only with valid gate cookie)
- `dist/landing/` - Public landing page (nginx serves to everyone)

Nginx routes based on `bk_gate` cookie presence to determine which bundle to serve.

## Authentication & Authorization Flow

1. **Gate Access** (`GateContext`)
   - Managed by httpOnly `bk_gate` cookie (set by `/auth/verify-access-code`)
   - Nginx enforces: without cookie, only landing page is served
   - Frontend assumes gate is passed if app bundle executes

2. **Session Authentication** (`AuthContext`)
   - Managed by httpOnly `bk_session` cookie (set by `/auth/login` or `/auth/verify`)
   - JWT token stored server-side
   - `useAuth()` hook provides: `user`, `setUser`, `loading`, `refresh`, `logout`
   - All API requests via `api.js` include credentials

3. **Protected Routes**
   - `RequireSession` component wraps routes needing authentication
   - Redirects to `/enter` if no session

## API Communication

**API Client** (`api.js`):
```javascript
const api = {
  get: (path) => req(path, 'GET'),
  post: (path, body) => req(path, 'POST', body),
}
```

- Sends cookies automatically via `credentials: 'include'`
- Base URL from `VITE_API_BASE` env var (defaults to `/api`)
- Error handling with custom error objects

## State Management

**Global State Providers:**
1. `AuthProvider` - User authentication state
   - Fetches `/auth/me` on mount to restore session
   - Provides logout functionality
   - Accessible via `useAuth()` hook

2. `GateProvider` - Gate access status
   - Simple true/false (nginx enforces actual gating)
   - Accessible via `useGate()` hook

3. `GoogleOAuthProvider` - Google authentication setup
   - Wraps entire app to enable Google login flow

**Page-Level State:**
- Each page component manages its own local state (useState)
- Data fetching typically done in useEffect hooks
- Component state passed via props to child components

## Styling Strategy

**Global Themes:**
- Four house themes in `/shell/styles/themes/`
- Scoped by `[data-house]` attribute on document root
- All theme CSS imported in main.jsx (tree-shaking removes unused on build)

**Component-Level Styling:**
- Mostly inline styles defined in component files
- Some components have accompanying CSS files (e.g., `introduction.css`, `sanctum.css`)
- Theme colors referenced via CSS variables set per house

**Color Palette (Example - RimeGuard):**
- Background: `#0a0403`
- Panel: `#160806`, `#1c0d09`
- Text: `#e9d9d1`, dim: `rgba(233,217,209,0.55)`
- Accent: `#ff5a1f`, cream: `#ffdca8`
- Status: green `#22c55e`, red `#ef4444`

## Key Features

### Access Control
- Two-tier gating system (gate cookie → session cookie)
- Prevents unauthorized access at nginx level
- Access codes and verification codes managed by backend

### User Progression
- Dungeon-based challenges (CTF-style)
- Progress tracking per user
- Introduction module for onboarding
- House system with themed UI

### User Management
- Account settings page (display name, avatar, password)
- Password reset flow
- Account deletion capability
- Admin panel for user management

### Security Features
- httpOnly cookies prevent XSS attacks on auth tokens
- Session-based authentication (JWT)
- CSRF protection via same-origin API calls
- Rate limiting on authentication endpoints

## Entry Points

**App Bundle (`main.jsx`):**
- Serves authenticated users
- Requires valid `bk_gate` cookie (nginx enforced)
- Loads theme CSS and global styles
- Initializes Google OAuth provider

**Landing Bundle (`landing-entry.jsx`):**
- Serves public users
- No authentication required
- Built separately with `npm run build:landing`

## Development Workflow

```bash
# Start dev server (HMR enabled)
npm run dev

# Build both bundles
npm run build && npm run build:landing

# Preview production build
npm run preview
```

Dev server runs on port 3000 with strict port enforcement and automatic API proxying to local backend services.

## Component Composition Example

```
App (Router)
├── Header (user menu, navigation)
├── RequireSession
│   └── Layout (Shell wrapper)
│       └── Route-specific Page
│           ├── Reusable Components
│           └── Feature Modules
└── Sanctum Effects (particles, portals, etc.)
```

## Environment Variables

**Required for Production:**
- `VITE_API_BASE` - Backend API URL (defaults to `/api`)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `VITE_ADMIN_PATH` - Admin panel access path (defaults to `/keep-warden-7f3a9c`)

## Performance Considerations

- Vite provides fast HMR during development
- Production builds are optimized and minified
- CSS-in-JS for components (no separate CSS files to load)
- Theme CSS scoped to prevent conflicts
- Lazy loading via React Router for pages
