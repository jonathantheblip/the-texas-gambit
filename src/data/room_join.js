/**
 * Reconciliation join — the bridge between the two data models.
 *
 *   compound_rooms.json (geometry, 53 rooms, snake_case ids)
 *      ⟷  legacy_content.json (the writing, 39 entries, kebab ids)
 *      ⟷  public/lookbook_images/*.png (the colored-pencil renders)
 *
 * `source`  = the legacy room id whose intent / ancestors / specs this space inherits
 *             (sub-rooms borrow their parent's writing; null = no writing yet).
 * `render`  = the hero image filename in public/lookbook_images (null = no render yet).
 *
 * Authored by hand against the ACTUAL asset folder — not generated, not invented.
 * rooms.js asserts every key here exists in the geometry table and that every
 * geometry room id appears here, so a typo can't silently drop a join.
 */
export const ROOM_JOIN = {
  // ── Main Block · ground ──
  drawing_room_sw:                            { source: 'drawing-room',   render: 'mbg_drawingroom_hero.png' },
  great_room_se:                              { source: 'great-room',     render: 'mbg_greatroom_hero.png' },
  oval_dining_nw:                             { source: 'oval-dining',    render: 'mbg_ovaldining_hero.png' },
  library_ne:                                 { source: 'library',        render: 'mbg_library_hero.png' },
  entry_hall_front_s_ctr:                     { source: 'entry-hall',     render: 'mbg_entryhall_hero.png' },
  octagonal_stair_hall:                       { source: 'entry-hall',     render: null }, // the grand stair; shares the entry's writing
  everyday_dining_n_ctr:                      { source: 'everyday-dining',render: 'mbg_everydaydining_hero.png' },
  powder_room:                                { source: 'powder-room',    render: 'mbg_powderroom_hero.png' },
  front_porch:                                { source: 'front-porch',    render: 'mbg_frontporch_hero.png' },

  // ── Main Block · upper ──
  study_sw_over_drawing:                      { source: 'study',          render: 'mbu_study_hero.png' },
  rafa_s_texas_room_se_over_great:            { source: 'rafa-texas-room',render: 'mbu_rafatexasroom_hero.png' },
  aurelia_s_provincetown_suite_nw_over_oval:  { source: 'aurelias-room',  render: 'mbu_aureliaroom_hero.png' },
  primary_bedroom_ne_over_library:            { source: 'primary-suite',  render: 'mbu_primarysuite_hero.png' },
  quiet_room_s_ctr:                           { source: 'quiet-room',     render: 'mbu_quietroom_hero.png' },
  upper_gallery_landing:                      { source: 'upper-gallery',  render: 'mbu_uppergallery_hero.png' },
  primary_dressing:                           { source: 'primary-suite',  render: 'mbu_dressingroom_hero.png' },
  primary_en_suite_teal:                      { source: 'primary-suite',  render: 'mbu_primaryensuite_hero.png' },
  pink_en_suite_aurelia:                      { source: 'aurelias-room',  render: 'mbu_aureliaensuite_hero.png' },
  rafa_en_suite:                              { source: 'rafa-texas-room',render: 'mbu_rafaensuite_hero.png' },
  primary_terrace:                            { source: 'primary-suite',  render: 'mbu_primaryterrace_hero.png' },

  // ── Main Block · crown ──
  dome_oculus:                                { source: null,             render: 'mbg_oculus-staircase_hero.png' },

  // ── Orangery ──
  orangery:                                   { source: 'orangery',       render: 'mbg_orangery_hero.png' },

  // ── Covered Walkway ──
  covered_walkway:                            { source: 'covered-walkway',render: 'ob_coveredwalkway_hero.png' },

  // ── Service Wing ──
  kitchen:                                    { source: 'kitchen',        render: 'sw_kitchen_hero.png' },
  pantry_wine_room:                           { source: 'pantry',         render: 'sw_pantry_hero.png' }, // combined Pantry + Wine Room
  scullery:                                   { source: 'scullery',       render: 'sw_scullery_hero.png' },
  mudroom:                                    { source: 'mudroom',        render: 'sw_mudroom_hero.png' },
  mechanical_laundry:                         { source: null,             render: 'sw_laundry_hero.png' },
  tea_station:                                { source: null,             render: 'sw_teastation_hero.png' },

  // ── Wharf Wing ──
  glass_bridge:                               { source: 'glass-bridge',   render: 'ww_glassbridge_hero.png' },
  right_passage_freddy_s_gallery:             { source: 'right-passage',  render: 'mbg_rightpassage_hero.png' },
  sunroom:                                    { source: 'sunroom',        render: 'ww_sunroom_hero.png' },
  guest_bedroom:                              { source: 'guest-suite',    render: 'ww_guestbedroom_hero.png' },
  guest_sitting:                              { source: 'guest-suite',    render: 'ww_guestsitting_hero.png' },
  guest_en_suite:                             { source: 'guest-suite',    render: 'ww_guestensuite_hero.png' },
  pool_bath:                                  { source: null,             render: 'ww_poolbath_hero.png' },
  sauna:                                      { source: null,             render: 'ob_sauna_hero.png' },

  // ── Motor Barn ──
  cornelia_s_greenhouse:                      { source: 'greenhouse',     render: 'ob_motorbarngreenhouse_hero.png' },
  vehicle_bay_1:                              { source: 'garage',         render: 'ob_motorbarngarage_hero.png' },
  vehicle_bay_2:                              { source: 'garage',         render: 'ob_motorbarngarage_hero.png' },
  vehicle_bay_3:                              { source: 'garage',         render: 'ob_motorbarngarage_hero.png' },
  energy_forge:                               { source: 'motor-barn-utility', render: 'ob_motorbarn-energyforge_hero.png' },
  airlock:                                    { source: null,             render: 'ob_motorbarn-airlock_hero.png' },
  compute_room:                               { source: null,             render: 'ob_motorbarn-computeroom_hero.png' },
  research_room:                              { source: null,             render: 'ob_motorbarn-researchroom_hero.png' },
  instrument_bay_upgrade:                     { source: null,             render: 'ob_motorbarn-instrumentbay_hero.png' },

  // ── Motor Barn · loft ──
  loft:                                       { source: 'motor-barn-loft',render: 'ob_motorbarnloft_hero.png' },
  podcast_studio:                             { source: 'motor-barn-loft',render: 'ob_motorbarn-podcaststudio_hero.png' }, // carved inside the Loft

  // ── Observatory ──
  observatory_tower:                          { source: 'observatory',    render: 'ob_observatoryint_hero.png' },

  // ── Cedar Pavilion ──
  cedar_pavilion:                             { source: 'pavilion',       render: 'ob_pavilion_hero.png' },

  // ── Pool & Terrace ──
  pool:                                       { source: 'pool-terrace',   render: 'od_poolzeroentry_hero.png' },
  pool_terrace:                               { source: 'pool-terrace',   render: 'od_poolinfinity_hero.png' },

  // ── North Alley Pergola ──
  north_alley_pergola:                        { source: 'grape-pergola',  render: 'ext_northalley_hero.png' },
};

/** Building-level "arrival" exteriors (for the render-forward shell later). */
export const BUILDING_RENDERS = {
  'Main Block':     'ext_frontelevation_hero.png',
  'Wharf Wing':     'ext_wharfwing_hero.png',
  'Motor Barn':     'ob_motorbarnext_hero.png',
  'Observatory':    'ob_observatoryextday_hero.png',
  'Pool & Terrace': 'ext_poolterrace_hero.png',
};

/** The whole-compound front-door render. */
export const COMPOUND_RENDER = 'ext_compoundapproach_hero.png';
