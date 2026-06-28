// Hill Country Estate — full content model
// One source of truth: phases → buildings → rooms → images
// Plus: ancestors, design rules, decisions, locked specs, briefs, glossary

window.HCE = (function(){

const ANCESTORS = {
  glebe:   { id:'glebe',   name:'The Glebe',          place:'Marston St. Lawrence, Northants', desc:'Georgian bones, Palladian proportions, the architecture of permanence.', color:'#3a6040' },
  ptown:   { id:'ptown',   name:"Captain Jack's Wharf",place:'Provincetown, Cape Cod',          desc:'White walls, art everywhere, rattan & indigo, casual coastal soul.', color:'#3a6080' },
  texas:   { id:'texas',   name:'Texas Hill Country',  place:'Bandera County · 40 Acres',       desc:'Limestone, live oaks, canyon views — the material & site palette.', color:'#b8860b' },
  miss:    { id:'miss',    name:'Mississippi',         place:"Cornelia's Greenhouse",            desc:'Appears once: utilitarian growing-spaces become architecture.', color:'#8b4789' },
};

const RULES = [
  { n:'I',   title:'The Shiplap Rule', body:'Horizontal planking is banned. Vertical beadboard is Provincetown. The distinction matters.' },
  { n:'II',  title:'Art Is the Wallpaper', body:'Every wall is white so that art, photographs, and children\'s drawings can fill them. The walls are the gallery; the family is the curator.' },
  { n:'III', title:'The Ceiling Is Just There', body:'Ceilings are honest — exposed roof structure where it exists, simple plaster where it doesn\'t. No coffered or tray ceilings, no faux beams.' },
  { n:'IV',  title:'The Human Layer', body:'Every room must contain evidence of the family that lives here. A turntable, a child\'s drawing, a stack of books, Helen\'s father\'s photographs.' },
  { n:'V',   title:'Three Ancestors, Not Three Themes', body:'The ancestors are balanced in every space — not blended arbitrarily. Each room lets one ancestor lead while the others play supporting roles.' },
];

// Helper to build images consistently
// We now have real renders for most rooms — treat anything passed via img() as a real photo.
// Use placeholder() below if you want a generated SVG placeholder.
const img = (slug, caption, alt) => ({ slug, caption, alt: alt||caption, src:`lookbook_images/${slug}`, real:true });
const placeholder = (slug, caption, alt) => ({ slug, caption, alt: alt||caption, src:`lookbook_images/${slug}` });
// Real-image variant — flagged as photo, no placeholder fallback
const photo = (file, caption, alt) => ({ slug:file, caption, alt: alt||caption, src:`lookbook_images/${file}`, real:true });

const ROOMS = [
  // ── PHASE 2A · MAIN BLOCK ─────────────────────────────────────────────
  {
    id:'front-porch', building:'main-block', floor:'ground', phase:'2A',
    name:'The Front Porch', tag:'The First Room', x:50, y:78,
    ancestors:['glebe','texas'],
    intent:'Twelve feet deep because Texas demands it. Georgian column proportions because the Glebe demands it. A painted wood floor because Provincetown demands it. The room where coffee happens at dawn and bourbon at dusk.',
    images:[ photo('mbg_frontporch_hero.png','Twelve Feet of Texas Shade') ],
    specs:[ {k:'Depth', v:'12 ft'}, {k:'Floor', v:'Painted wood plank'}, {k:'Door', v:'Mesquite/cedar w/ fanlight + sidelights'} ],
  },
  {
    id:'entry-hall', building:'main-block', floor:'ground', phase:'2A',
    name:'The Entry Hall', tag:'The Grand Stair', x:50, y:60,
    ancestors:['glebe','ptown'], radiant:true,
    intent:'Double-height. Heated limestone floor (geothermal). Grand straight-run Georgian stair with white balusters and a dark handrail. Helen\'s father\'s photographs line the stair wall. Fanlight throws a half-moon of light across the floor every morning.',
    images:[ photo('mbg_entryhall_hero.png','Fanlight, Grand Stair, Heated Limestone') ],
    specs:[ {k:'Floor', v:'Limestone, geothermal radiant'}, {k:'Stair', v:'Straight-run, white balusters, dark handrail'} ],
  },
  {
    id:'drawing-room', building:'main-block', floor:'ground', phase:'2A',
    name:'The Drawing Room', tag:'Art Is the Wallpaper', x:30, y:55,
    ancestors:['glebe','ptown'],
    intent:'Formal, but only formally so. White walls hung with art at every height. Two tall sash windows flanking the fireplace. Leather Chesterfield, mismatched rattan armchairs. Sea glass on the mantel.',
    images:[ photo('mbg_drawingroom_hero.png','The Fireplace Wall, Art Everywhere') ],
    specs:[ {k:'Walls', v:'Level-5 plaster, white'}, {k:'Fireplace', v:'Limestone surround'} ],
  },
  {
    id:'great-room', building:'main-block', floor:'ground', phase:'2A',
    name:'The Great Room', tag:'The Everyday Heart', x:70, y:55,
    ancestors:['glebe','ptown','texas'],
    intent:'The room where the family actually lives. Double-height on the garden side, tall sash windows flooding the space with Hill Country light. Turntable on a low credenza. Linen sofas, rattan armchair, coffee table buried in books and children\'s drawings. Limestone fireplace wall left bare.',
    images:[ photo('mbg_greatroom_hero.png','The Everyday Heart'), photo('mbg_greatroom_alt.png','Turntable Wall & Canyon Light') ],
    specs:[ {k:'Volume', v:'Double-height (garden side)'}, {k:'Fireplace', v:'Bare limestone — one of few exposed faces'} ],
  },
  {
    id:'oval-dining', building:'main-block', floor:'ground', phase:'2A',
    name:'The Oval Dining Room', tag:"The Glebe's Signature", x:25, y:35,
    ancestors:['glebe'],
    intent:'The most direct homage to the Glebe. Projecting oval bay with tall sash windows in cedar frames (Helen-locked). Dusty pink walls — the only color in the public rooms. Round pedestal table for eight. Brass chandelier with candle bulbs. Thanksgiving happens here.',
    images:[ photo('mbg_ovaldining_hero.png','Cedar Bay Windows, Dusty Pink Walls') ],
    specs:[ {k:'Bay frames', v:'Cedar (Helen-locked)'}, {k:'Walls', v:'Dusty pink'}, {k:'Table', v:'Round pedestal, seats 8'} ],
    helenNote:'Cedar over steel for the bay frames — warm, traditional, weathering to silver-grey outside. The room is warmer for it.',
  },
  {
    id:'everyday-dining', building:'main-block', floor:'ground', phase:'2A',
    name:'Everyday Dining', tag:'The Breakfast Table', x:50, y:35,
    ancestors:['glebe','ptown'],
    intent:'Casual family dining from day one. Farmhouse table, mismatched chairs, morning light from the east. Golden ochre walls, worn white Victorian chest, French doors opening north to the Orangery. Walnut prep island lives here in Phase 2A, then relocates to the Motor Barn in Phase 2B.',
    images:[ photo('mbg_everydaydining_hero.png','Permanent Configuration'), photo('mbg_everdaydiningtemp_hero.png','Phase 2A — w/ Walnut Prep Island') ],
    specs:[ {k:'Walls', v:'Golden ochre'}, {k:'Phase 2A', v:'Walnut prep island (relocates 2B)'} ],
  },
  {
    id:'library', building:'main-block', floor:'ground', phase:'2A',
    name:'The Library', tag:"A Writer's Studio with Georgian Proportions", x:75, y:35,
    ancestors:['glebe','ptown'],
    intent:'Canted bay window on the north face frames the canyon the way the Glebe\'s bay frames the Northamptonshire countryside. White-painted shelves to the ceiling on three walls, brass library ladder on a rail. Mesquite writing desk facing the bay. The leather chair by the window is the quietest seat in the house.',
    images:[ photo('mbg_library_hero.png','Canted Bay, Brass Ladder, Mesquite Desk') ],
    specs:[ {k:'Bay', v:'Canted, north-facing'}, {k:'Shelves', v:'White-painted, to ceiling'}, {k:'Desk', v:'Mesquite'} ],
    decision:{ id:'library-color', summary:'Wall color — deep teal-green or rich navy (Imber\'s call).' },
  },
  {
    id:'orangery', building:'main-block', floor:'ground', phase:'2A',
    name:'The Orangery', tag:'Three-Season Garden Room', x:50, y:20,
    ancestors:['glebe','texas'],
    intent:'Between the oval dining bay and the library bay on the north face. Inside and outside blur. Ceiling fans, daybed swing, deep rattan chairs with faded indigo cushions. Screens against insects, breeze through. Looking south, you can see all the way to the front porch.',
    images:[ photo('mbg_orangery_hero.png','The Orangery') ],
  },
  {
    id:'powder-room', building:'main-block', floor:'ground', phase:'2A',
    name:'The Powder Room', tag:'The Indigo Jewel Box · Storm Shelter', x:42, y:48,
    ancestors:['ptown','glebe'],
    intent:'The one room where color goes bold. Deep indigo walls — almost navy — white porcelain pedestal sink, brass-framed mirror, single sconce. Tiny and intentionally dramatic. Behind the door: ICF walls and poured concrete ceiling. This is Storm Shelter 2.',
    images:[ photo('mbg_powderroom_hero.png','Indigo Walls, Hidden Storm Shelter') ],
    specs:[ {k:'Walls', v:'Indigo (near-navy)'}, {k:'Structure', v:'ICF walls, poured concrete ceiling'}, {k:'Function', v:'Storm Shelter 2 (core)'} ],
  },
  {
    id:'right-passage', building:'main-block', floor:'ground', phase:'2A',
    name:'The Right Passage', tag:'The Longest Sight Line', x:80, y:48,
    ancestors:['ptown','glebe'],
    intent:'Standing at the west end, you look east through the passage, through the sunroom\'s open glass walls, across the pool terrace, past the perimeter-overflow pool, into the canyon. An unbroken line of sight from the Georgian heart of the house to the edge of the world.',
    images:[ photo('mbg_rightpassage_hero.png','Passage to Canyon') ],
  },
  {
    id:'upper-gallery', building:'main-block', floor:'upper', phase:'2A',
    name:'The Upper Gallery', tag:'The Salon Hang', x:50, y:50,
    ancestors:['ptown','glebe'],
    intent:'The landing at the top of the grand stair opens into a wide gallery connecting all four upper-floor rooms. Walls hung salon-style — paintings, photographs, children\'s art mixed at different heights. Small writing desk by the Palladian window at the north end.',
    images:[ photo('mbu_uppergallery_hero.png','Salon-Hung Art, Palladian Window') ],
  },
  {
    id:'primary-suite', building:'main-block', floor:'upper', phase:'2A',
    name:'The Main Bedroom Suite', tag:'The Private Wing', x:75, y:35,
    ancestors:['ptown','glebe'],
    intent:'White vertical beadboard feature wall behind the bed — direct Cape Cod. En suite: sea glass teal subway tile, freestanding tub by the arched window, heated limestone floors. The "widow\'s walk" terrace sits on the roof of the sunroom wing — accessible only from this room. Coffee at sunrise.',
    images:[
      photo('mbu_primarysuite_hero.png','Vertical Beadboard, Morning Light'),
      photo('mbu_primaryensuite_hero.png','En Suite — Sea Glass Teal Tile'),
      photo('mbu_primaryensuite_alt.png','En Suite — Freestanding Tub, Arched Window'),
      photo('mbu_dressingroom_hero.png','Dressing Room — Beadboard, Brass, Island'),
      photo('mbu_primaryterrace_hero.png','Primary Terrace — Coffee at Sunrise'),
    ],
    helenNote:'White vertical beadboard wall, sea glass teal tile in the en suite, heated limestone, the widow\'s walk over the sunroom. The most private place in the compound.',
    specs:[ {k:'Beadboard', v:'Vertical, white (CJ rule)'}, {k:'Tile', v:'Sea glass teal subway'}, {k:'Floors', v:'Heated limestone'} ],
  },
  {
    id:'study', building:'main-block', floor:'upper', phase:'2A',
    name:'The Study', tag:'Above the Drawing Room', x:25, y:55,
    ancestors:['glebe','ptown'],
    intent:'Above the Drawing Room. Bay window rotated to the south face, catching afternoon light. Smaller and more private than the Library. Desk, reading chair, bookshelves. The door closes and the house goes quiet. View south is all sky and live oaks.',
    images:[ photo('mbu_study_hero.png','South-Facing Bay, Afternoon Light') ],
  },
  {
    id:'quiet-room', building:'main-block', floor:'upper', phase:'2A',
    name:'The Quiet Room', tag:'Where the Ancestors Converge', x:50, y:38,
    ancestors:['glebe','ptown','texas'],
    intent:'The room where all three ancestors stop being separate threads and become one thing. White walls, good height, a beautiful window, almost nothing else. The single-pane picture window is an intentional deviation from the 12-over-12 rule — it frames the canyon as a painting. A guest sleeps better here than they have in years and can\'t quite explain why.',
    images:[
      photo('mbu_quietroom_hero.png','Stillness, Canyon Framed'),
      photo('mbu_quietroomensuite_hero.png','En Suite — Heated Limestone'),
    ],
    specs:[ {k:'Window', v:'Single-pane picture (12-over-12 exception)'}, {k:'Transom', v:'Triple-glazed acoustic, antique honey glass inner layer'} ],
  },
  {
    id:'aurelias-room', building:'main-block', floor:'upper', phase:'2A',
    name:"Aurelia's Room", tag:"The Explorer's Room", x:25, y:30,
    ancestors:['ptown','glebe'],
    intent:'Designed to work for a five-year-old now and a teenager later. White walls with one accent wall in soft indigo wash. Window seat with storage below. Picture books that will become novels. Her own art on the walls — framed properly.',
    images:[
      photo('mbu_aureliaroom_hero.png','Growing with Her'),
      photo('mbu_aureliaensuite_hero.png','En Suite — Warm Stone & White'),
    ],
    decision:{ id:'aurelia-trim', summary:'Exterior trim color — within the Wharf Wing blue-family vocabulary. Imber\'s call.' },
  },
  {
    id:'rafa-texas-room', building:'main-block', floor:'upper', phase:'2A',
    name:"Rafa's Texas Room", tag:'The Room That Belongs to the Land', x:75, y:30,
    ancestors:['texas'],
    intent:'The most Texan room in the house. One wall of exposed limestone left bare because the stone was too beautiful to cover. Pendleton blanket on the bed. Butterfly chair. Boots by the door. The child who will grow up knowing this land by the bottoms of his feet.',
    images:[
      photo('mbu_rafatexasroom_hero.png','Limestone Wall, Canyon View'),
      photo('mbu_rafaensuite_hero.png','En Suite — Warm Stone & Terracotta'),
    ],
  },

  // ── PHASE 2B · WINGS · POOL ───────────────────────────────────────────
  {
    id:'kitchen', building:'service-wing', floor:'ground', phase:'2B',
    name:'The Kitchen', tag:'460 SF Culinary Anchor', x:50, y:60,
    ancestors:['ptown','glebe'],
    intent:'White board walls, Provincetown shelving. Cobalt concrete island. La Cornue range — the centerpiece. Belfast sink. Darkened copper hood. French doors opening south to the elevated herb terrace.',
    images:[ photo('sw_kitchen_hero.png','La Cornue, Cobalt Island, Belfast Sink'), photo('sw_kitchen_alt.png','Kitchen — Alternate View') ],
    specs:[ {k:'Range', v:'La Cornue CornuFé 110, Ivory + Polished Brass'}, {k:'Island', v:'Cobalt concrete'}, {k:'Sink', v:'Belfast'} ],
  },
  {
    id:'pantry', building:'service-wing', floor:'ground', phase:'2B',
    name:'The Pantry', tag:"Butler's Blue Shelving", x:30, y:30,
    ancestors:['glebe','ptown'],
    intent:'Deep blue shelving. Limestone arch leading to the Wine Room / Storm Shelter 1. Thermally stable zone — north half of the wing.',
    images:[ photo('sw_pantry_hero.png',"Butler's Blue, Limestone Arch") ],
  },
  {
    id:'scullery', building:'service-wing', floor:'ground', phase:'2B',
    name:'The Scullery', tag:'Wet Room · Dirty-to-Clean Threshold',
    ancestors:['glebe'],
    intent:'Behind the kitchen. Where the dishes come back. Independent make-up air. The threshold between dirty and clean.',
    images:[ photo('sw_scullery_hero.png','Wet Room') ],
  },
  {
    id:'wine-room', building:'service-wing', floor:'ground', phase:'2B',
    name:'The Wine Room', tag:'Storm Shelter 1',
    ancestors:['glebe'],
    intent:'Disguised as a wine room, engineered as a shelter. Reinforced ICF walls, poured concrete ceiling. The first of four storm shelters across the compound.',
    images:[ photo('sw_wineroom_hero.png','Wine Room / Storm Shelter') ],
    specs:[ {k:'Walls', v:'ICF reinforced'}, {k:'Function', v:'Storm Shelter 1'} ],
  },
  {
    id:'mudroom', building:'service-wing', floor:'ground', phase:'2B',
    name:'The Mudroom', tag:'140 SF Threshold',
    ancestors:['ptown','texas'],
    intent:'Copper dog wash. Grey-blue-green beadboard walls. The threshold between the motor court and the kitchen — boots off, dog rinsed, groceries staged.',
    images:[ photo('sw_mudroom_hero.png','Copper Dog Wash, Beadboard') ],
  },
  {
    id:'sunroom', building:'wharf-wing', floor:'ground', phase:'2B',
    name:'The Sunroom', tag:'Where Inside Becomes Outside', x:30, y:55,
    ancestors:['ptown','texas'], radiant:true,
    intent:"Captain Jack's Wharf — the boundary dissolves. Glass walls pivot fully open; heated limestone floor. Rattan furniture, indigo striped cushions, ship's pulley on the rafter. Step through onto warm limestone, you're at the pool's edge.",
    images:[
      photo('ww_sunroom_hero.png','Glass Walls to Pool'),
      photo('ww_sunroom_alt.png','Rattan, Indigo, Open Panels'),
    ],
    helenNote:'The boundary between inside and outside dissolving. Heated limestone year-round. On a still morning the perimeter pool is a perfect mirror.',
  },
  {
    id:'guest-suite', building:'wharf-wing', floor:'ground', phase:'2B',
    name:'The Guest Suite', tag:"Full Captain Jack's Wharf · Independent Dwelling", x:70, y:55,
    ancestors:['ptown'],
    intent:"The Wharf Wing Independent Dwelling — self-contained casita. Heritage kitchenette (furniture, not cabinetry), laundry closet, direct exterior door, full aging-in-place provisions. Connected to the family via Sunroom and Glass Bridge — only thirty steps from the main block. White vertical beadboard, dark timber rafters, grey painted floors.",
    images:[
      photo('ww_guestsitting_hero.png','Sitting Room — Fireplace Wall, Salon Hang'),
      photo('ww_guestbedroom_hero.png','Bedroom — Dark Timber Rafters, Indigo'),
      photo('ww_guestensuite_hero.png','En Suite — White Beadboard, Brass'),
    ],
    specs:[ {k:'Walls', v:'Vertical beadboard, white'}, {k:'Floor', v:'Grey painted'}, {k:'Use', v:'Guest / aging in place / casita'} ],
    decision:{ id:'wharf-trim', summary:'Wharf Wing trim color — Faded Provincetown Blue (recommended) / Cobalt / Soft Indigo. Final selection on physical samples on site.' },
  },
  {
    id:'pool-terrace', building:'pool', floor:'ground', phase:'2B',
    name:'The Pool & Pool Terrace', tag:'Six Zones at the Edge of the World', x:50, y:50,
    ancestors:['texas','ptown','glebe'],
    intent:'Not a slab with furniture on it — a six-zone ground plane. Perimeter-overflow pool: zero-entry slope facing the sunroom, vanishing infinity edge facing the canyon, PLC-controlled 28-day lunar tidal algorithm creating gentle lapping sounds. Geothermal heated, swimmable March–November.',
    images:[
      img('od_poolzeroentry_hero.png','Pool & Shallows — Zero-Entry, Sun Shelf'),
      img('od_poolinfinity_hero.png','Canyon Perch & Water\'s Edge — Vanishing Edge, Fire Ring'),
    ],
    zones:[
      { z:'A', name:'The Shallows', desc:"Helen & Aurelia's zone. Baja shelf with 4–6 inches of water over honed limestone." },
      { z:'B', name:'The Shade Court', desc:'Daytime dining room under the heritage live oak. Helen\'s Sail above.' },
      { z:'C', name:'The Morning Ledge', desc:"Helen's zone. PEX-tapped limestone capstone — radiant-warm at dawn." },
      { z:'D', name:'The Canyon Perch', desc:'Mortared semicircular seat wall, gas fire ring (locked from TBD), at the canyon edge.' },
      { z:'E', name:"The Water's Edge", desc:"Jon's zone. Weathered teak chaises on widened limestone coping." },
      { z:'F', name:'The Sunroom', desc:'Climate-controlled backstop when Hill Country weather closes the terrace.' },
    ],
    helenNote:"Helen's Sail — Sunbrella Marine 16oz canvas in Linen, manila cord, bronze turnbuckles, brass spur grommets. Migrates from Shade Court to Canyon Perch when the live oak takes over shading the table.",
    specs:[ {k:'Pool', v:'Perimeter-overflow, 28-day tidal algorithm'}, {k:'Heating', v:'Geothermal'}, {k:'Pest', v:'Mortared joints, hardware-cloth perimeter, pyrethrin misting (Westminster chime cue)'} ],
  },

  // ── PHASE 2C · OUTBUILDINGS ───────────────────────────────────────────
  {
    id:'motor-barn-ext', building:'motor-barn', floor:'ground', phase:'2C',
    name:'The Motor Barn — Exterior', tag:'Stable Block Vocabulary', x:50, y:25,
    ancestors:['glebe','texas'],
    intent:'Belongs to the compound the way a stable block belongs to an English country house. Three arched openings, symmetrical facade, proper keystones and limestone voussoirs. Same string course, stone surrounds, dark bronze standing-seam hipped roof as the main house — at a humbler scale. Climbing jasmine on the east wall.',
    images:[ img('ob_motorbarnext_hero.png','Georgian Grammar at a Humbler Scale') ],
  },
  {
    id:'garage', building:'motor-barn', floor:'ground', phase:'2C',
    name:'The Garage', tag:'Three Bays', x:50, y:50,
    ancestors:['glebe'],
    intent:'Polished concrete, three bays, EV charging. The working heart of the Motor Barn.',
    images:[ img('ob_motorbarngarage_hero.png','Polished Concrete, Three Bays') ],
  },
  {
    id:'greenhouse', building:'motor-barn', floor:'ground', phase:'2C',
    name:"Grandma Cornelia's Greenhouse", tag:'The Mississippi Trace', x:25, y:50,
    ancestors:['miss','texas'],
    intent:'A tall arched window backed with green — the greenhouse pressing against the glass from inside. The fourth ancestor appears here, exactly once: the Mississippi tradition of growing things in utilitarian spaces.',
    images:[ img('ob_motorbarngreenhouse_hero.png',"Cornelia's Greenhouse — Arched Window, Terra Cotta") ],
  },
  {
    id:'motor-barn-loft', building:'motor-barn', floor:'upper', phase:'2C',
    name:'The Loft', tag:'Above the Garage', x:50, y:50,
    ancestors:['glebe','texas'],
    intent:'A pitched-ceiling refuge above the garage. Exposed dark beams, white plaster, wide-plank floors. Sectional sofa, vintage rug, a pool table, room for the family to spread out. The kind of upper-level retreat a stable block earns when it grows past its working role.',
    images:[ img('ob_motorbarnloft_hero.png','Beams, Sofa, Pool Table') ],
  },
  {
    id:'motor-barn-utility', building:'motor-barn', floor:'ground', phase:'2C',
    name:'Utility Room', tag:'The Working Wall', x:75, y:50,
    ancestors:['glebe','texas'],
    intent:'Working wall: battery bank, radiant manifolds, pegboard with every tool labeled in its place. Limestone walls, exposed timber ceiling, polished concrete floor. Honest infrastructure, treated like the rest of the house — beautiful by being correct.',
    images:[ img('ob_motorbarnutility_hero.png','Battery Bank, Manifolds, Pegboard') ],
  },
  {
    id:'pavilion', building:'pavilion', floor:'ground', phase:'2C',
    name:'Cedar Utility Pavilion', tag:'Heavy Timber Shelter', x:30, y:75,
    ancestors:['glebe','texas'],
    intent:'Cedar post-and-beam shelter. 20×24 ft, open on three sides, dark bronze metal roof. Heavy cedar timbers with mortise-and-tenon joints over crushed limestone. The kind of shelter a Georgian estate would have built for carriages, scaled down and translated into Texas cedar.',
    images:[ img('ob_pavilion_hero.png','Heavy Timber, Crushed Limestone') ],
  },
  {
    id:'covered-walkway', building:'covered-walkway', floor:'ground', phase:'2C',
    name:'The Covered Walkway', tag:'Motor Barn → Service Wing',
    ancestors:['glebe','texas'],
    intent:'Limestone piers, simple metal roof, native plantings. Walk from your car to the kitchen without getting wet in a thunderstorm. Practical architecture that looks like it has been there forever.',
    images:[ img('ob_coveredwalkway_hero.png','Limestone Piers, Simple Roof') ],
  },
  {
    id:'observatory', building:'observatory', floor:'ground', phase:'2C',
    name:'The Observatory', tag:'The Folly at the Edge of the World', x:90, y:80,
    ancestors:['glebe','texas'],
    intent:'A limestone folly inspired by the Radcliffe Observatory in Oxford. Octagonal tower at the far corner of the property, 150 feet from the Motor Barn, split clamshell dome housing a telescope. By day a reading room with 360° views; by night the dome opens and the telescope points at Jupiter. The folly that any proper English estate would build at the edge of its grounds.',
    images:[
      img('ob_observatoryextday_hero.png','Day — Limestone & Live Oaks'),
      img('ob_observatoryextnight_hero.png','Night — Dome Open, Dark Sky'),
      img('ob_observatoryint_hero.png','Reading Room by Day, Telescope by Night'),
    ],
    specs:[ {k:'Geometry', v:'Octagonal, 7×12-over-12 sash + arched cobalt door'}, {k:'Pier', v:'Isolated concrete (vibration-decoupled)'}, {k:'Plumbing/HVAC', v:'NONE — prevents thermal plumes'} ],
  },
  {
    id:'grape-pergola', building:'grape-pergola', floor:'ground', phase:'2B',
    name:"Helen's Grape Pergola", tag:'The North Alley',
    ancestors:['ptown','texas'],
    intent:"Sal Del Deo brought grapevines from Italy in the 1950s for his restaurant on Commercial Street, and they grew into the iconic pergola at Sal's Place. We're letting those ancestors plant a flag in Texas. Corten steel crossbars on limestone columns — non-combustible per Firewise. Champanel grapevines — wild and overgrown. At the foot of every column, rosemary, thyme, oregano, basil — because the scent at Sal's was herbs, not grapes.",
    images:[ photo('ext_northalley_hero.png',"Sal's Vines Replanted in Texas") ],
    helenNote:"This is personal. Helen's father was furious when the original came down. Helen still wears a Sal's Place shirt with the pergola on it.",
  },

  // ── COMPOUND-LEVEL · EXTERIORS ───────────────────────────────────────
  {
    id:'compound-approach', building:'compound', floor:'site', phase:'2A',
    name:'The Approach', tag:'Through Live Oaks',
    ancestors:['texas','glebe'],
    intent:'Through live oaks, the compound revealing itself piece by piece.',
    images:[ photo('ext_compoundapproach_hero.png','Compound Approach') ],
  },
  {
    id:'compound-night', building:'compound', floor:'site', phase:'2A',
    name:'The Compound at Night', tag:'Every Window Glowing',
    ancestors:['texas','glebe','ptown'],
    intent:'Every window glowing under a 590nm amber Dark-Sky envelope. The compound earns its place in the canyon at dusk.',
    images:[ photo('ext_compoundnight_hero.png','Every Window Glowing') ],
  },
  {
    id:'front-elevation', building:'main-block', floor:'site', phase:'2A',
    name:'Front Elevation', tag:'The Five-Bay Face',
    ancestors:['glebe'],
    intent:'The five-bay Georgian face. Symmetry, sash windows, fanlight, stone surround. Twelve-foot porch.',
    images:[ photo('ext_frontelevation_hero.png','The Five-Bay Face') ],
  },
  {
    id:'rear-garden', building:'main-block', floor:'site', phase:'2A',
    name:'Rear & Garden Elevation', tag:'Three Projecting Forms',
    ancestors:['glebe','texas'],
    intent:'Oval bay, canted bay, primary cedar oriel. Three projecting forms reading the canyon.',
    images:[ photo('ext_reargarden_hero.png','Three Projecting Forms') ],
  },
  {
    id:'wharf-wing-ext', building:'wharf-wing', floor:'site', phase:'2B',
    name:'Wharf Wing — Exterior', tag:'Sunroom & Guest Suite',
    ancestors:['ptown'],
    intent:'White-painted cedar shingle with blue-family trim. The Provincetown wing made physical in Texas.',
    images:[ photo('ext_wharfwing_hero.png','Sunroom & Guest Suite') ],
    decision:{ id:'wharf-trim', summary:'Trim color decision — see Guest Suite.' },
  },
  {
    id:'pool-terrace-ext', building:'pool', floor:'site', phase:'2B',
    name:'Pool Terrace — Exterior', tag:'Canyon Edge',
    ancestors:['texas'],
    intent:'Six zones at the edge of the world. Six-zone ground plane.',
    images:[ photo('ext_poolterrace_hero.png','Pool Terrace — Canyon Edge') ],
  },
];

const BUILDINGS = [
  { id:'main-block',      name:'Main Block',                 phase:'2A', x:50, y:50, w:18, h:14, label:'The Glebe',           ancestor:'glebe',
    plans:[ { floor:'ground', file:'floorplan_main_ground.svg', label:'Ground Floor' }, { floor:'upper', file:'floorplan_main_upper.svg', label:'Upper Floor' } ] },
  { id:'service-wing',    name:'Service Wing',               phase:'2B', x:30, y:50, w:14, h:10, label:'Kitchen · Pantry · Wine', ancestor:'glebe',
    plans:[ { floor:'ground', file:'floorplan_service.svg', label:'Service Wing' } ] },
  { id:'wharf-wing',      name:'Wharf Wing',                 phase:'2B', x:70, y:50, w:14, h:10, label:'Sunroom · Guest Suite',   ancestor:'ptown',
    plans:[ { floor:'ground', file:'floorplan_wharf.svg', label:'Wharf Wing' } ] },
  { id:'pool',            name:'Pool & Terrace',             phase:'2B', x:78, y:62, w:14, h:11, label:'Six Zones',           ancestor:'texas' },
  { id:'motor-barn',      name:'Motor Barn',                 phase:'2C', x:14, y:48, w:11, h:14, label:'Garage · Greenhouse · Loft', ancestor:'glebe',
    plans:[ { floor:'ground', file:'floorplan_motorbarn.svg', label:'Garage Level' }, { floor:'upper', file:'floorplan_motorbarn_loft.svg', label:'Loft Level' } ] },
  { id:'pavilion',        name:'Cedar Pavilion',             phase:'2C', x:30, y:74, w:8,  h:7,  label:'Heavy Timber',         ancestor:'texas',
    plans:[ { floor:'ground', file:'floorplan_pavilion.svg', label:'Pavilion Plan' } ] },
  { id:'observatory',     name:'Observatory',                phase:'2C', x:90, y:82, w:7,  h:9,  label:'Folly at the Edge',   ancestor:'glebe',
    plans:[ { floor:'ground', file:'floorplan_observatory.svg', label:'Observatory Plan' } ] },
  { id:'covered-walkway', name:'Covered Walkway',            phase:'2C', x:22, y:50, w:8,  h:2,  label:'Connector',           ancestor:'glebe' },
  { id:'grape-pergola',   name:"Helen's Grape Pergola",      phase:'2B', x:50, y:38, w:8,  h:2,  label:"Sal's, Replanted",    ancestor:'ptown' },
  { id:'compound',        name:'The Compound',               phase:'2A', x:50, y:50, w:0,  h:0,  label:'All of it',           ancestor:'texas' },
];

const PHASES = [
  { id:'2A', name:'The Main Block',           years:'2033–2035', desc:'The five-bay Georgian main block — the heart of the compound. ~3,200 sq ft enclosed.' },
  { id:'2B', name:'Wings, Sunroom & Pool',    years:'2035–2037', desc:'The Palladian composition completes. Service wing, sunroom wing, guest suite, pool terrace. ~1,580 sq ft added.' },
  { id:'2C', name:'Motor Barn, Observatory & Pavilion', years:'2037–2040', desc:'The working edge of the compound. ~1,440 sq ft added. The folly that makes this a compound, not a house.' },
];

// Helen's pending decisions (from the doc)
const DECISIONS = [
  { id:'wharf-trim',    title:'Wharf Wing Trim Color', status:'pending', priority:'high',
    body:'Three options on the table. Faded Provincetown Blue (recommended), Cobalt, Soft Indigo. Final selection with physical paint samples on site.',
    options:['Faded Provincetown Blue','Cobalt','Soft Indigo'],
    rooms:['guest-suite','wharf-wing-ext'],
    brief:'Imber §V, TS-A' },
  { id:'shutters',      title:'Shutters — Yes or No', status:'pending', priority:'high',
    body:'Imber rendering two versions. If yes: dark green (Helen\'s preference). If no: deep stone window reveals carry shadow definition alone.',
    options:['Yes — dark green','No — stone reveals only'],
    rooms:['front-elevation','rear-garden'],
    brief:'Imber §V' },
  { id:'front-door',    title:'Front Door Finish — Final Shade', status:'narrowed', priority:'med',
    body:'Matte, non-reflective. Natural oil or dark paint. High-gloss eliminated. Final shade with physical samples on installed door.',
    options:['Natural oil','Dark paint'],
    rooms:['front-porch','front-elevation'],
    brief:'Imber §II' },
  { id:'aurelia-trim',  title:"Aurelia's Room Exterior Trim", status:'pending', priority:'low',
    body:'Deferred to Imber. No constraint beyond the blue-family vocabulary established for the Wharf Wing.',
    options:['Imber\'s call'],
    rooms:['aurelias-room'],
    brief:'Imber §VI' },
  { id:'library-color', title:'Library Wall Color', status:'pending', priority:'med',
    body:'Two options — deep teal-green or rich navy. Imber\'s call.',
    options:['Deep teal-green','Rich navy'],
    rooms:['library'],
    brief:'Imber §VI' },
];

// ─────────────────────────────────────────────────────────────
// MICRO_DECISIONS — the smaller, mostly-deferred-to-experts decisions
// that surface in the timeline + phasing view. Helen sees them too,
// but they sit *behind* the Big Decisions in her view.
// ─────────────────────────────────────────────────────────────
const MICRO_DECISIONS = [
  { id:'freddy-triage', title:'Freddy archive — triage approach', when:'2027', defer:'Helen + paper conservator',
    body:'Order of operations for stabilizing the ~130 photographs. Triage by condition, not chronology. Acid-free interleaving first, then a paper-conservator survey. Frame-and-place pushes to 2027–2035.',
    body_helen:'Just an order-of-operations question — what gets handled first. The conservator drives this; we mostly listen.' },
  { id:'lender-pick', title:'Construction lender — pick one', when:'2029', defer:'Jon + accountant',
    body:'Construction-to-permanent vs. land loan + construction loan in series. Texas-Hill-Country lender preferred (familiar with WME). Rate lock window before 2030 land close.',
    body_helen:'A money question that lives entirely on Jon\'s side. Mentioned here so you know it\'s a real step on the calendar.' },
  { id:'site-orientation', title:'Main Block axis — final orientation', when:'2030 → 2032', defer:'Imber + Helen',
    body:'Sunrise/sunset confirmation on the four quadrants of the forty before any pencil touches paper. Locked at SD by Imber after Helen sits a season on each axis.',
    body_helen:'You sit through a sunrise and a sunset on every quadrant before we draw anything. This is your call.' },
  { id:'well-locations', title:'Well placement — primary + redundant', when:'2030', defer:'Driller + Dibello',
    body:'Two-well system. Primary at the highest practicable elevation; redundant 250\'+ from the primary. WME water-allocation memo before drilling.',
    body_helen:'The driller and Dibello pick the spots. We just sign off.' },
  { id:'imber-engagement', title:'Imber engagement — SD/DD scope', when:'2032', defer:'Jon (contract) · Helen (review)',
    body:'Imber holds design authority Phase 1 → Phase 3. SD + DD on Main Block this year; the Wings, Sunroom, and 2C buildings drawn opportunistically as cash and timing allow.',
    body_helen:'The architecture begins, in pencil. You and Imber sit together with the brief and the land photos. This is where the vocabulary gets locked.' },
  { id:'dibello-engagement', title:'Dibello engagement — CDs + CA', when:'2033', defer:'Jon (contract)',
    body:'Dibello as Architect of Record. Construction documents, code, MEP, civil, contractor coordination, construction administration. ~$70K CDs + bidding; CA spans 2A through 2C.',
    body_helen:'Dibello is the technical architect — they translate Imber\'s drawings into something the builder can actually build. A contract Jon signs.' },
  { id:'tc-test-result', title:'Geothermal TC test — go/no-go', when:'2033', defer:'Dibello + driller',
    body:'Thermal-conductivity test on the first bore determines the final well count. Result drives the geothermal field cost ($212K target).',
    body_helen:'The first geothermal well gets tested before we drill the rest. The number that comes back tells us how many more we need.' },
  { id:'stone-source', title:'Stone source — final quarry', when:'2033', defer:'Imber + Dibello',
    body:'Local Hill Country limestone, NOT Lueders or Austin. Quarry visit + sample wall on site before veneer order. Color/coursing approved by Imber.',
    body_helen:'We go look at quarries. The stone has to be from this part of Texas — not the prettier kind from up north.' },
  { id:'la-cornue-finish', title:'La Cornue finish — confirm', when:'2034', defer:'Helen',
    body:'CornuFé 110, Ivory body + Polished Brass trim (Provincetown ancestor). Lead time 16–20 weeks; order at Phase 2A interior fit-out.',
    body_helen:'The range. Ivory and brass — the Provincetown one. Just confirming the order before it goes in.' },
];

// Locked specs from the register
const LOCKED_SPECS = [
  { item:'Acreage',          value:'40 acres, Bandera County',                 ancestor:'texas', ref:'All' },
  { item:'Exterior wall',    value:'Stone veneer over frame, ventilated rainscreen', ancestor:'glebe', ref:'Dibello' },
  { item:'Stone type',       value:'Local Hill Country limestone (NOT Lueders/Austin)', ancestor:'texas', ref:'Imber' },
  { item:'Front door',       value:'Mesquite/cedar, iron hardware, Glebe surround, fanlight, sidelights, matte', ancestor:'glebe', ref:'Imber' },
  { item:'Oval bay frames',  value:'Cedar (Helen-locked)',                     ancestor:'glebe', ref:'Imber/Dibello' },
  { item:'Range',            value:'La Cornue CornuFé 110, Ivory + Polished Brass', ancestor:'ptown', ref:'Imber' },
  { item:'Windows',          value:'12-over-12 sash (Quiet Room single-pane exception)', ancestor:'glebe', ref:'Imber' },
  { item:'Roof',             value:'Dark-bronze Galvalume standing-seam, concealed fasteners, UL 2218 Class 4', ancestor:'texas', ref:'Dibello' },
  { item:'Quiet Room transom', value:'Triple-glazed acoustic, antique honey glass inner layer', ancestor:'glebe', ref:'Imber/Dibello' },
  { item:'Grape varietal',   value:'Champanel',                                ancestor:'ptown', ref:'Landscape' },
  { item:'Exterior lighting',value:'590nm narrow-band amber LED, fully shielded', ancestor:'texas', ref:'Dibello' },
  { item:'Geothermal',       value:'10–12 wells, 350+ ft, TC test on first bore', ancestor:'texas', ref:'Dibello' },
  { item:'Battery',          value:'105 kWh min., FranklinWH-compatible, NFPA 855. Na-ion preferred (LFP fallback).', ancestor:'texas', ref:'Dibello' },
  { item:'Solar',            value:'40 kW ground-mounted on Motor Barn roof',  ancestor:'texas', ref:'Dibello' },
  { item:'SPAN panel',       value:'Phase 2A, 400-amp service',                ancestor:'texas', ref:'Dibello' },
  { item:'Cabling',          value:'Cat6a throughout (NOT Cat7)',              ancestor:'texas', ref:'Dibello' },
  { item:'Pool',             value:'Perimeter-overflow, Glebe ancestor, 28-day tidal algorithm', ancestor:'glebe', ref:'Imber/Dibello' },
  { item:'Storm shelters',   value:'4 total — Wine Room, Powder Room, Motor Barn pit, Observatory vault', ancestor:'texas', ref:'Dibello' },
  { item:'Firewise Zone 0',  value:'60″ crushed gravel, inorganic only',       ancestor:'texas', ref:'Dibello/Landscape' },
  { item:'Wharf Wing exterior', value:'White-painted cedar shingle, blue-family trim', ancestor:'ptown', ref:'Imber' },
  { item:'Guest Suite',      value:"Full Captain Jack's. No Days Cottage. No shiplap. No seafoam.", ancestor:'ptown', ref:'Imber' },
];

const BRIEFS = [
  { id:'imber',     title:'Imber — Design Intent',           who:'Michael G. Imber Architects · Design Architect',
    summary:'Distills the philosophy, the ancestors, the room-by-room emotional targets. The locks are locks; the latitude is latitude.',
    pull:'"We want a house that feels inevitable — as if it has always been here and could not have been built any other way." That sentence is the entire test.' },
  { id:'dibello',   title:'Dibello — Technical Scope',       who:'Dibello Architects · Architect of Record',
    summary:'Construction documents, code, structural, MEP, civil, contractor coordination, construction administration across all phases. Imber carries design authority; Dibello carries technical authority.',
    pull:'Hold the technical brief steady. Build what is locked. Coordinate the rest.' },
  { id:'landscape', title:'Landscape Brief',                 who:'Landscape Architect',
    summary:'A stewarded landscape that reveals the vocabulary already in the land and disappears its hand. Four-ring gradient from highest tending at the buildings outward to the as-is Hill Country at the property edge.',
    pull:'The land was stewarded. Not designed.' },
  { id:'firewise',  title:'Firewise Native Landscaping',     who:'Firewise · Texas Hill Country Limestone Estate',
    summary:'Zone 0 (0–5\' from buildings) inorganic only. Native fire-resistant palette. Live oaks limbed up; cedar elms preserved.',
    pull:'A 60-inch crushed gravel dry zone wraps every building. Termite barrier; ember barrier.' },
  { id:'darksky',   title:'Dark Sky Strategic Plan',         who:'Dark Sky Compliance',
    summary:'590nm narrow-band amber LED (not 2700K). Full cutoff shielding. Astronomical timers, 10pm curfew. The compound at night is lit as if by oil lamps — perfect for the Georgian vocabulary.',
    pull:'Color perception is sacrificed outdoors. Interior lighting unaffected.' },
  { id:'human',     title:'Human Layer Acquisition Plan',    who:'Jon & Helen · Living Document',
    summary:'A decade-long strategy ($80–120K, 2026–2036) for art, furniture, textiles, objects that belong here because of who lives here. Helen\'s eye is the primary instrument.',
    pull:'The walls are the gallery; the family is the curator.' },
  { id:'freddy',    title:'Freddy Hemley Conservation Plan', who:'Freddy Hemley Collection',
    summary:'~130 photographs. Triage → Stabilize → Frame & Place (2027–2035). Acid-free interleaving this weekend; survey by a paper conservator next.',
    pull:"Helen's father's photographs line the stair wall." },
];

// ─────────────────────────────────────────────────────────────
// TIMELINE — year by year, 2026 → 2040
// Helen-visible. Money in bracketed ranges. Detail revealed on click.
// ─────────────────────────────────────────────────────────────
// TIMELINE — grounded in Financial Plan v6 (April 24, 2026; total $5,856,300).
//
// Two voices on every year:
//   spend  → JON view. The actual cost the project incurs that year (range).
//   save   → HELEN view. What "we're putting away" looks like, framed gently.
//            Pre-build years: real annual savings target.
//            Build years: monthly construction-loan service ("the bank's job"),
//                         not the headline construction cost.
//
const TIMELINE = [
  { year:2026, era:'Now · Quiet Years', helenEra:'A quiet year',
    headline:'The plan is real.',
    summary:'Financial Plan v6 reconciled. Two-firm architect model agreed. Forty acres targeted in Bandera County. The Human Layer (Freddy conservation, first commissioned art) begins.',
    spend:{ band:'low', range:'$8–15K', items:['Conservation supplies','Plan reconciliation','Hill Country trips'] },
    save:{ band:'low', monthly:'~$1,000/mo', annual:'$12K this year', purpose:'Cushion. Conservation supplies. Trips down to the land.' },
    decisions:[], detail:'A year of getting honest about the numbers and the calendar. No drawings yet. The financial plan reaches v6 in April. The land has not been bought; the architects have not been engaged.' },

  { year:2027, era:'Now · Quiet Years', helenEra:'A quiet year',
    headline:'Helen Layer begins in earnest.',
    summary:'Continue Freddy Hemley conservation triage. First commissioned art piece. Possible early paid consultation with Imber to establish working relationship.',
    spend:{ band:'low', range:'$10–25K', items:['Freddy conservation','First commission','Possible Imber consultation ($10K)'] },
    save:{ band:'low', monthly:'~$1,500/mo', annual:'$18K this year', purpose:'Conservation. One piece of art a year. Travel to Provincetown.' },
    decisions:['freddy-triage'], detail:'The walls are not yet built but the gallery is. One piece a year, every year through 2036. The Freddy archive gets stabilized in acid-free interleaving.' },

  { year:2028, era:'Now · Quiet Years', helenEra:'A quiet year',
    headline:'Build the cushion.',
    summary:'Continue Human Layer accumulation. Build cash reserve toward land-purchase down payment and architect retainers.',
    spend:{ band:'low', range:'$8–14K', items:['Human Layer','Cash reserve build','Site visits'] },
    save:{ band:'med', monthly:'~$2,000/mo', annual:'$24K this year', purpose:'A real cushion. Money waiting for the land.' },
    decisions:[], detail:'The most important year for patience. Do nothing visible. Save quietly. The reserve being built now becomes the down-payment that buys forty acres in 2030.' },

  { year:2029, era:'Now · Quiet Years', helenEra:'A quiet year',
    headline:'Last year before the land.',
    summary:'Final year of pure savings before Phase 0. Geotechnical pre-research, biologist short-list for warbler survey, lender conversations begin.',
    spend:{ band:'low', range:'$10–18K', items:['Human Layer','Lender setup','Pre-research'] },
    save:{ band:'med', monthly:'~$2,500/mo', annual:'$30K this year', purpose:'The down-payment is in the bank by year-end.' },
    decisions:['lender-pick'], detail:'Patience pays. Forty acres in Bandera County, even at $22K/acre, is $875K. The bank carries most of it; we carry the down payment, the closing, the well, and the surveyor.' },

  { year:2030, era:'Phase 0 · The Land', helenEra:'The year of the land',
    headline:'Forty acres. Well drilled. WME filed.',
    summary:'Phase 0 begins. Land closing, environmental + WME filing, first geotechnical investigation, well drilling on Edwards-Trinity aquifer.',
    spend:{ band:'med-high', range:'$615–680K cash + mortgage', items:['Land down payment + closing','Survey, title, environmental','Well drilling','Geotech','WME plan'] },
    save:{ band:'med', monthly:'~$2,500/mo', annual:'$30K this year', purpose:'Mortgage payments begin. The cushion keeps growing.' },
    decisions:['site-orientation','well-locations'],
    detail:'The deed records on a Tuesday. The well crew arrives Thursday. We sit through a sunrise and a sunset on every quadrant of the forty before any pencil touches paper.' },

  { year:2031, era:'Phase 0 · The Land', helenEra:'The year of the land',
    headline:'WME established. Land settles.',
    summary:'Wildlife Management Exemption activated (property tax drops dramatically). Continued cushion-build for architecture. Possible Imber early consultation if not done in 2027.',
    spend:{ band:'low', range:'$15–30K', items:['WME compliance','Possible Imber consultation','Site stewardship'] },
    save:{ band:'med', monthly:'~$3,000/mo', annual:'$36K this year', purpose:'Building the architecture-fee reserve.' },
    decisions:[], detail:'WME drops the tax bill from market-rate to productivity-value — tens of thousands annually. The land carries itself. We watch it through a season.' },

  { year:2032, era:'Phase 1 · Architecture', helenEra:'The year of the drawings',
    headline:'Imber engaged. Schematic design begins.',
    summary:'Phase 1 begins. Michael G. Imber Architects retained for SD/DD on the Main Block ($125K). Structural + MEP engineering. Landscape architect (Ten Eyck or similar). Warbler survey window opens.',
    spend:{ band:'med-high', range:'$140–180K', items:['Imber SD/DD Main Block','Structural + MEP eng','Landscape architect','Warbler survey'] },
    save:{ band:'med', monthly:'~$3,500/mo', annual:'$42K this year', purpose:'The construction-loan reserve begins.' },
    decisions:['imber-engagement','site-orientation'],
    detail:'Pencil meets paper. The vocabulary gets locked here, in pencil, before pen ever touches the construction drawings. Imber visits the land four times this year.' },

  { year:2033, era:'Phase 2A · Main Block', helenEra:'Construction starts',
    headline:'Dibello as AOR. Foundations & geothermal.',
    summary:'Phase 1 closes ($228K total). Phase 2A begins. Dibello produces Construction Documents under Imber design review. Construction loan funds. Foundations pour, all four storm shelters go in, geothermal field drilled (10–12 wells, min 350 ft).',
    spend:{ band:'high', range:'~$1.0–1.2M (loan-funded)', items:['Dibello CDs + bidding ($70K)','Foundations + slabs','Geothermal field (~$212K)','Storm shelters #1–3','Site prep'] },
    save:{ band:'med', monthly:'~$3,800/mo', annual:'$45K to reserve', purpose:'The bank pays the builder. We pay the bank.' },
    decisions:['dibello-engagement','tc-test-result','stone-source'],
    detail:'The construction loan funds. The bank pays the builder; we service the loan from earnings + the reserve we built 2026–2032. Construction administration runs two years.' },

  { year:2034, era:'Phase 2A · Main Block', helenEra:'Construction continues',
    headline:'Frame, veneer, weather-tight.',
    summary:'Main Block framing (panelized or stick — pricing TBD by Dibello). Stone veneer at $300/sqft over rainscreen. Standing-seam roof. 12-over-12 sash installed. La Cornue ordered (long lead). MEP rough-in.',
    spend:{ band:'high', range:'~$1.0–1.2M (loan-funded)', items:['Framing','Stone veneer','Roof + windows','MEP rough'] },
    save:{ band:'med', monthly:'~$3,800/mo', annual:'$45K to reserve', purpose:'Year-end review: how much over or under?' },
    decisions:['library-color','front-door','la-cornue-finish'], gate:'gate-2b-stage1',
    detail:'GATE Q4 2034 — Pool decision. Phase 2A close-out cost reconciliation. If 2A is more than 15% over budget, the perimeter-overflow pool is deferred or reduced. The pool stub-out and Helen\'s Sail post sleeves go in regardless. The pool itself is the largest discretionary line in 2B.' },

  { year:2035, era:'Phase 2A → 2B', helenEra:'We move in',
    headline:'Move-in. Wings begin.',
    summary:'Main Block interiors finish: plaster, walnut floors, beadboard, La Cornue installed in kitchen shell. Service Wing kitchen shell built ($80K). MOVE-IN. Phase 2B foundations begin: Wings + Pool + Orangery. Phase 3 (Furnishing) acquisition window opens.',
    spend:{ band:'high', range:'~$0.8–1.1M (loan-funded)', items:['2A interiors finish','La Cornue + hood install','Phase 2B foundations','Phase 3 begins'] },
    save:{ band:'med', monthly:'~$3,500/mo', annual:'$42K, plus furnishing', purpose:'Furnishing reserve splits off from construction reserve.' },
    decisions:[],
    detail:'We move in for a season before committing to wings, sunroom, pool. The Main Block + Service Wing kitchen shell is a permanently livable home for two adults and one teenager. The La Cornue is in a real kitchen from day one.' },

  { year:2036, era:'Phase 2B · Wings, Pool, Orangery', helenEra:'Wings & water',
    headline:'Service Wing. Wharf Wing. Pool.',
    summary:'Service Wing finishes (pantry, scullery, wine room, mudroom). Wharf Wing structural shell + finish. Sunroom acoustic + thermal. Perimeter-overflow pool ($160K). Orangery + Omnivore\'s Annex. Helen\'s Grape Pergola. Pool terrace six-zone program.',
    spend:{ band:'high', range:'~$500–650K (loan-funded)', items:['Service Wing','Wharf Wing finish','Pool + terrace','Orangery + planting'] },
    save:{ band:'med', monthly:'~$3,500/mo', annual:'$42K, plus furnishing', purpose:'Loan service + furnishing acquisition.' },
    decisions:['wharf-trim','shutters'], gate:'gate-2b-stage2',
    detail:'GATE Q2 2036 — Wharf Wing finish decision. If 2B is tracking 20%+ over budget, the Wharf Wing structural shell stays weathertight but unfinished. The shell is built; the question is whether it gets finished and inhabited as designed. KILL is identical in practice — DEFER is the default.' },

  { year:2037, era:'Phase 2B → 2C', helenEra:'Wings & water',
    headline:'Pool live. 2C foundations.',
    summary:'Phase 2B closes ($864K total). Pool commissioned. Wharf Wing punch list. Phase 2C foundations begin (Motor Barn slab, Observatory pier already poured in 2A, Greenhouse pad).',
    spend:{ band:'med-high', range:'~$200–280K (loan-funded)', items:['2B punch list','Pool commissioning','2C foundations'] },
    save:{ band:'med', monthly:'~$3,500/mo', annual:'$42K, plus furnishing', purpose:'Loan service. Decide whether to commit to 2C or stop.' },
    decisions:[], gate:'gate-2c-stage1',
    detail:'GATE Q4 2036 (this year\'s decision, lookahead) — Observatory finish. Phase 2A pier is already poured. The pier is the cheapest part to build opportunistically and the most expensive part to retrofit. Observatory finish defers if cumulative spend is >10% over budget.' },

  { year:2038, era:'Phase 2C · Motor Barn & Observatory', helenEra:'The folly years',
    headline:'Motor Barn. Loft. Greenhouse.',
    summary:'Three-bay arched limestone garage. The Loft fit-out (flooring, board-and-batten, podcast studio, furniture). Grandma Cornelia\'s Greenhouse. Motor Barn full bath finish.',
    spend:{ band:'med-high', range:'~$280–350K (loan-funded)', items:['Motor Barn structure','The Loft','Greenhouse','Bath finish'] },
    save:{ band:'med', monthly:'~$3,000/mo', annual:'$36K, plus furnishing', purpose:'Loan service softens.' },
    decisions:[], gate:'gate-2c-stage2',
    detail:'GATE Q2 2038 — Motor Barn pieces. If 2C is tracking >15% over budget after Stage 1, defer the Loft Podcast Studio ($18.5K), defer Loft furniture ($11.5K), reduce Greenhouse to a Lord & Burnham prefab ($8–12K). The Motor Barn shell stays intact; the soul-pieces are negotiable.' },

  { year:2039, era:'Phase 2C · Motor Barn & Observatory', helenEra:'The folly years',
    headline:'Solar. Battery. Observatory.',
    summary:'40kW rooftop solar on Motor Barn. 105kWh battery (chemistry decided at procurement — sodium-ion preferred, LFP fallback). Clamshell observatory on the isolated pier poured in 2A. V2G-ready EV charging activates.',
    spend:{ band:'med', range:'~$180–230K (loan-funded)', items:['Solar 40kW','105kWh battery + aGate','Observatory finish','Native meadow'] },
    save:{ band:'low', monthly:'~$2,500/mo', annual:'$30K, plus furnishing', purpose:'Last year of the construction loan.' },
    decisions:[], gate:'gate-2c-stage3',
    detail:'GATE Q3 2038 (active this year) — Solar/Battery reduction. If 2C is tracking >25% over budget, reduce solar to 25kW ($95K → $60K) and battery to 60kWh ($60K → $34K). Defer native meadow planting ($15K). The reduced system is still grid-defection capable; emergency autonomy drops from 2.5–3.8 days to 1.5–2.5 days. Acceptable. Not preferred.' },

  { year:2040, era:'Completion & Settling', helenEra:'The compound is whole',
    headline:'Punch list. Settling. The compound is whole.',
    summary:'Final landscape rings. Construction loan converts to permanent mortgage. Phase 3 Human Layer continues for another five years (planned through 2045). Annual upkeep settles at $31.5–$58.5K.',
    spend:{ band:'low', range:'~$60–120K', items:['Punch list','Final landscape','Loan conversion'] },
    save:{ band:'low', monthly:'~$2,600/mo upkeep', annual:'$31.5–58.5K/yr settling', purpose:'Upkeep, not construction.' },
    decisions:[],
    detail:'Year zero of living here. Fourteen years of attention have produced a place that feels inevitable. The Human Layer continues to fill in for another five years and beyond — that is the design.' },
];

// SPEND_BANDS — relative bar widths.
// Spend bands shown in Jon view (project cost intensity).
// Save bands shown in Helen view (annual saving rate).
const SPEND_BANDS = { low:0.10, med:0.28, 'med-high':0.55, high:0.90 };
const SAVE_BANDS  = { low:0.20, med:0.55, 'med-high':0.80, high:1.00 };

// ─────────────────────────────────────────────────────────────
// GATES — proceed / delay / reduce / kill checkpoints
// ─────────────────────────────────────────────────────────────
// GATES — v6 staged decision framework. Each gate has explicit triggers,
// recoverable dollar amounts, and the proceed/defer/reduce/kill option set.
// "Defer" is the v6 default; "Kill" is reserved for things that can't be
// reasonably revived once skipped.
//
const GATES = {
  'gate-2b-stage1': {
    id:'gate-2b-stage1', year:2034, when:'Q4 2034', name:'2B Stage 1 — Pool', stage:'Phase 2A close-out · 6 months before Phase 2B',
    framing:'The largest single discretionary line in Phase 2B. The pool stub-out and Helen\'s Sail post sleeves go in regardless. The pool itself is negotiable.',
    triggerHeadline:'Trigger if any one is true:',
    triggers:[
      'Phase 2A final cost > 15% over budget ($437K overrun)',
      'Annual income drops below $300K for two consecutive years',
      'Land cost or 2A loan terms force restructuring',
    ],
    recovery:'$172K recoverable (pool $160K + cover $12K)',
    options:{
      proceed:{ label:'PROCEED', body:'Perimeter-overflow pool, automated cover, "Observatory Mode" integration. The Herring Cove acoustic simulation in full.' },
      defer:{   label:'DEFER',   body:'Stub-out + post sleeves remain. Pool installs later. KILL is identical in practice — the stub-out is permanent.' },
      reduce:{  label:'REDUCE',  body:'Lap-pool geometry, no perimeter overflow ($90–110K, saves $50–70K). Sacrifices the Herring Cove design intent. Helen conversation required.' },
      kill:{    label:'KILL',    body:'No pool. Stub-out is wasted but minor. Helen\'s Sail still flies — its post sleeves don\'t depend on the pool.' },
    },
  },
  'gate-2b-stage2': {
    id:'gate-2b-stage2', year:2036, when:'Q2 2036', name:'2B Stage 2 — Wharf Wing finish', stage:'Phase 2B mid-build',
    framing:'The Wharf Wing structural shell is built either way (Phase 2A). The shell stays weathertight. The question is whether it gets finished and inhabited as designed.',
    triggerHeadline:'Trigger if any one is true:',
    triggers:[
      'Phase 2B Service Wing + Orangery + Pool tracking 20%+ over budget',
      'Construction loan covenants tighten',
      'Major life event reorders priorities',
    ],
    recovery:'$60K deferred (Wharf finish $35K + Sunroom upgrades $25K). Independent Dwelling Upgrades ($14K) preserved.',
    options:{
      proceed:{ label:'PROCEED', body:'Full Captain Jack\'s Wharf treatment. Sunroom acoustic + thermal upgrades. Guest suite finish. The emotional anchor.' },
      defer:{   label:'DEFER',   body:'Shell weather-tight, unfinished. Finish later when finances permit. KILL is identical in practice.' },
      reduce:{  label:'REDUCE',  body:'Sunroom at minimum spec ($10K vs $25K). Guest Suite at functional level ($20K vs $35K). Helen flag — this is one of the project\'s emotional anchors.' },
      kill:{    label:'KILL',    body:'Shell remains as a workshop / storage. The Wharf reading dies. Reluctant.' },
    },
  },
  'gate-2c-stage1': {
    id:'gate-2c-stage1', year:2036, when:'Q4 2036', name:'2C Stage 1 — Observatory finish', stage:'Phase 2B close-out · 12 months before Phase 2C',
    framing:'Phase 2A isolated concrete pier is already poured (it pours opportunistically with the foundation crew, $4K). The pier is the cheapest part to build and the most expensive part to retrofit. Pier preservation is non-negotiable regardless of this gate.',
    triggerHeadline:'Trigger if any one is true:',
    triggers:[
      'Cumulative Phase 0–2B cost > 10% over budget',
      'Annual income trajectory will not support Phase 2C scope',
      'Major life event reorders priorities',
    ],
    recovery:'$35K finish, or ~$51K if Observatory storm shelter (#4) also deferred',
    options:{
      proceed:{ label:'PROCEED', body:'Clamshell dome, ICC 500 vault (Storm Shelter #4), telescope-ready isolated pier. The folly that makes it a compound.' },
      defer:{   label:'DEFER',   body:'Pier remains. Dome, vault, telescope deferred. KILL is identical in practice. Build later, opportunistically.' },
      reduce:{  label:'REDUCE',  body:'Pier + simpler ground-level enclosure. No clamshell. Functional but not the original design intent.' },
      kill:{    label:'KILL',    body:'Pier remains as a gazebo pad. The observatory dream is forfeit.' },
    },
  },
  'gate-2c-stage2': {
    id:'gate-2c-stage2', year:2038, when:'Q2 2038', name:'2C Stage 2 — Motor Barn pieces', stage:'Phase 2C mid-build',
    framing:'Three sub-decisions: Loft Podcast Studio, Loft Finish + Furniture, Greenhouse. Cascade implication: if Loft Finish is killed, the air hockey table relocates to the Drawing Room.',
    triggerHeadline:'Trigger:',
    triggers:[
      'Phase 2C tracking > 15% over budget after Stage 1',
    ],
    recovery:'$52–64K recoverable across three sub-decisions',
    options:{
      proceed:{ label:'PROCEED', body:'Full Loft fit-out: Podcast Studio room-within-a-room (STC 55+), oversized sectional, game table, mini fridge, full Greenhouse with limestone-and-glass.' },
      defer:{   label:'DEFER',   body:'Defer Podcast Studio ($18.5K) + Loft Furniture ($11.5K). Loft remains a flex space; Podcast rough-in stays.' },
      reduce:{  label:'REDUCE',  body:'Reduce Loft Finish ($20K → ~$8K shell-with-paint). Reduce Greenhouse to Lord & Burnham prefab ($22K → $8–12K).' },
      kill:{    label:'KILL',    body:'Kill Loft Finish ($20K saved). Air hockey table relocates to Drawing Room. Greenhouse killed = no Mississippi room. Reluctant.' },
    },
  },
  'gate-2c-stage3': {
    id:'gate-2c-stage3', year:2038, when:'Q3 2038', name:'2C Stage 3 — Solar/Battery', stage:'Phase 2C mid-build · only after Stages 1–2',
    framing:'The reduced 25 kW + 60 kWh system is still grid-defection capable. Emergency autonomy drops from 2.5–3.8 days to 1.5–2.5 days at triaged load. Acceptable. Not preferred. Federal tax credit terminated Dec 31, 2025 — no credit available regardless.',
    triggerHeadline:'Trigger:',
    triggers:[
      'Phase 2C tracking > 25% over budget after Stages 1–2',
    ],
    recovery:'~$76K recoverable (Solar reduce $35K + Battery reduce $26K + Native Meadow defer $15K)',
    options:{
      proceed:{ label:'PROCEED', body:'40 kW solar + 105 kWh battery (FranklinWH-compatible, sodium-ion preferred). Native meadow planting on 35+ acres.' },
      defer:{   label:'DEFER',   body:'Defer Native Meadow planting only ($15K). Energy systems install at full spec.' },
      reduce:{  label:'REDUCE',  body:'Solar 40 kW → 25 kW ($95K → $60K). Battery 105 kWh → 60 kWh ($60K → $34K). Defer Native Meadow.' },
      kill:{    label:'KILL',    body:'Not recommended. Energy systems are the operational backbone of the compound.' },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// ROOM_TECH — the 'reveal technical layer' content per room
// Brief excerpts, code, MEP, structural, dependencies that shape this room.
// ─────────────────────────────────────────────────────────────
const ROOM_TECH = {
  'entry-hall': {
    excerpt:{ from:'Imber §II', text:'The Entry Hall is the threshold where the Glebe asserts itself most directly. Heated limestone is non-negotiable; geothermal makes the heat possible without compromising the floor.' },
    layers:[
      { kind:'Structural', body:'2-story open volume; engineered glulam header above stair landing.' },
      { kind:'MEP', body:'Geothermal radiant slab; supply plenum routed through stair stringer cavity. No registers in the hall floor.' },
      { kind:'Code', body:'Stair: 7" rise / 11" tread; handrail return at both ends; balusters ≤4" gap (R311.7).' },
      { kind:'Lighting', body:'Single chandelier on dimmer; supplemental wall sconces at picture rail. CRI ≥95 throughout.' },
    ],
  },
  'kitchen': {
    excerpt:{ from:'Imber §III · Locked Specs', text:'La Cornue CornuFé 110, Ivory + Polished Brass. Cobalt concrete island. Belfast sink. The kitchen is the hardest-locked room in the compound.' },
    layers:[
      { kind:'MEP', body:'Range gas + 240V; vent through darkened copper hood, makeup air independent of HVAC.' },
      { kind:'Structural', body:'Concrete island slab on engineered footing — 4" mat, decoupled from SOG.' },
      { kind:'Code', body:'Range hood capture: ≥600 CFM with corresponding makeup air per IRC M1503.' },
      { kind:'Plumbing', body:'Belfast sink: bridge faucet, exposed-trap drain, separate filtered tap.' },
    ],
  },
  'powder-room': {
    excerpt:{ from:'Imber §IV · Dibello Storm', text:'Indigo jewel box visually; Storm Shelter 2 structurally. The room is dramatic precisely because it must be over-built.' },
    layers:[
      { kind:'Structural', body:'ICF walls (8" core), poured concrete ceiling. FEMA P-361 storm shelter compliant.' },
      { kind:'Door', body:'FEMA P-361 rated, swings outward; latched on both sides.' },
      { kind:'Egress', body:'Always operable from inside; emergency provisions (water, comms) integrated.' },
      { kind:'MEP', body:'Independent ventilation, battery-backed light, comms hardline.' },
    ],
  },
  'sunroom': {
    excerpt:{ from:'Imber §V · Dibello Glazing', text:'The boundary between inside and outside dissolves. Glass walls pivot fully open in season, tighten to a thermal envelope in winter.' },
    layers:[
      { kind:'Structural', body:'Steel moment frame disguised behind cedar trim — supports glass-wall span without intermediate posts.' },
      { kind:'Glazing', body:'Pivot-and-stack panels, triple-pane low-e, integrated screens.' },
      { kind:'Floor', body:'Geothermal radiant limestone — same slab continues under glass to terrace.' },
      { kind:'Code', body:'Tempered glass throughout (CPSC 16 CFR 1201, Cat II).' },
    ],
  },
  'guest-suite': {
    excerpt:{ from:'Imber §V · Dibello ADA', text:"Full Captain Jack's Wharf. Aging-in-place provisions are baked in but invisible." },
    layers:[
      { kind:'Aging-in-place', body:'36" doorways, blocking for grab bars, curbless shower, lever hardware throughout.' },
      { kind:'MEP', body:'Independent HVAC zone; separate water heater for kitchenette.' },
      { kind:'Egress', body:'Direct exterior door — life-safety + casita autonomy.' },
      { kind:'Code', body:'IRC R311 egress + ANSI A117.1 Type B accessibility provisions.' },
    ],
  },
  'observatory': {
    excerpt:{ from:'Imber §VII · Dibello Vibration', text:'Plumbing and HVAC are forbidden. Thermal plumes ruin seeing. The folly serves the telescope.' },
    layers:[
      { kind:'Pier', body:'Isolated concrete pier on independent footing — vibration-decoupled from floor structure.' },
      { kind:'MEP', body:'NO mechanical. No plumbing. Heating: portable radiant only, off when observing.' },
      { kind:'Storm', body:'Sub-grade vault: Storm Shelter 4. Concrete bunker with hatch.' },
      { kind:'Door', body:'Arched cobalt door, mesquite frame.' },
    ],
  },
  'great-room': {
    excerpt:{ from:'Imber §III', text:'The room where the family actually lives. Double-height on the garden side. Limestone fireplace wall left bare — one of the few exposed faces in the compound.' },
    layers:[
      { kind:'Structural', body:'Engineered ridge beam carries the double-height garden side; tie-rods concealed in fireplace wall.' },
      { kind:'Acoustics', body:'Ceiling treatment: exposed structure with concealed acoustic batt. Avoid hard parallel surfaces.' },
      { kind:'MEP', body:'Geothermal radiant; supply through floor diffusers at perimeter only.' },
    ],
  },
  'oval-dining': {
    excerpt:{ from:'Imber §III · Helen-locked', text:'The most direct homage to the Glebe. Cedar bay frames are Helen-locked — warm, traditional, weathering to silver-grey outside.' },
    layers:[
      { kind:'Structural', body:'Projecting oval bay: cantilever from main block; cedar frame structural and aesthetic.' },
      { kind:'Material', body:'Cedar (Helen-locked over steel). Will silver outside, stay warm inside.' },
      { kind:'Glazing', body:'Tall sash, 12-over-12; dual-pane low-e.' },
    ],
  },
  'library': {
    excerpt:{ from:'Imber §III', text:'Canted bay window on the north face frames the canyon the way the Glebe\'s bay frames the Northamptonshire countryside.' },
    layers:[
      { kind:'Structural', body:'Canted bay structural; engineered header carries north-face load above bay.' },
      { kind:'MEP', body:'Floor outlets at desk position; supply through plinth to avoid disturbing wall hang.' },
      { kind:'Lighting', body:'Picture lights on rail; bay window has no down-light to preserve view.' },
    ],
  },
  'quiet-room': {
    excerpt:{ from:'Imber §IV', text:'The single-pane picture window is an intentional deviation from the 12-over-12 rule — it frames the canyon as a painting.' },
    layers:[
      { kind:'Glazing', body:'Single-pane picture (acoustic priority over thermal). Triple-glazed acoustic transom above.' },
      { kind:'Acoustics', body:'Antique honey glass inner layer in transom, full perimeter seal.' },
      { kind:'MEP', body:'No registers in the wall containing the picture window. Supply from opposite wall.' },
    ],
  },
  'primary-suite': {
    excerpt:{ from:'Imber §IV', text:"White vertical beadboard wall, sea glass teal tile in the en suite, heated limestone, the widow's walk over the sunroom." },
    layers:[
      { kind:'Structural', body:"Widow's walk: rooftop terrace over sunroom. Drainage and waterproofing critical." },
      { kind:'MEP', body:'Heated limestone in en suite; independent thermostat.' },
      { kind:'Code', body:'Tub clearance and shower threshold per IRC R307.' },
    ],
  },
};


return { ANCESTORS, RULES, ROOMS, BUILDINGS, PHASES, DECISIONS, MICRO_DECISIONS, LOCKED_SPECS, BRIEFS, TIMELINE, GATES, ROOM_TECH, SPEND_BANDS, SAVE_BANDS };
})();
