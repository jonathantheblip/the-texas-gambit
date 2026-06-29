/**
 * The single place the app reads rooms from. Merges the three sources:
 *   geometry (compound_rooms.json) + the join (room_join.js) + writing (legacy_content.json)
 * into enriched room objects. Geometry stays the source of truth; the writing and
 * renders are joined on top, never the other way round.
 */
import roomsData from './compound_rooms.json';
import legacy from './legacy_content.json';
import { PALETTE } from '../model/compoundModel.js';
import { ROOM_JOIN, BUILDING_RENDERS, COMPOUND_RENDER } from './room_join.js';

// public/ assets resolve under Vite's base ('/' in dev, '/the-texas-gambit/' in build).
// Renders are served as WebP (90% smaller than the source PNGs); the join still
// names .png, so rewrite the extension here in one place.
const asset = (file) => (file ? `${import.meta.env.BASE_URL}lookbook_images/${file.replace(/\.png$/i, '.webp')}` : null);

export const ANCESTORS = legacy.ancestors;
export const META = roomsData.meta;

// Plain-language display name for the UI: drop the architect's positional suffix
// ("(front, S-ctr)", "(SW)", "(NW, over Oval)") that Helen shouldn't have to read.
// The full r.name stays the source of truth — validation anchors key on it.
const prettyName = (name) => name.replace(/\s*\([^)]*\)\s*$/, '').trim();
const FLOOR_LABEL = { ground: 'Ground', upper: 'Upper', loft: 'Loft', crown: 'Roof', site: 'Outdoor' };

export const ALL_ROOMS = roomsData.rooms.map((r) => {
  const join = ROOM_JOIN[r.id] || {};
  const content = join.source ? legacy.rooms[join.source] : null;
  return {
    ...r,
    name: r.name,                     // full, technical — kept for validation/anchors
    displayName: prettyName(r.name),  // what Helen reads everywhere in the UI
    floorLabel: FLOOR_LABEL[r.floor] || r.floor,
    area: r.w * r.d,                  // always derived from the footprint
    renderImage: asset(join.render),  // the colored-pencil hero (null = none yet)
    intent: content?.intent || null,  // the writing (null = not written yet)
    ancestors: content?.ancestors || [],
    specs: content?.specs || null,
    phase: content?.phase || null,
    helenNote: content?.helenNote || null,
    contentSource: join.source || null,
  };
});

const FLOOR_ORDER = ['ground', 'upper', 'loft', 'crown', 'site'];
export const BUILDINGS = Object.keys(PALETTE).filter((b) => ALL_ROOMS.some((r) => r.building === b));
export const FLOORS = FLOOR_ORDER.filter((f) => ALL_ROOMS.some((r) => r.floor === f));

export const buildingRender = (b) => asset(BUILDING_RENDERS[b]);
export const compoundRender = asset(COMPOUND_RENDER);

/**
 * Apply sparse {x,y,w,d,height} edits on top of the base rooms.
 * Geometry stays the source; an override is just "someone nudged this wall."
 * Recomputes the derived fields (area, zCeil) so validation + render stay honest.
 */
export function applyOverrides(rooms, overrides) {
  if (!overrides || !Object.keys(overrides).length) return rooms;
  return rooms.map((r) => {
    const o = overrides[r.id];
    if (!o) return r;
    const w = o.w ?? r.w, d = o.d ?? r.d, height = o.height ?? r.height;
    const x = o.x ?? r.x, y = o.y ?? r.y;
    return { ...r, x, y, w, d, height, zCeil: r.zFloor + height, area: w * d, edited: true, editedBy: o.updatedBy || null, editedAt: o.updatedAt || null };
  });
}

// Geometry-only projection (for export / round-trip back to compound_rooms.json).
const GEOM_KEYS = ['id', 'name', 'building', 'section', 'floor', 'x', 'y', 'w', 'd', 'zFloor', 'zCeil', 'height', 'area', 'tag', 'render', 'notes'];
export function toGeometryTable(rooms) {
  return { meta: META, rooms: rooms.map((r) => GEOM_KEYS.reduce((a, k) => (r[k] !== undefined ? ((a[k] = r[k]), a) : a), {})) };
}

// Diff an imported geometry table back into sparse overrides vs the base rooms.
const EDIT_KEYS = ['x', 'y', 'w', 'd', 'height'];
export function tableToOverrides(importedRooms) {
  const base = new Map(roomsData.rooms.map((r) => [r.id, r]));
  const out = {};
  for (const r of importedRooms || []) {
    const b = base.get(r.id);
    if (!b) continue;
    const diff = {};
    for (const k of EDIT_KEYS) if (r[k] != null && r[k] !== b[k]) diff[k] = r[k];
    if (Object.keys(diff).length) out[r.id] = diff;
  }
  return out;
}

// ── Dev guard: the join must stay aligned with the geometry table ──
if (import.meta.env.DEV) {
  const ids = new Set(roomsData.rooms.map((r) => r.id));
  for (const k of Object.keys(ROOM_JOIN)) {
    if (!ids.has(k)) console.warn(`[join] '${k}' is not a room in compound_rooms.json`);
  }
  for (const r of roomsData.rooms) {
    if (!(r.id in ROOM_JOIN)) console.warn(`[join] geometry room '${r.id}' is missing from ROOM_JOIN`);
  }
  const withRender = ALL_ROOMS.filter((r) => r.renderImage).length;
  const withIntent = ALL_ROOMS.filter((r) => r.intent).length;
  console.info(`[rooms] ${ALL_ROOMS.length} spaces · ${withRender} with renders · ${withIntent} with writing`);
}
