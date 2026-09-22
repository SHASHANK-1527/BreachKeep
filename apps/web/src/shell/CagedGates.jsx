import StoneGate from '../sanctum/StoneGate.jsx'

// The dulled, caged dungeon gates shown before sorting. Not clickable.
const PLACEHOLDER = ['Terminal', 'Network', 'Web', 'Secure Coding', 'Capstone']

export default function CagedGates() {
  return (
    <div className="caged-gates">
      {PLACEHOLDER.map((name) => (
        <div className="gate-card sn-caged" key={name} aria-disabled="true">
          <div className="sn-cage-bars" />
          <StoneGate status="locked" />
          <span className="gate-name">{name}</span>
        </div>
      ))}
      <p className="bk-note">The cages lift once your introduction is complete and you are sorted.</p>
    </div>
  )
}
