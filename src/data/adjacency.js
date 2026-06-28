/**
 * Adjacency engine — derives "which rooms can you walk to from here" straight
 * from the geometry (the source of truth). This is the primitive that turns the
 * lookbook into a walk: from any space, the rooms that share a wall (same level)
 * or stack directly above/below (stairs) become the steps Helen can take.
 *
 * Pure geometry; the UI joins these ids back to the enriched rooms for renders.
 */
import roomsData from './compound_rooms.json';
import { rectDist, overlapArea } from '../model/compoundModel.js';

const rooms = roomsData.rooms;

// Vertical level (not the floor *name*): ground & site are the same walking level.
const LEVEL = { site: 0, ground: 0, upper: 1, loft: 1, crown: 2 };
const level = (r) => LEVEL[r.floor] ?? 0;

const GAP = 2;            // feet: rooms within 2' edge-to-edge count as adjoining
const SHARE = 1;          // feet: minimum shared-wall length (so corners don't count)
const STACK = 0.4;        // fraction of footprint that must overlap to count as stacked

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
  for (const o of rooms) {
    if (o.id === id) continue;
    if (level(o) === level(r)) {
      // same level → adjoining if they nearly touch and share a wall segment
      const ov = axisOverlap(r, o);
      if (rectDist(r, o) <= GAP && (ov.x > SHARE || ov.y > SHARE)) {
        out.push({ id: o.id, dir: direction(r, o), strength: Math.max(ov.x, ov.y) });
      }
    } else if (Math.abs(level(o) - level(r)) === 1) {
      // one level apart → connected if stacked over each other (a stair link)
      const ov = overlapArea(r, o);
      if (ov > STACK * Math.min(r.w * r.d, o.w * o.d)) {
        out.push({ id: o.id, dir: level(o) > level(r) ? 'up' : 'down', strength: ov });
      }
    }
  }
  return out.sort((a, b) => b.strength - a.strength);
}
