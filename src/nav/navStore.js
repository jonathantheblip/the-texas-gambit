/**
 * navStore — the single source of truth for "where am I in the app."
 * Crumbs, minimap, and the walk all read/write here so they never disagree.
 *
 * Modes: gallery | room | model. `fromWalk` marks a model entry that came by
 * stepping through a render (so the back control returns to the walk, and App
 * runs the render→massing cross-fade). `facing` is the N/E/S/W arrival pose.
 */
import { ENTRY_ROOM } from '../data/adjacency.js';

let state = { mode: 'gallery', roomId: null, focusId: null, facing: null, fromWalk: false, lastHeading: null };
const listeners = new Set();
const emit = () => { for (const fn of listeners) fn(state); };

export const getNav = () => state;
export const subscribeNav = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

function set(next) { state = { ...state, ...next }; emit(); }

export const nav = {
  goGallery: () => set({ mode: 'gallery', roomId: null, focusId: null, facing: null, fromWalk: false, lastHeading: null }),
  goRoom: (id) => set({ mode: 'room', roomId: id, fromWalk: false, lastHeading: null }),
  stepTo: (id, heading = null) => set({ mode: 'room', roomId: id, fromWalk: false, lastHeading: heading }),
  enterWalk: () => set({ mode: 'room', roomId: ENTRY_ROOM, fromWalk: false, lastHeading: null }),
  openModel: (focusId = null) => set({ mode: 'model', focusId, roomId: focusId ?? state.roomId, facing: null, fromWalk: false }),
  // step through a render into the massing, focused on the room (with arrival pose)
  enterMassing: (id, facing = null) => set({ mode: 'model', focusId: id, roomId: id, facing, fromWalk: true }),
  back: () => set({ mode: 'gallery', roomId: null }),
  current: () => state.roomId,
};
