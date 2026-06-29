/**
 * cameraBus — the contract for driving the 3D camera from outside the scene.
 * CODE OWNS THE CAMERA.
 *
 *   cameraBus.driftTo(roomId, facing?)   // glide to a room (facing = N/E/S/W arrival pose)
 *   cameraBus.onReady(roomId => …)       // first frame painted — safe to cross-fade the render out
 *   cameraBus.onArrival(roomId => …)     // the arrival drift has settled (free orbit from here)
 *
 * The scene registers the handler (_register) and emits (_ready/_arrived); those
 * underscored methods are Code-internal.
 */
const readyCbs = new Set();
const arrivalCbs = new Set();
let handler = null;

export const cameraBus = {
  driftTo: (roomId, facing = null) => { if (handler) handler(roomId, facing); },
  onReady: (cb) => { readyCbs.add(cb); return () => readyCbs.delete(cb); },
  onArrival: (cb) => { arrivalCbs.add(cb); return () => arrivalCbs.delete(cb); },
  isReady: () => Boolean(handler),
  _register: (fn) => { handler = fn; },
  _ready: (roomId) => { for (const cb of readyCbs) cb(roomId); },
  _arrived: (roomId) => { for (const cb of arrivalCbs) cb(roomId); },
};
