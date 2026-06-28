/**
 * navStore — the single source of truth for "where am I in the app."
 *
 * Crumbs, the minimap, and the walk all read/write this one place, so they can
 * never disagree (Design's request). View modes: gallery | room | model.
 * `roomId` is the current room (room/model focus). Subscribe via useNav().
 */
import { ENTRY_ROOM } from '../data/adjacency.js';

let state = { mode: 'gallery', roomId: null, focusId: null, lastHeading: null };
const listeners = new Set();
const emit = () => { for (const fn of listeners) fn(state); };

export const getNav = () => state;
export const subscribeNav = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

function set(next) { state = { ...state, ...next }; emit(); }

export const nav = {
  goGallery: () => set({ mode: 'gallery', roomId: null, lastHeading: null }),
  goRoom: (id) => set({ mode: 'room', roomId: id, lastHeading: null }),
  // a walk step — carries the heading/vert so Design can animate arrival
  stepTo: (id, heading = null) => set({ mode: 'room', roomId: id, lastHeading: heading }),
  enterWalk: () => set({ mode: 'room', roomId: ENTRY_ROOM, lastHeading: null }),
  openModel: (focusId = null) => set({ mode: 'model', focusId, roomId: focusId ?? state.roomId }),
  back: () => set({ mode: 'gallery', roomId: null }),
  current: () => state.roomId,
};
