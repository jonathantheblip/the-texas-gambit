/**
 * navStore — the single source of truth for "where am I in the app."
 * Crumbs, minimap, and the walk all read/write here so they never disagree.
 *
 * Modes: gallery | room | model. `fromWalk` marks a model entry that came by
 * stepping through a render (so the back control returns to the walk, and App
 * runs the render→massing cross-fade). `facing` is the N/E/S/W arrival pose.
 */
import { ENTRY_ROOM } from '../data/adjacency.js';
import { facingOf } from '../data/facings.js';
import { canonicalId } from '../data/aliases.js';

let state = { mode: 'gallery', roomId: null, focusId: null, facing: null, fromWalk: false, lastHeading: null, decisionId: null };
const listeners = new Set();
const emit = () => { for (const fn of listeners) fn(state); };

export const getNav = () => state;
export const subscribeNav = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

function set(next) { state = { ...state, ...next }; emit(); }

export const nav = {
  goGallery: () => set({ mode: 'gallery', roomId: null, focusId: null, facing: null, fromWalk: false, lastHeading: null, decisionId: null }),
  // ids are canonicalized (aliases.js) so you never land on a room that's really
  // half of another space — e.g. the Octagonal Stair Hall resolves to the Entry Hall.
  goRoom: (id) => set({ mode: 'room', roomId: canonicalId(id), fromWalk: false, lastHeading: null }),
  stepTo: (id, heading = null) => set({ mode: 'room', roomId: canonicalId(id), fromWalk: false, lastHeading: heading }),
  enterWalk: () => set({ mode: 'room', roomId: ENTRY_ROOM, fromWalk: false, lastHeading: null }),
  openModel: (focusId = null) => { const cid = focusId ? canonicalId(focusId) : null; set({ mode: 'model', focusId: cid, roomId: cid ?? state.roomId, facing: null, fromWalk: false }); },
  // step through a render into the massing, focused on the room (with arrival pose).
  // Facing defaults to the room's considered pose (facings.js) so every step-into
  // opens toward the render's viewpoint, then hands off to free orbit.
  enterMassing: (id, facing = null) => { const cid = canonicalId(id); set({ mode: 'model', focusId: cid, roomId: cid, facing: facing ?? facingOf(cid), fromWalk: true }); },
  back: () => set({ mode: 'gallery', roomId: null }),
  current: () => state.roomId,
  // Open Decisions: a standalone surface, reachable from the primary nav (Gallery)
  // or by deep-linking off a decision pin. `roomId` is left untouched so "back"
  // returns to wherever you came from (a room, or the gallery).
  goDecisions: (decisionId = null) => set({ mode: 'decisions', decisionId }),
};
