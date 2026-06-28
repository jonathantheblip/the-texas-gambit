/**
 * Plan geometry for wayfinding maps — the room footprints + bounds + north,
 * derived from the source table. Design reads this to draw the minimap / overview
 * however it likes (and to fold the room-level map into the compound crumbs).
 *
 * Convention: x = East(+), y = North(+), feet. North is up (northAngleDeg = 0).
 * Each room is an axis-aligned rectangle, so its footprint IS its bbox.
 * `n*` fields are normalized 0..1 with north up (ny measured from the top).
 */
import roomsData from './compound_rooms.json';

const rooms = roomsData.rooms;

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const r of rooms) {
  minX = Math.min(minX, r.x); maxX = Math.max(maxX, r.x + r.w);
  minY = Math.min(minY, r.y); maxY = Math.max(maxY, r.y + r.d);
}
const W = maxX - minX, H = maxY - minY;

export const compoundPlan = {
  axes: 'x=East(+), y=North(+), feet',
  northUp: true,
  northAngleDeg: 0,
  bounds: { minX, maxX, minY, maxY, width: W, height: H },
  // The Observatory sits ~270' south of everything — flagged so Design can drop
  // it from the house plan or show it at the edge.
  outliers: ['observatory_tower'],
  rooms: rooms.map((r) => ({
    id: r.id,
    building: r.building,
    floor: r.floor,
    x: r.x, y: r.y, w: r.w, d: r.d,           // feet (footprint = bbox)
    nx: (r.x - minX) / W,                       // normalized, north up
    ny: (maxY - (r.y + r.d)) / H,
    nw: r.w / W,
    nh: r.d / H,
  })),
};
