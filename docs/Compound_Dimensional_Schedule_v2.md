# Compound Dimensional Schedule v2 — PROVISIONAL (for the PWA)

**Working model only. Nothing here is locked.** Best-guess dimensions assembled so you and Helen can walk the compound in the PWA and feel the volumes. Locked/derived figures are pulled from **Compound Register v1.7** and tagged; every gap is a flagged best-guess. Real room dimensions resolve at **Imber DD** — do not lock anything off this file, and do not propagate these numbers into the authoritative documents.

## What changed from v1

Every coordinate below is validated in code: areas computed from W×D, the Guest Suite checked against its locked total, the Observatory setbacks measured, and all boxes checked for overlap.

- **Guest Suite now sums to 350** (was ~450, which broke the locked total). Bedroom 176 + Sitting 110 + En-Suite 64 = **350**.
- **Observatory pushed to 216′ from the pool** (was ~150′, breaking the ≥200′ lock). ≥150′ from the Motor Barn also holds (438′).
- **Cornelia’s Greenhouse corrected to ~180 ft²** (was 352, a figure in no document).
- **Right Passage / Freddy’s Gallery moved** to the Main Block’s east edge on the vista line (was *east* of the Sunroom, running the sequence backwards). Order is now Great Room → Right Passage → Glass Bridge → Sunroom → canyon, west to east; the Bridge, Sunroom, and Guest Suite shifted east to make room.
- **Box-overlap convention added** (below) so the PWA doesn’t double-render carved rooms.
- **Minors:** Covered Walkway now spans the real 12′ gap (was 20′); the central band is split into a single-height **Entry Hall** (front) + a double-height **Octagonal Stair Hall** so the Quiet Room above no longer sits in the open stair void; the Podcast Studio coordinate is the loft’s NE corner; the Motor Barn west end is re-sequenced after the Greenhouse resize.

## How to read it

**Source tag** (every row): `L` locked in the Register · `D` derived from locked grid arithmetic · `A` area is locked but the W×D shape is a best-guess · `~` pure best-guess (Register leaves it open).

**Coordinates** — feet. `x` = East(+), `y` = North(+), `z` = Up(+). **Site origin (0,0,0) = the Main Block’s south-west ground-floor corner.** Each room gives its **SW corner (x, y)**, footprint **W×D** (W is east–west, D is north–south), and **floor→ceiling z**. The PWA can extrude each room as a box from `(x, y, z_floor)` of size `(W, D, height)`. Upper-floor rooms sit on the 12′ ground floor (floor z = 12); loft sits on the 14′ Forge (floor z = 14).

**Box-overlap convention — read before authoring glTF.** A few rooms are deliberately carved inside others. Mark each room **solid** or **container**:

- **Containers** (render as a shell, or CSG-subtract the child, so volume isn’t double-counted): **Everyday Dining** holds the Powder Room · **Aurelia’s Suite** holds the Pink En-Suite · **Rafa’s Texas Room** holds the Rafa En-Suite · **Loft** holds the Podcast Studio · **Octagonal Stair Hall** is open to the **Dome/Oculus** above · **Pool Terrace** holds the Pool (and the Sauna sits at its edge).
- **Everything else is a leaf solid** — extrude straight from `(x, y, z_floor)` at size `(W, D, height)`.

Those are the *only* intentional plan-overlaps. The validator confirms no others exist anywhere in the model.

**Provisional-geometry caveats:** the Main Block grid (44×38, the 16/12/16 width band, the 20+18 depth) is locked, so its rooms are exact (`D`). Everything west (Service Wing), east (Wharf Wing), and out (Motor Barn, Observatory, Pavilion, Pool) is on a **best-guess site plan** — believable, not surveyed. Inter-building spacing honors the setbacks that matter (≥200′ Observatory–pool, ≥150′ Observatory–Motor Barn, 150′+ Motor Barn) but is otherwise Imber’s at SD/DD.

## Site placement overview

Bounding box of each structure in site coords (for laying out buildings before rooms).

| Structure | SW (x,y) | Extent W×D | Storeys | Notes |
|---|---|---|---|---|
| **Main Block** | (0,-12) | 54×50 | 2 + crown | Glebe bones; limestone; envelope 44x38 [D] |
| Orangery | (10,39) | 24×18 | 1 | glass garden room N of Main Block |
| Covered Walkway | (-12,6) | 12×14 | 1 | Left hyphen / loggia |
| Service Wing | (-58,0) | 46×35 | 1 | kitchen/pantry/wine/scullery/mudroom/mech |
| Wharf Wing | (44,-18) | 60×57 | 1-1.5 | E gallery + Glass Bridge + Sunroom + Guest Suite + pool wet rooms |
| **Motor Barn** | (-130,150) | 118×28 | 1 + loft | 150'+ NW; W->E greenhouse/bays/forge/expansion |
| Observatory | (150,-270) | 13×13 | tower | >=200' pool / >=150' Motor Barn |
| Cedar Pavilion | (-58,-30) | 20×24 | open | daily EV port; near Mudroom |
| Pool & Terrace | (62,-58) | 48×48 | open | canyon side, off the Sunroom |
| North Alley Pergola | (-10,60) | 60×12 | open | under Primary oriel |

## Main Block — ground

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Drawing Room (SW) | (0,0) | 16×20 | 0→12 | 320 | D | Helen's gallery; west sashes kept |
| Great Room (SE) | (28,0) | 16×20 | 0→12 | 320 | D | restored; Rafa's room stacks above |
| Oval Dining (NW) | (0,20) | 16×18 | 0→12 | 288 | D | curved cedar bay projects north |
| Library (NE) | (28,20) | 16×18 | 0→12 | 288 | D | canted bay projects north; Wharf transition |
| Entry Hall (front, S-ctr) | (16,0) | 12×12 | 0→12 | 144 | L | single-height entry; Quiet Room sits above it |
| Octagonal Stair Hall | (16,12) | 12×8 | 0→24 | 96 | L | double-height open-well stair; oculus above; 10' clear x 32' sightline runs through it |
| Everyday Dining (N-ctr) | (16,20) | 12×18 | 0→12 | 216 | D | central-band width; French doors to Orangery; contains Powder Rm |
| Powder Room | (16,20) | 5×6 | 0→12 | 30 | L | back-center, windowless; shelter #2 (ICF); carved into Everyday Dining |
| Front Porch | (8,-12) | 28×12 | 0→12 | 336 | L | depth 12' locked; width best-guess; Tuscan, unconditioned |

## Main Block — upper (floor z=12)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Study (SW, over Drawing) | (0,0) | 16×20 | 12→22 | 320 | L | Jonathan-locked; no en-suite; jib door to Quiet Rm |
| Rafa's Texas Room (SE, over Great) | (28,0) | 16×20 | 12→22 | 320 | L | limestone feature wall |
| Aurelia's Provincetown Suite (NW, over Oval) | (0,20) | 16×18 | 12→22 | 288 | L | bedroom; contains Pink en-suite |
| Primary Bedroom (NE, over Library) | (28,20) | 16×18 | 12→22 | 288 | L | canted cedar oriel over North Alley; contains Rafa-no; dressing+teal reach into central band |
| Quiet Room (S-ctr) | (16,0) | 12×12 | 12→22 | 144 | L | ~10x12; single picture-window pane; honey clerestory; over the Entry Hall |
| Upper Gallery / Landing | (16,20) | 12×8 | 12→22 | 96 | ~ | Freddy wall; wraps the open stair well from the north |
| Primary Dressing | (16,28) | 6×10 | 12→22 | 60 | ~ | [U] subdivision; reaches into central band |
| Primary En-Suite (Teal) | (22,28) | 6×10 | 12→22 | 60 | ~ | [U] subdivision; reaches into central band; cast-iron stacks |
| Pink En-Suite (Aurelia) | (0,20) | 7×8 | 12→22 | 56 | ~ | [U] carved into Aurelia's corner |
| Rafa En-Suite | (28,0) | 8×7 | 12→22 | 56 | ~ | [U] carved into Rafa's corner |
| Primary Terrace | (44,20) | 10×12 | deck | 120 | ~ | [U] roof terrace off Primary (east); deck |

## Main Block — crown

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Dome / Oculus | (18,12) | 8×8 | 24→30 | 64 | A | 6' clear oculus [L]; matte saucer dome; decoupled lantern; over the stair hall |

## Orangery (Main Block N face)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Orangery | (10,39) | 24×18 | 0→14 | 432 | A | ~450 ft2 locked; glass garden room N of Main Block; Sal's Place N trellis; Phase 2B |

## Covered Walkway (Left hyphen)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Covered Walkway | (-12,6) | 12×14 | 0→11 | 168 | ~ | limestone Tuscan loggia spanning the 12' gap to the Service Wing; geometry [U] |

## Service Wing (west)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Kitchen | (-58,0) | 23×20 | 0→14 | 460 | A | 460 ft2 locked; Option B / La Cornue; tall-ceilinged |
| Pantry + Wine Room | (-58,20) | 15×15 | 0→12 | 225 | A | 220 ft2 locked (combined; split [U]); Wine Rm = shelter #1 (ICF) |
| Scullery | (-35,20) | 9×12 | 0→12 | 108 | L | 9x12 locked; decontamination buffer |
| Mudroom | (-35,0) | 14×10 | 0→12 | 140 | A | 140 ft2 locked; 'eyes on drive'; path to Cedar Pavilion |
| Mechanical / Laundry | (-26,20) | 14×14 | 0→12 | 196 | ~ | [U] well filtration, greywater, pool equip; 14" chute from Upper Gallery |
| Tea Station | (-21,8) | 6×8 | 0→12 | 48 | ~ | [U] kettle, tea cabinet, Helen's cups; Main-Block end |

## Glass Bridge (Right hyphen)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Glass Bridge | (56,8) | 12×8 | 0→11 | 96 | L | 8x12 glass [L]; the 100' canyon vista seam; limestone<->shingle |

## Wharf Wing (east)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Right Passage / Freddy's Gallery | (44,0) | 12×20 | 0→12 | 240 | A | 240 ft2 locked; Main Block's E gallery on the vista line (Great Rm -> here -> Bridge -> Sunroom); Freddy collection, densest wall |
| Sunroom | (68,-8) | 28×24 | 0→16 | 672 | A | 680 ft2 locked; glass 2+ sides; vaulted; faces pool (zero-entry) |
| Guest Bedroom | (68,20) | 16×11 | 0→11 | 176 | A | part of 350 ft2 Guest Suite [L]; vertical beadboard, vaulted cedar |
| Guest Sitting | (84,20) | 10×11 | 0→11 | 110 | ~ | [U] split of Guest Suite |
| Guest En-Suite | (68,31) | 8×8 | 0→11 | 64 | ~ | [U] curbless; clawfoot; aging-in-place clearances |
| Pool Bath | (96,-8) | 8×8 | 0→11 | 64 | A | ~60 ft2 locked; shared sauna/pool threshold |
| Sauna | (96,-18) | 8×10 | 0→9 | 80 | ~ | [U] electric cedar hot room; shares Pool Bath threshold; on terrace edge |

## Motor Barn (NW, 150'+ out)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Cornelia's Greenhouse | (-130,150) | 15×12 | 0→12 | 180 | ~ | [U] ~180 ft2; Phase 3; Mississippi; citrus; Versailles rotation w/ Orangery |
| Vehicle Bay 1 | (-115,150) | 14×24 | 0→14 | 336 | ~ | 3 arched limestone bays [L]; size best-guess |
| Vehicle Bay 2 | (-101,150) | 14×24 | 0→14 | 336 | ~ |  |
| Vehicle Bay 3 | (-87,150) | 14×24 | 0→14 | 336 | ~ |  |
| Energy Forge | (-73,150) | 22×24 | 0→14 | 528 | ~ | [U] battery vault (105 kWh), SPAN/aGate, heat recovery; shelter #3 pit under |
| Airlock | (-51,150) | 5×10 | 0→12 | 50 | A | ~50 ft2 locked; vestibule from bays into the expansion |
| Compute Room | (-46,150) | 15×14 | 0→12 | 210 | A | ~200 ft2 locked; racks, in-row liquid cooling |
| Research Room | (-46,164) | 18×14 | 0→12 | 252 | A | ~250 ft2 locked; Jonathan-locked; mullioned partition onto Compute |
| Instrument Bay (upgrade) | (-28,150) | 16×14 | 0→12 | 224 | ~ | UPGRADE, not committed; 2A east-end extensibility reservation only |

## Motor Barn — loft (over Forge, floor z=14)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Loft | (-73,150) | 18×24 | 14→24 | 432 | L | 18x24 vaulted E-W; exercise, air-hockey heirloom, screen |
| Podcast Studio | (-63,162) | 8×12 | 14→24 | 96 | L | 8x12 [L]; NE loft corner vs E gable; Jonathan-locked |

## Observatory (isolated)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Observatory tower | (150,-270) | 13×13 | 0→22 | 169 | A | ~120 ft2 octagon [L]; 18" limestone; pier 2A / shell 2C; vault (U-2) below; >=200' pool, >=150' Motor Barn |

## Cedar Pavilion

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Cedar Pavilion | (-58,-30) | 20×24 | 0→14 | 480 | L | 20x24 locked; open cedar; 2x L2 chargers; slab 2A / structure 2B |

## Pool & Terrace (canyon side)

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| Pool | (74,-50) | 16×40 | -1→0 | 640 | ~ | [U] zero-entry from Sunroom; infinity edge to canyon; lunar tidal algorithm |
| Pool Terrace | (62,-58) | 48×48 | deck | 2304 | ~ | [U] terrace deck around pool; three climate poles; Sauna sits at its edge |

## North Alley Pergola

| Room | SW (x,y) | W×D | z floor→ceil | Area ft² | Src | Notes |
|---|---|---|---|---|---|---|
| North Alley Pergola | (-10,60) | 60×12 | 0→9 | 720 | ~ | [U] Corten steel + limestone bases; Champanel grape; Firewise; under Primary oriel |

## What’s locked vs. guessed

- **Exact (L/D):** 19 rooms — the Main Block grid + figures the Register states outright (Glass Bridge 8×12, Pavilion 20×24, Loft 18×24, Podcast 8×12, Scullery 9×12, Powder 5×6, Quiet ~10×12, oculus 6′).
- **Area locked, shape guessed (A):** 13 rooms — Kitchen 460, Pantry+Wine 220, Mudroom 140, Right Passage 240, Sunroom 680, Pool Bath 60, Orangery 450, Observatory 120, Compute 200, Research 250, airlock 50, the dome footprint. Areas are real; the W×D chosen to hit them is not.
- **Best-guess (~):** 21 rooms/elements — en-suites, Tea Station, Mechanical, the Motor Barn bays/Forge/Greenhouse/Instrument Bay, Pool, Pergola, Covered Walkway, terraces. Plausible, unsurveyed.

## Validation (run on every build)

- Guest Suite subdivisions: **350 ft²** vs locked 350 — ✓
- Main Block grid: 16 + 12 + 16 = 44 wide, 20 + 18 = 38 deep — ✓
- Observatory → pool: **216′** (≥200) — ✓ · Observatory → Motor Barn: **438′** (≥150) — ✓
- Box overlaps: **none** except the six intentional carved-child / open-to-above pairs listed above — ✓

## Known soft spots to revisit with real intent (not from this file)

- The **Service Wing total** (Register has it `[U]` at ~1,400–1,600 ft²; the room boxes here fill ~1,180 + circulation).
- **Every en-suite / dressing subdivision** (Imber’s at DD) and the **Guest Suite split** (the 350 total is honored; the internal 176/110/64 is a guess).
- The **Pool footprint** (no figure exists anywhere yet) and the **terrace climate poles**.
- **Inter-building spacing**: the ≥200′/≥150′ setbacks are now honored numerically, but absolute siting and the parcel rotation are the 2032 decision.
- **Heights outside the Main Block** (12/10/24 locked) are best-guess.
- The **Motor Barn footprint** has no single locked figure — it’s built here as itemized volumes (bays + Forge + expansion + greenhouse).

---
*Built from Compound Register v1.7; all coordinates validated in code. Provisional — for the PWA feel-model only. Re-derive against Imber DD; do not propagate these numbers into the authoritative documents.*