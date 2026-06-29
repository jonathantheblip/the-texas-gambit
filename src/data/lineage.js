/**
 * Ancestor lineage — the "color = building" system for the render-led Walk.
 *
 * The estate's ten buildings cluster into four ancestral lineages; on the Walk
 * surface, color encodes that lineage (the map fills, the exit-row left-stripe,
 * the caption swatch, the massing volume tint). Shared chroma/lightness, only hue
 * varies — so the lineages read as families at a glance.
 *
 * This is Design's palette for the experience layer. The 3D massing keeps Code's
 * per-building PALETTE (compoundModel.js); both honor the same meaning.
 * From Design's walk-data.js (handover 2026-06).
 */
import roomsData from './compound_rooms.json';

export const LINEAGES = {
  glebe: { name: 'The Glebe',            hex: '#7BA177', soft: 'rgba(123,161,119,.20)', edge: '#A9C7A4', fam: 'green' },
  ptown: { name: "Captain Jack's Wharf", hex: '#6189BE', soft: 'rgba(97,137,190,.20)',  edge: '#9DBADF', fam: 'blue'  },
  texas: { name: 'Texas Hill Country',   hex: '#C79E58', soft: 'rgba(199,158,88,.20)',  edge: '#E4C68C', fam: 'amber' },
  miss:  { name: 'Mississippi',          hex: '#A678B0', soft: 'rgba(166,120,176,.20)', edge: '#C9A6D0', fam: 'plum'  },
};

export const BUILDING_LINEAGE = {
  'Main Block':          'glebe',
  'Orangery':            'glebe',
  'Covered Walkway':     'glebe',
  'Service Wing':        'glebe',
  'Motor Barn':          'glebe',
  'Observatory':         'glebe',
  'Wharf Wing':          'ptown',
  'North Alley Pergola': 'ptown',
  'Cedar Pavilion':      'texas',
  'Pool & Terrace':      'texas',
};

const DEFAULT_KEY = 'glebe';

export const lineageKeyOf = (building) => BUILDING_LINEAGE[building] || DEFAULT_KEY;
export const lineageOf = (building) => LINEAGES[lineageKeyOf(building)];

// ── Dev guard: every building in the table must map to a lineage ──
if (import.meta.env?.DEV) {
  const buildings = new Set(roomsData.rooms.map((r) => r.building));
  for (const b of buildings) {
    if (!(b in BUILDING_LINEAGE)) console.warn(`[lineage] building '${b}' is not mapped to a lineage`);
  }
}
