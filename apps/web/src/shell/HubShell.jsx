import HubProfileMenu from './HubProfileMenu.jsx'

// Theme-agnostic hub skeleton. The fortress/city views already render the
// house crest and name, so the only chrome here is the profile medallion —
// which carries account settings and log out now that the global fixed
// header is suppressed on /dashboard.
export default function HubShell({ user, children }) {
  return (
    <div className="hub-shell">
      <HubProfileMenu user={user} />
      <main className="hub-main">{children}</main>
      <div className="guide-character-anchor" data-slot="guide" />
    </div>
  )
}
