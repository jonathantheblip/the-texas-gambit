/**
 * massing.open() — the in-page entry point Design asked for. Steps through a
 * render into the 3D massing, focused on one room.
 *
 *   const session = massing.open(roomId, {
 *     facing,            // 'N'|'E'|'S'|'W' — arrival pose (optional; sensible default otherwise)
 *     onReady: (id) => …,// first frame painted — cross-fade the render out now
 *     onExit:  (id) => …,// user returned to the walk
 *   });
 *   session.close();     // programmatic return to the walk (same room)
 *
 * Built on the single nav source + cameraBus. Code also runs a built-in
 * render→massing cross-fade on this entry; onReady lets you sync your own.
 */
import { nav, subscribeNav } from '../nav/navStore.js';
import { cameraBus } from './cameraBus.js';

export const massing = {
  open(roomId, { facing = null, onReady, onExit } = {}) {
    let done = false;
    const offReady = onReady ? cameraBus.onReady((id) => { onReady(id ?? roomId); offReady(); }) : null;
    const offNav = onExit ? subscribeNav((s) => {
      if (s.mode !== 'model' && !done) { done = true; onExit(roomId); offNav(); }
    }) : null;
    nav.enterMassing(roomId, facing);
    return { close: () => nav.goRoom(roomId) };
  },
};
