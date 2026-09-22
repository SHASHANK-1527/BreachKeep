// Prominent "do this first" button. Uses the niket introBtn entrance/glow classes.
export default function IntroButton({ onClick }) {
  return (
    <button className="intro-btn sn-intro-glow" onClick={onClick}>
      <span className="intro-btn-label">Introduction Module</span>
      <span className="intro-btn-sub">Complete this to unlock the dungeons</span>
    </button>
  )
}
