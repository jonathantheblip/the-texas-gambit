/**
 * flyto — small, framework-free helpers for the walk-between fly-to.
 *
 * The Walk reads/writes a "Fly" preference (persisted, so Helen's choice sticks
 * across sessions) and asks for the compass the camera should arrive looking
 * toward when it flies from one room to an adjoining one.
 *
 * Pure + storage-guarded so it tests in Node (no localStorage) and degrades to
 * the default if storage is unavailable (private mode, etc.).
 */
import { facingOf } from '../data/facings.js';

const KEY = 'tg.fly';

/** Is fly-to-between-rooms on? Defaults ON when unset or storage is unavailable. */
export function getFlyEnabled() {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

/** Persist the Fly preference (best-effort; never throws). */
export function setFlyEnabled(on) {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* ignore */ }
}

/**
 * The N/E/S/W the camera should open toward as it arrives in `toId`.
 *  - A flat walk (door/opening) → arrive along the heading you travelled, so the
 *    move reads as "you kept going that way" into the next room.
 *  - A stair or a non-adjacent jump (no heading) → the room's considered pose
 *    (facings.js), i.e. the same arrival the step-into uses.
 * `rel` is the neighborsOf() link you took (or null for a map teleport).
 */
export function arrivalFacing(rel, toId) {
  if (rel && rel.heading) return rel.heading;
  return facingOf(toId);
}
