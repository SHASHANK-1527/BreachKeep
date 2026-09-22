import { Routes, Route } from 'react-router-dom';
import RoomGrid from './RoomGrid';
import BinexpRoom from './rooms/BinexpRoom';
import SqliRoom from './rooms/SqliRoom';
import XssRoom from './rooms/XssRoom';
import './introduction.css';

/**
 * Mount this at /dashboard/introduction/* in your app's router, e.g.:
 *
 *   <Route path="/dashboard/introduction/*" element={<IntroductionModule />} />
 *
 * The trailing "/*" matters — this component owns its own nested <Routes>
 * for the room grid and each individual room.
 *
 * Routes this creates (relative to /dashboard/introduction):
 *   ""             -> room grid
 *   "build-tool"   -> terminal teaser room
 *   "hidden-page"  -> SQL injection room
 *   "guestbook"    -> XSS room
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
      </Routes>
    </div>
  );
}
