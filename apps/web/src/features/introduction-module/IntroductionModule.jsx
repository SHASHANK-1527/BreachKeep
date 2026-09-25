import { Routes, Route } from 'react-router-dom';
import RoomGrid from './RoomGrid';
import BinexpRoom from './rooms/BinexpRoom';
import SqliRoom from './rooms/SqliRoom';
import XssRoom from './rooms/XssRoom';
import MitmRoom from './rooms/MitmRoom';
import CryptoRoom from './rooms/CryptoRoom';
import CmdInjectionRoom from './rooms/CmdInjectionRoom';
import IdorRoom from './rooms/IdorRoom';
import PathTraversalRoom from './rooms/PathTraversalRoom';
import SocialEngineeringRoom from './rooms/SocialEngineeringRoom';
import './introduction.css';

/**
 * Mount this at /dashboard/introduction/* in your app's router, e.g.:
 *
 *   <Route path="/dashboard/introduction/*" element={<IntroductionModule />} />
 *
 * The trailing "/*" matters — this component owns its own nested <Routes>
 * for the room grid and each individual room.
 *
 * Routes this creates (relative to /dashboard/introduction) — one per scene,
 * numbered to match the gates on the quest map:
 *   ""                  -> quest map (room grid)
 *   "build-tool"        -> scene 1 · The build tool (binexp)
 *   "hidden-page"       -> scene 2 · The page that shouldn't exist (SQLi)
 *   "guestbook"         -> scene 3 · The guestbook (XSS)
 *   "coffee-shop-wifi"  -> scene 4 · The coffee shop wifi (MITM)
 *   "encoded-memo"      -> scene 5 · The encoded memo (crypto)
 *   "support-form"      -> scene 6 · The support form (command injection)
 *   "somebodys-invoice" -> scene 7 · Somebody else's invoice (IDOR)
 *   "dotdotdot-folder"  -> scene 8 · The "../../" folder (path traversal)
 *   "phone-call"        -> scene 9 · The phone call (social engineering)
 *
 * All rooms are open from the start — the introduction module isn't gated
 * by progress, unlike the real dungeons later in the platform.
 */
export default function IntroductionModule() {
  return (
    <div className="im-scope">
      <Routes>
        <Route index element={<RoomGrid />} />
        <Route path="build-tool" element={<BinexpRoom />} />
        <Route path="hidden-page" element={<SqliRoom />} />
        <Route path="guestbook" element={<XssRoom />} />
        <Route path="coffee-shop-wifi" element={<MitmRoom />} />
        <Route path="encoded-memo" element={<CryptoRoom />} />
        <Route path="support-form" element={<CmdInjectionRoom />} />
        <Route path="somebodys-invoice" element={<IdorRoom />} />
        <Route path="dotdotdot-folder" element={<PathTraversalRoom />} />
        <Route path="phone-call" element={<SocialEngineeringRoom />} />
      </Routes>
    </div>
  );
}
