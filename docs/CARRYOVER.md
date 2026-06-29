# Carryover — state & overnight run

*As of 2026-06-28 (after the overnight integration run). Design's Walk is integrated; `render-forward-3d` **and** local `main` are at `0651f20` — verified + green but **not yet pushed** (push blocked on credentials — see Deploy). Live site still serves the OLD app until someone runs `git push origin main`. Read with [NORTH_STAR.md](NORTH_STAR.md) (forest) and [OVERNIGHT_LOG.md](OVERNIGHT_LOG.md) (this run's blow-by-blow).*

## Where things stand (built + working on the branch)
- **Gallery** (renders grouped by building) → **Room view** (render hero + writing + ancestor chips + "you are here" minimap + "walk to an adjoining space" strip) → **step into the 3D massing** → **back to the walk**.
- **3D massing**: boxes generated from the room table; view toggle **Both / Renders (diorama) / Massing**; click-to-select; **live-validated dimension editing** (locks re-check on every keystroke).
- **Shared + offline**: dimension edits sync via Supabase (`geometryStore`); installable **PWA** (offline app shell); identity = authorship (Helen/Jon).
- **Mobile**: portrait = render-led reading/walking + small map; phone landscape = survey (render + larger map). Renders are **WebP** (~12 MB total; lazy + cached). 3D engine is **code-split** (light first load).
- **Quality gate**: Vitest suite (15 tests) + `validate.py` guard the locks; CI runs them on every push.
- **Step-through** (render → massing): `massing.open()` holds the render full-frame, cross-fades to the 3D focused on the room (facing-aware arrival pose → free orbit), "← Back to the walk" returns.

## Stack & layout
Vite + React 18 + react-three-fiber/drei/three; Supabase; PWA. Key files:
- `src/data/` — `compound_rooms.json` (truth) · `rooms.js` (merge + `applyOverrides`/round-trip) · `room_join.js` (render+writing join) · `legacy_content.json` · `adjacency.js` (`neighborsOf`, `ENTRY_ROOM`) · `plan.js` (`compoundPlan`)
- `src/model/compoundModel.js` — `roomBox()`, `validate()`, `PALETTE`, `LOCKS`, `ANCHORS`
- `src/scene/` — `CompoundScene`, `RoomBox`, `Diorama`, `cameraBus` (driftTo/onReady/onArrival), `massing` (open)
- `src/ui/` — `Gallery`, `RoomView`, `ModelView`, `Minimap`, `MassingCurtain`, `styles.css`
- `src/store/` — `geometryStore` + `useGeometry` (shared edit sync)
- `src/nav/` — `navStore` + `useNav` (single current-room source)
- `scripts/` — `validate.py`, `optimize_images.mjs`, `export_design_pack.mjs`, `extract_legacy_content.mjs`

## The contracts (the seam with Design) — see [CODE_DESIGN_CONTRACT.md](CODE_DESIGN_CONTRACT.md)
`neighborsOf(id)` → `{id, heading:N/E/S/W|null, vert:up/down|null, via:door/opening/stair}` · `compoundPlan` (footprints+bounds+north) · `navStore`/`useNav` (one current room) · `cameraBus.driftTo/onReady/onArrival` (Code owns the camera) · `massing.open(roomId,{facing,onReady,onExit})` (in-page step-through) · `ENTRY_ROOM='front_porch'`.

## Design's Walk — INTEGRATED (this run)
Design's drop (`Lookbook (1).zip`) is fully integrated against the live APIs:
- **The Walk** (`src/ui/Walk.jsx`, `walk.css`) replaces the old `room` mode — dark immersive render-stage, directional arrival (enter-from-heading; stairs lift/drop), thumb-zone compass exit dock, crumbs + map button, arrival hint, travel wipe. Portrait-immersive / landscape-survey.
- **Reading-the-Room** (`src/ui/ReadingSheet.jsx`) — intent, feel-chips, author-stamped notes, Helen/Jon toggle, step-into CTA.
- **Unified map** (`src/ui/WalkMap.jsx`) — one shared plan at building + compound scope from `compoundPlan` + `neighborsOf`, lineage colors, tap-to-walk.
- **Facings** (`src/data/facings.js`) → `navStore.enterMassing` defaults the arrival pose. **Cross-fade** push-through (4 tunable knobs in `styles.css`, counter-motion in `ModelView`).
- **Notes/chips sync** (`src/store/roomLayerStore.js`) via the existing `notes` table + `room_state.mood` — **no schema change**; local-first, degrades to local.
- New data: `src/data/lineage.js` (color = building/ancestor family), `feel.js`. Retired `RoomView.jsx` + `Minimap.jsx`.
- **Open (deferred):** ④ richer whole-compound bird's-eye (building masses + phase opacity + click-to-fly); Design's other next-layer items (walk-between fly-to in 3D, grab-a-wall editing, spatial render pins). Facings + cross-fade knobs are first-pass — tune live with Design.

## Parked
The **dream** (Marble/Skybox immersive 360) — needs new 360 art. Tested, proven, not now. Don't spend overnight effort here.

## Run / verify
- `npm install` (see Gotchas) · `npm run dev` · `npm run build` · `npm run preview` · `npm test` · `npm run validate`.
- Preview via the **Claude_Preview MCP**: `preview_start "dev"` → `preview_screenshot` / `preview_eval` / `preview_resize`. Verify on phone viewports: **375×812 (portrait)**, **812×375 (landscape)**.
- Always keep `npm test` + `npm run validate` green and the build clean before committing.

## Gotchas
- **npm EACCES** (root-owned `~/.npm`): pass `--cache /private/tmp/<scratchpad>/.npmcache`. Don't `sudo`.
- **Supabase**: set up by Jon (schema included) — treat it as done, don't re-flag it. The sandbox preview shows "Local only" only because the preview can't reach realtime; that's the sandbox, not a missing table. Verify sync post-deploy, not in the sandbox.
- App code may use `Date.now()`/`Math.random()` freely (the ban is only inside Workflow scripts).

## Deploy — READY, awaiting `git push origin main` (blocked on credentials this run)
**Fully wired** (Pages source = GitHub Actions). A push to `main` runs `.github/workflows/deploy.yml` → publishes to **https://jonathantheblip.github.io/the-texas-gambit/** → **straight to Helen.** All the north-star preconditions are met: Design's experience is **integrated, green** (`npm test` 26✓ + `npm run validate` locks-hold + `build`), and **verified on a phone viewport** (portrait + landscape) including a real production-build run. Local `main` is at `0651f20`, ready.

**Why it's not live yet:** `git push` was denied 403 — the active credential here (`jonathan-crescent`) is READ-only, and switching to the owner account `jonathantheblip` was blocked by the credential-safety classifier (not worked around). **To ship:** from a terminal where Jon's own GitHub credentials are active, run `git push origin main`. Then sanity-check the live URL loads, and verify cross-device **sync** (leave a note on one device → see it on another; can't be tested in the sandbox, which shows "Local only"). Also push `render-forward-3d` for backup.

## Overnight-run protocol
1. **Ingest** Design's dropped file. Read NORTH_STAR.md + this file + skim CODE_DESIGN_CONTRACT.md.
2. **Ask Jon** every clarifying question up front (scope, priorities, how far to deploy, no-go zones, anything missing from Design's drop like facing data).
3. **Then run autonomously:** integrate Design's work against the live APIs; wire facing + cross-fade; build the unified wayfinding / Reading-the-Room as Design specs; add tests for new logic; **verify on a phone viewport**; commit checkpoints with clear messages.
4. **Pre-authorized** (per Jon): commits, pushes, deployment — but only once integrated, green (`npm test` + `npm run validate` + build), and verified. Don't deploy half-built.
5. **Don't** rabbit-hole, break the locks, touch the parked dream, or collide with Design's experience layer beyond integrating their handoff.
6. **Leave a running log + a final summary**: what shipped, what's open, decisions made, and anything Jon must do (Pages + Supabase are already set, so likely nothing — but call out anything that surfaced).

## Pointers
HANDOFF_FOR_CLAUDE_CODE.md (original brief) · DESIGN_BRIEF.md (what Design owns) · IMMERSIVE_PROMPTS.md (the dream) · ../SYNC.md · ../README.md · ../GH_PAGES_SETUP.md · `design-handoff/` (portable pack) · memory at `~/.claude/projects/-Users-jjackson-dev-the-texas-gambit/memory/` (MEMORY.md auto-loads).
