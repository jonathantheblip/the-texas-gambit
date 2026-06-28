/**
 * Adjacency engine — "which rooms can you walk to from here," from the geometry.
 *
 * neighborsOf(id) → [{ id, heading, vert, via, strength }], strongest first:
 *   heading : 'N'|'E'|'S'|'W'  — compass direction to the neighbor (null for stairs)
 *   vert    : 'up'|'down'|null — set only for stair links (Design lifts/drops)
 *   via     : 'door'|'opening'|'stair' — how they connect (animation hint)
 *   strength: shared-wall length (sort key; not for display)
 *
 * Same level: rooms that share a wall. Between levels: only through real stairs.
 */
import roomsData from './compound_rooms.json';
import { rectDist, ANCHORS } from '../model/compoundModel.js';

const rooms = roomsData.rooms;
const nameToId = Object.fromEntries(rooms.map((r) => [r.name, r.id]));

const LEVEL = { site: 0, ground: 0, upper: 1, loft: 1, crown: 2 };
const level = (r) => LEVEL[r.floor] ?? 0;

const GAP = 2;
const SHARE = 1;

// Real floor-to-floor connections (stairs).
const VERTICAL_LINKS = [
  ['octagonal_stair_hall', 'upper_gallery_landing'],
  ['energy_forge', 'loft'],
];
const STAIR_STRENGTH = 30;

// Carved-child / open-to-above pairs connect by an opening, not a door.
const OPENINGS = new Set();
for (const [a, b] of ANCHORS.allowOverlap) {
  const ia = nameToId[a], ib = nameToId[b];
  if (ia && ib) { OPENINGS.add(ia + '|' + ib); OPENINGS.add(ib + '|' + ia); }
}

/** The natural way in — where a walk through the house begins. */
export const ENTRY_ROOM = 'front_porch';

function axisOverlap(a, b) {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y));
  return { x, y };
}
function heading(a, b) {
  const dx = (b.x + b.w / 2) - (a.x + a.w / 2);
  const dy = (b.y + b.d / 2) - (a.y + a.d / 2);
  return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'E' : 'W') : (dy >= 0 ? 'N' : 'S');
}

export function neighborsOf(id) {
  const r = rooms.find((x) => x.id === id);
  if (!r) return [];
  const out = [];

  for (const o of rooms) {
    if (o.id === id || level(o) !== level(r)) continue;
    const ov = axisOverlap(r, o);
    if (rectDist(r, o) <= GAP && (ov.x > SHARE || ov.y > SHARE)) {
      out.push({
        id: o.id,
        heading: heading(r, o),
        vert: null,
        via: OPENINGS.has(r.id + '|' + o.id) ? 'opening' : 'door',
        strength: Math.max(ov.x, ov.y),
      });
    }
  }

  for (const [a, b] of VERTICAL_LINKS) {
    const other = a === id ? b : b === id ? a : null;
    if (!other) continue;
    const o = rooms.find((x) => x.id === other);
    if (o) out.push({ id: other, heading: null, vert: level(o) > level(r) ? 'up' : 'down', via: 'stair', strength: STAIR_STRENGTH });
  }

  return out.sort((a, b) => b.strength - a.strength);
}
