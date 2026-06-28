/**
 * Adjacency engine — derives "which rooms can you walk to from here" from the
 * geometry (the source of truth). Turns the lookbook into a walk.
 *
 * Same level: rooms that share a wall (nearly touch + overlap on one axis).
 * Between levels: only through real circulation (the stairs) — you don't walk
 * up through a ceiling. Vertical links are named explicitly below.
 */
import roomsData from './compound_rooms.json';
import { rectDist } from '../model/compoundModel.js';

const rooms = roomsData.rooms;

// Walking level (not the floor *name*): ground & site are the same level.
const LEVEL = { site: 0, ground: 0, upper: 1, loft: 1, crown: 2 };
const level = (r) => LEVEL[r.floor] ?? 0;

const GAP = 2;     // feet edge-to-edge to count as adjoining
const SHARE = 1;   // min shared-wall length (so corners don't count)

// Real floor-to-floor connections (stairs). You change levels through these.
const VERTICAL_LINKS = [
  ['octagonal_stair_hall', 'upper_gallery_landing'], // Main Block grand stair
  ['energy_forge', 'loft'],                           // Motor Barn loft stair
];
const STAIR_STRENGTH = 30; // rank stair options near the top of the list

// The natural way in — where a walk through the house begins.
export const ENTRY_ROOM = 'front_porch';

function axisOverlap(a, b) {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y));
  return { x, y };
}

// Compass direction from a to b's centroid (x=East, y=North).
function direction(a, b) {
  const dx = (b.x + b.w / 2) - (a.x + a.w / 2);
  const dy = (b.y + b.d / 2) - (a.y + a.d / 2);
  return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'east' : 'west') : (dy >= 0 ? 'north' : 'south');
}

/** Walkable neighbors of a room, strongest connection first: [{ id, dir, strength }]. */
export function neighborsOf(id) {
  const r = rooms.find((x) => x.id === id);
  if (!r) return [];
  const out = [];

  // Same level → adjoining if they nearly touch and share a wall segment.
  for (const o of rooms) {
    if (o.id === id || level(o) !== level(r)) continue;
    const ov = axisOverlap(r, o);
    if (rectDist(r, o) <= GAP && (ov.x > SHARE || ov.y > SHARE)) {
      out.push({ id: o.id, dir: direction(r, o), strength: Math.max(ov.x, ov.y) });
    }
  }

  // Between levels → only through a named stair link.
  for (const [a, b] of VERTICAL_LINKS) {
    const other = a === id ? b : b === id ? a : null;
    if (!other) continue;
    const o = rooms.find((x) => x.id === other);
    if (o) out.push({ id: other, dir: level(o) > level(r) ? 'up' : 'down', strength: STAIR_STRENGTH });
  }

  return out.sort((a, b) => b.strength - a.strength);
}
