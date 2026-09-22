import { Link } from 'react-router-dom';

const OPEN_ROOMS = [
  {
    to: 'build-tool',
    glyph: '▦',
    title: 'The build tool',
    desc: (
      <>
        A locked-down file called <code className="im-code">vault</code> sits in the leaked files. The
        terminal can reveal what's hidden inside it — a taste of the Terminal dungeon.
      </>
    ),
  },
  {
    to: 'hidden-page',
    glyph: '◈',
    title: "The page that shouldn't exist",
    desc: "Acme's own site tells crawlers to stay away from something. Naturally, you don't.",
  },
  {
    to: 'guestbook',
    glyph: '✎',
    title: 'The guestbook',
    desc: 'Somewhere, an admin still reads every comment posted here. Make that a problem for them.',
  },
];


export default function RoomGrid() {
  return (
    <div className="im-module">
      <h1 className="im-h1">What's on the drive</h1>
      <p className="im-lead">
        Three scenes are open right now. Jump between them any time — nothing needs to be
        finished in one sitting. Finish all three and return to the hub — you'll be sorted into a house.
      </p>
      <div className="im-rooms">
        {OPEN_ROOMS.map((r) => (
          <Link className="im-room" to={r.to} key={r.to}>
            <div className="im-room-top">
              <div className="im-glyph">{r.glyph}</div>
              <div className="im-tag">Open</div>
            </div>
            <h3 className="im-room-title">{r.title}</h3>
            <p className="im-room-desc">{r.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
