# The Texas Gambit — Hill Country Estate

A **render-forward 3D instrument** for the Hill Country compound: a private tool for Jon and Helen to *feel* the house and iterate on it, years before it's built (horizon 2033–2040). The colored-pencil renders are the front door — you step into them to a navigable 3D massing, and walk from room to room.

> **Live:** https://jonathantheblip.github.io/the-texas-gambit/

## The one principle
**`src/data/compound_rooms.json` is the source of truth.** The 3D geometry is *generated from it* at runtime; validation gates every edit; the `.gltf` is a regenerated export, never the source. Don't edit meshes — edit the table. The three locks (Guest Suite = 350 ft², Observatory setbacks, no accidental overlaps) are enforced in `src/model/compoundModel.js` (`validate()`), in `scripts/validate.py`, and by the test suite + CI.

## What it does
- **Gallery** — the compound's renders as the primary surface, grouped by building.
- **The Walk** — phone-first, render-led wayfinding: each room's render fills the screen and you move to an adjoining space from a thumb-zone compass. **Fly mode** flies the camera through the 3D massing between rooms (toggle off for a flat wipe). Includes **Reading the room** (intent, feel, author-stamped notes) and **render pins** (tappable hotspots on the render).
- **3D massing** — every space generated from the room table; toggle massing / renders / both + a sticky **Focus**; **grab a wall to resize** with the locks re-checking live; a **Bird's-eye** of the whole compound (building masses faded by build phase) that flies you down into any building.
- **Shared + offline** — dimension edits, notes, and feel-chips sync between Helen and Jon (Supabase) and survive offline; installable PWA.
- One unified view (the old Helen/Jon mode split is retired; identity is authorship only).

## Stack
Vite + React 18 + **react-three-fiber** / drei / three. Supabase for the shared store. Installable PWA (service worker + manifest). Deploys as a static build to GitHub Pages.

## Run it
```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # serve the built app (with the service worker)
npm test           # locks + core-contract tests (Vitest)
npm run validate   # run the Python lock gate on the room table
```
Helper scripts: `npm run optimize-images` (render PNG→WebP) · `npm run export:design` (portable data pack for Design).

## Layout
```
src/
  data/    compound_rooms.json (truth) · rooms.js (merge) · room_join.js (render+writing join)
           legacy_content.json · adjacency.js (walk graph) · plan.js (map geometry)
  model/   compoundModel.js — roomBox() + validate() + PALETTE/LOCKS (framework-agnostic)
  scene/   CompoundScene, RoomBox, Diorama, WallHandles, BuildingMasses, Flythrough,
           cameraBus, massing, flyto, wallEdit, buildingMasses (3D + helpers)
  ui/      Gallery, Walk, ReadingSheet, WalkMap, ModelView, MassingCurtain,
           RenderPins, styles.css, walk.css
  data/    …also aliases, facings, feel, lineage, phases, pins.json + pins.js
  store/   geometryStore (shared room-edit sync) + useGeometry
  nav/     navStore + useNav (single current-room source)
public/    lookbook_images/ (renders, WebP) · favicons · manifests
scripts/   validate.py · optimize_images.mjs · export_design_pack.mjs · extract_legacy_content.mjs
docs/      handoff, design brief, code↔design contract, immersive prompts, dimensional schedule
design-handoff/  portable pack for Design (regenerate with npm run export:design)
legacy/    the previous no-build app, kept for reference (not built)
supabase/  schema.sql (room_state/notes/pins/... + room_overrides)
```

## Deploy
**Live** on GitHub Pages via Actions (`.github/workflows/deploy.yml`), triggered on push to `main`. See [GH_PAGES_SETUP.md](GH_PAGES_SETUP.md). CI (`ci.yml`) runs the locks, tests, and build on every push.

## Docs
- [docs/HANDOFF_FOR_CLAUDE_CODE.md](docs/HANDOFF_FOR_CLAUDE_CODE.md) — the render-forward restructuring brief.
- [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) — what Claude Design owns (the experience).
- [docs/CODE_DESIGN_CONTRACT.md](docs/CODE_DESIGN_CONTRACT.md) — the seam between Code and Design.
- [docs/IMMERSIVE_PROMPTS.md](docs/IMMERSIVE_PROMPTS.md) — Marble/Skybox prompts for the "dream."
- [SYNC.md](SYNC.md) — how work flows between Code, Design, and the Claude-loop.

— Jon, with Claude
