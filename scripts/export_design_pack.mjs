// Export a PORTABLE data pack for Claude Design (who has no repo access).
// Emits real walk-graph + plan data so Design can prototype against the actual
// rooms/renders/adjacency, not stand-ins. Run: npm run export:design
// NOTE: mirrors the logic in src/data/adjacency.js — keep the two in sync.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rectDist, ANCHORS } from '../src/model/compoundModel.js';
import { ROOM_JOIN } from '../src/data/room_join.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const rooms = JSON.parse(fs.readFileSync(path.join(root, 'src/data/compound_rooms.json'), 'utf8')).rooms;
const legacy = JSON.parse(fs.readFileSync(path.join(root, 'src/data/legacy_content.json'), 'utf8'));

// ── adjacency (mirror of adjacency.js) ──
const LEVEL = { site: 0, ground: 0, upper: 1, loft: 1, crown: 2 };
const level = (r) => LEVEL[r.floor] ?? 0;
const GAP = 2, SHARE = 1;
const VERTICAL_LINKS = [['octagonal_stair_hall', 'upper_gallery_landing'], ['energy_forge', 'loft']];
const nameToId = Object.fromEntries(rooms.map((r) => [r.name, r.id]));
const OPENINGS = new Set();
for (const [a, b] of ANCHORS.allowOverlap) {
  const ia = nameToId[a], ib = nameToId[b];
  if (ia && ib) { OPENINGS.add(ia + '|' + ib); OPENINGS.add(ib + '|' + ia); }
}
const axisOverlap = (a, b) => ({
  x: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)),
  y: Math.max(0, Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y)),
});
const heading = (a, b) => {
  const dx = (b.x + b.w / 2) - (a.x + a.w / 2), dy = (b.y + b.d / 2) - (a.y + a.d / 2);
  return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'E' : 'W') : (dy >= 0 ? 'N' : 'S');
};
function neighborsOf(r) {
  const out = [];
  for (const o of rooms) {
    if (o.id === r.id || level(o) !== level(r)) continue;
    const ov = axisOverlap(r, o);
    if (rectDist(r, o) <= GAP && (ov.x > SHARE || ov.y > SHARE))
      out.push({ id: o.id, heading: heading(r, o), vert: null, via: OPENINGS.has(r.id + '|' + o.id) ? 'opening' : 'door', strength: Math.max(ov.x, ov.y) });
  }
  for (const [a, b] of VERTICAL_LINKS) {
    const other = a === r.id ? b : b === r.id ? a : null;
    if (!other) continue;
    const o = rooms.find((x) => x.id === other);
    if (o) out.push({ id: other, heading: null, vert: level(o) > level(r) ? 'up' : 'down', via: 'stair', strength: 30 });
  }
  return out.sort((p, q) => q.strength - p.strength).map(({ strength, ...n }) => n);
}

const webp = (file) => (file ? file.replace(/\.png$/i, '.webp') : null);

// ── plan ──
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const r of rooms) { minX = Math.min(minX, r.x); maxX = Math.max(maxX, r.x + r.w); minY = Math.min(minY, r.y); maxY = Math.max(maxY, r.y + r.d); }
const W = maxX - minX, H = maxY - minY;
const compoundPlan = {
  axes: 'x=East(+), y=North(+), feet', northUp: true, northAngleDeg: 0,
  bounds: { minX, maxX, minY, maxY, width: W, height: H },
  outliers: ['observatory_tower'],
  rooms: rooms.map((r) => ({ id: r.id, building: r.building, floor: r.floor, x: r.x, y: r.y, w: r.w, d: r.d, nx: (r.x - minX) / W, ny: (maxY - (r.y + r.d)) / H, nw: r.w / W, nh: r.d / H })),
};

// ── walk graph (the main pack) ──
const walk = rooms.map((r) => {
  const c = legacy.rooms[ROOM_JOIN[r.id]?.source] || null;
  return {
    id: r.id, name: r.name, building: r.building, floor: r.floor,
    render: webp(ROOM_JOIN[r.id]?.render),       // lookbook_images/<file>
    w: r.w, d: r.d, height: r.height, area: r.w * r.d,
    intent: c?.intent || null,
    neighbors: neighborsOf(r),
  };
});

const outDir = path.join(root, 'design-handoff');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'walk_graph.json'), JSON.stringify(walk, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'compound_plan.json'), JSON.stringify(compoundPlan, null, 2) + '\n');
console.log(`Wrote design-handoff/walk_graph.json (${walk.length} rooms) + compound_plan.json`);
