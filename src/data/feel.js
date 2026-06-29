/**
 * Feel-chips — the "stand here and you…" cues that surface on arrival and in the
 * Reading-the-Room sheet. They name the feeling of a space in a few words, the way
 * Helen designs (from feeling and reference, not spec).
 *
 * These are the CHIP OPTIONS shown per room (seeded by Design). Which chips a
 * person marks "on" is the shared human layer — that selection syncs (roomLayerStore),
 * the prompt list here does not. Per Jon: ship the chips, start notes empty.
 * From Design's walk-data.js (handover 2026-06).
 */
export const FEEL = {
  front_porch: ['Arriving home', 'Shade at 4pm', 'Where you kick off boots'],
  entry_hall_front_s_ctr: ['First breath inside', 'Stair pulls your eye up'],
  drawing_room_sw: ['Quiet, formal-ish', 'Art at every height', 'Fire in winter'],
  great_room_se: ['Where the family lands', 'Records on the turntable', 'Light floods in'],
  oval_dining_nw: ['Sunday lunch', "The Glebe's signature curve"],
  sunroom: ['Inside becomes outside', 'Glass dissolves to pool', 'Coffee at sunrise'],
  guest_sitting: ["Full Captain Jack's", 'Guests settle in'],
  library_ne: ['A place to write', 'Ladder to the high shelves'],
  pool_terrace: ['The edge of the world', 'Toes in the water', 'Texas dusk'],
  observatory_tower: ['Walk out to the stars', 'The folly at the far edge'],
};

// Generic cues for rooms without seeded chips, so the prompt is never empty.
export const GENERIC_FEEL = ['Calm', 'Bright', 'Social', 'Private', 'Cozy'];

/** The chip prompts to offer in a room (seeded if present, else generic). */
export const feelChipsFor = (id) => FEEL[id] || GENERIC_FEEL;
