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
const asset = (file) => (file ? `${import.meta.env.BASE_URL}lookbook_images/${file}` : null);

export const ANCESTORS = legacy.ancestors;
export const META = roomsData.meta;

export const ALL_ROOMS = roomsData.rooms.map((r) => {
  const join = ROOM_JOIN[r.id] || {};
  const content = join.source ? legacy.rooms[join.source] : null;
  return {
    ...r,
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
