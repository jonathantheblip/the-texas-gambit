/**
 * Build phasing — which buildings come up when, across the compound build-out.
 * Drives the whole-compound bird's-eye's phase fade (earlier phases read solid;
 * later, planned phases read faint) and the per-building phase label.
 *
 * From the Hill Country Estate Master Plan v3 (24 June 2026), Part V — Construction
 * Phasing + Appendix B. The room table carries no phase field, so this is the one
 * place it lives; edit here and the bird's-eye updates.
 *   2A (2034–2036, "minimum viable compound"): Main Block, Wharf Wing shell,
 *      Covered Walkway, Cedar (Utility) Pavilion.
 *   2B (2035–2037): Service Wing, Orangery, Pool & Terrace (+ the North Alley grape
 *      pergola, which rides with the Orangery / Ring-2 landscape — inferred; the plan
 *      doesn't phase the pergola structure explicitly).
 *   2C (2037–2040): Motor Barn, Observatory.
 * (Phase 0/1 are pre-construction + site work; Phase 3 is ongoing — no buildings.)
 */
export const BUILDING_PHASE = {
  'Main Block': '2A',
  'Wharf Wing': '2A',
  'Covered Walkway': '2A',
  'Cedar Pavilion': '2A',
  'Service Wing': '2B',
  'Orangery': '2B',
  'Pool & Terrace': '2B',
  'North Alley Pergola': '2B',
  'Motor Barn': '2C',
  'Observatory': '2C',
};

// Earliest → latest, for the opacity fade.
export const PHASE_ORDER = ['2A', '2B', '2C'];

/** The build-phase label for a building ('2A' | '2B' | '2C' | null). */
export const phaseOf = (building) => BUILDING_PHASE[building] ?? null;

/** 1-based rank of a building's phase (for the opacity fade); null if unphased. */
export const phaseRankOf = (building) => {
  const i = PHASE_ORDER.indexOf(BUILDING_PHASE[building]);
  return i < 0 ? null : i + 1;
};
