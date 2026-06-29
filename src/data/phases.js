/**
 * Build phasing — which buildings come up when, across the 2026→2038 build-out.
 * Drives the whole-compound bird's-eye's phase opacity (earlier phases read solid;
 * later, planned phases read faint).
 *
 * FIRST-PASS GUESS (Jon/Design to correct) — a plausible core-out sequence:
 *   1 = the main house and what's attached to it
 *   2 = the living wings + pool
 *   3 = the outbuildings, set further out
 * The room table has no phase field yet, so this is the one place to set it; edit
 * the numbers here and the bird's-eye updates. Same spirit as facings.js.
 */
export const BUILDING_PHASE = {
  'Main Block': 1,
  'Orangery': 1,
  'Covered Walkway': 1,
  'Service Wing': 2,
  'Wharf Wing': 2,
  'Pool & Terrace': 2,
  'Motor Barn': 3,
  'Observatory': 3,
  'Cedar Pavilion': 3,
  'North Alley Pergola': 3,
};

/** The build phase for a building (null if unphased). */
export const phaseOf = (building) => BUILDING_PHASE[building] ?? null;
