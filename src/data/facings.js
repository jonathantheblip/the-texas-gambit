/**
 * Per-room arrival FACING for the step-into — massing.open(roomId, { facing }).
 *
 * N/E/S/W = the compass the 3D camera opens toward (≈ the render's viewpoint)
 * before handing off to free orbit. Method (Design): default = look ACROSS the
 * room from its main doorway (opposite the strongest neighbor — where hero renders
 * are usually shot from); overrides for rooms that clearly face a feature/view
 * (front porch → N into the house, sunroom → S to the pool, pool → E to the canyon).
 *
 * A considered first pass from Design (handover 2026-06) — tunable per room, live
 * in the app. Keyed by the same room ids as compound_rooms.json.
 */
export const FACINGS = {
  drawing_room_sw: 'S',
  great_room_se: 'S',
  oval_dining_nw: 'N',
  library_ne: 'E',
  entry_hall_front_s_ctr: 'N',
  octagonal_stair_hall: 'N',
  everyday_dining_n_ctr: 'E',
  powder_room: 'E',
  front_porch: 'N',
  study_sw_over_drawing: 'S',
  rafa_s_texas_room_se_over_great: 'S',
  aurelia_s_provincetown_suite_nw_over_oval: 'N',
  primary_bedroom_ne_over_library: 'N',
  quiet_room_s_ctr: 'E',
  upper_gallery_landing: 'E',
  primary_dressing: 'E',
  primary_en_suite_teal: 'W',
  pink_en_suite_aurelia: 'S',
  rafa_en_suite: 'S',
  primary_terrace: 'E',
  dome_oculus: 'N',
  orangery: 'N',
  covered_walkway: 'W',
  kitchen: 'S',
  pantry_wine_room: 'N',
  scullery: 'W',
  mudroom: 'E',
  mechanical_laundry: 'E',
  tea_station: 'E',
  glass_bridge: 'E',
  right_passage_freddy_s_gallery: 'E',
  sunroom: 'S',
  guest_bedroom: 'W',
  guest_sitting: 'E',
  guest_en_suite: 'N',
  pool_bath: 'E',
  sauna: 'S',
  cornelia_s_greenhouse: 'W',
  vehicle_bay_1: 'W',
  vehicle_bay_2: 'E',
  vehicle_bay_3: 'E',
  energy_forge: 'E',
  airlock: 'E',
  compute_room: 'S',
  research_room: 'N',
  instrument_bay_upgrade: 'N',
  loft: 'S',
  podcast_studio: 'N',
  observatory_tower: 'S',
  cedar_pavilion: 'N',
  pool: 'W',
  pool_terrace: 'E',
  north_alley_pergola: 'N',
};

/** The N/E/S/W the camera should open toward arriving in a room (null = isometric default). */
export const facingOf = (id) => FACINGS[id] || null;
