// Theme-agnostic hub skeleton. Real GateCards/GuidePanel come from the ported
// dungeon-hub shell; this wraps them and exposes named character slots.
export default function HubShell({ user, children }) {
  return (
    <div className="hub-shell">
      <header className="hub-header">
        <span className="hub-brand">BreachKeep</span>
        <span className="hub-user">{user?.username} · {user?.house || 'unsorted'}</span>
      </header>
      <main className="hub-main">{children}</main>
      <div className="guide-character-anchor" data-slot="guide" />
    </div>
  )
}
