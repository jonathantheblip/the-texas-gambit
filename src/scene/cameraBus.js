/**
 * cameraBus — the contract for driving the 3D camera from outside the scene.
 *
 * CODE OWNS THE CAMERA. Design calls:
 *   cameraBus.driftTo(roomId, fromHeading?)   // glide to a room
 *   const off = cameraBus.onArrival(roomId => ...)   // fires when the drift settles
 *
 * The scene registers the actual handler (_register) and emits arrival (_arrived);
 * those underscored methods are Code-internal.
 */
const arrivalCbs = new Set();
let handler = null;

export const cameraBus = {
  driftTo: (roomId, fromHeading = null) => { if (handler) handler(roomId, fromHeading); },
  onArrival: (cb) => { arrivalCbs.add(cb); return () => arrivalCbs.delete(cb); },
  isReady: () => Boolean(handler),
  _register: (fn) => { handler = fn; },
  _arrived: (roomId) => { for (const cb of arrivalCbs) cb(roomId); },
};
