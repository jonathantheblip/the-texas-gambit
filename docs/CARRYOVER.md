# Carryover — state & overnight run

*As of 2026-06-29. Design's Walk is integrated and **DEPLOYED LIVE** at https://jonathantheblip.github.io/the-texas-gambit/ — `main` + `render-forward-3d` pushed at `e269646`, CI green, Pages deploy succeeded, live URL serves the new app. Read with [NORTH_STAR.md](NORTH_STAR.md) (forest) and [OVERNIGHT_LOG.md](OVERNIGHT_LOG.md) (this run's blow-by-blow).*

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
- **Supabase**: schema now complete — all tables exist incl. `room_overrides` (created 2026-06-29). All sync paths work live. Note: the sandbox preview CAN reach Supabase REST (it returns real errors), so "table not found" there is real, not a sandbox artifact (that's how we caught the missing table). Realtime websockets may not connect in-sandbox → it can read "Local only" there; verify true cross-device sync on real devices.
- App code may use `Date.now()`/`Math.random()` freely (the ban is only inside Workflow scripts).

## Iteration after launch (2026-06-29, live)
Shipped to `main`/live in response to Jon's review of the live app:
- **Plain-language names** — `room.displayName` drops the architect suffix ("(front, S-ctr)", "(SW)") everywhere Helen reads; full `r.name` kept for validation. Floors read Ground/Upper/Roof/Outdoor.
- **Calm step-into** — stepping in from the walk lands in Massing (not the all-renders "Both" collage) AND focuses: camera frames the entered room, other rooms fade to ghosts, their renders gone; the room you're in stays prominent. Any view-toggle clears focus → see everything (panel stays user-agnostic).
- **Old-icon 404 fix**: `public/{helen,jon,Hill Country Estate}.html` redirect into the app (Helen's existing home-screen icon works — no re-add; she "doesn't do homework").
- **3 renders** (from Jon's Midjourney pass): Entry Hall (the grand octagonal stair — replaced the old faces-render), Drawing Room (red refresh, faces removed; writing/spec aligned to red), Glass Bridge (new — filled a placeholder). WebP via `optimize_images.mjs`. Renders-with-art 41→42/53.
- **Entry Hall + staircase = one space** (`src/data/aliases.js`): `octagonal_stair_hall` folds into `entry_hall_front_s_ctr` across walk, nav, massing, and map — geometry/locks untouched (still two real volumes). The stair-up lives on the Entry Hall; you never walk "between" the halves.
- **Glass Bridge caption** (`legacy_content` `glass-bridge` + join source) — makes the year-round comfort explicit (solar-control glass, brise-soleil, radiant + ridge vents).
- **Caption legibility** (`walk.css`): hero captions washed out over bright renders (e.g. the pale stair) — added a localized scrim behind the caption + dark-glass feel-cue chips so text reads over any render. (This + plain-language names = both halves of Jon's "readability + S-ctr" ask.)

**Supabase — all sync live (resolved 2026-06-29):** Jon created the missing `room_overrides` table; verified via REST (read 200 + insert/delete round-trip). All four sync paths now work live: dimension edits (`room_overrides`), notes (`notes`), feel-chips (`room_state.mood`), plus the legacy `pins`/`journal`. The "one shared view" is fully wired.

## Deploy — DONE (live)
**Shipped 2026-06-29.** `main` pushed at `e269646` → `.github/workflows/deploy.yml` published to **https://jonathantheblip.github.io/the-texas-gambit/** (CI green; live URL 200, serving the new app). Unblocked when Jon granted the session account (`jonathan-crescent`) Write on the repo — see [[reference-deploy-push-credential]]; future autonomous pushes work with that access in place. **One open post-deploy check:** confirm cross-device **sync** on a real device (note on one → appears on another); can't be tested in the sandbox (shows "Local only"). Per the north star, only deploy after integrated + green (`npm test` + `npm run validate` + build) + phone-verified — never half-built.

## Open / next session
The app is shipped, live, and clean — no known bugs; 31 tests + validate + build green. What's genuinely left:
1. **Real-device sync check (Jon only — can't be done in-sandbox):** open on two devices, leave a note (or nudge a wall) on one, confirm it appears on the other. Code is additive + degrades to local, so low risk; just unconfirmed end-to-end.
2. **More renders:** 11 rooms still show the striped placeholder (mostly back-of-house: mechanical/laundry, tea station, pool bath, sauna, airlock, compute/research rooms, instrument bay, podcast studio, dome/oculus). Fill the *experienced* ones as Midjourney produces them — Jon drops files in `~/Downloads` named by room, Code converts (`optimize_images.mjs`) + wires the join. The reusable Midjourney kickoff prompt is in this session's history.
3. **Design's next-layer items** (still on the table): walk-between fly-to *in 3D* (`cameraBus.driftTo` + `onArrival`), grab-a-wall tactile editing (number inputs today), spatial pins on the render, and ④ the whole-compound **bird's-eye** (building masses + phase opacity + click-to-fly).
4. **A second staircase view** — Jon wants it eventually; Claude Chat is struggling to generate it. Parked, not blocking.
5. **First-pass tunables** (fine to leave): per-room facings + the cross-fade knobs (in `styles.css`), the compound-map squash from the Observatory outlier, and the Glass Bridge's generic feel-chips (no seeded set).

## Overnight-run protocol
1. **Ingest** Design's dropped file. Read NORTH_STAR.md + this file + skim CODE_DESIGN_CONTRACT.md.
2. **Ask Jon** every clarifying question up front (scope, priorities, how far to deploy, no-go zones, anything missing from Design's drop like facing data).
3. **Then run autonomously:** integrate Design's work against the live APIs; wire facing + cross-fade; build the unified wayfinding / Reading-the-Room as Design specs; add tests for new logic; **verify on a phone viewport**; commit checkpoints with clear messages.
4. **Pre-authorized** (per Jon): commits, pushes, deployment — but only once integrated, green (`npm test` + `npm run validate` + build), and verified. Don't deploy half-built.
5. **Don't** rabbit-hole, break the locks, touch the parked dream, or collide with Design's experience layer beyond integrating their handoff.
6. **Leave a running log + a final summary**: what shipped, what's open, decisions made, and anything Jon must do (Pages + Supabase are already set, so likely nothing — but call out anything that surfaced).

## Pointers
HANDOFF_FOR_CLAUDE_CODE.md (original brief) · DESIGN_BRIEF.md (what Design owns) · IMMERSIVE_PROMPTS.md (the dream) · ../SYNC.md · ../README.md · ../GH_PAGES_SETUP.md · `design-handoff/` (portable pack) · memory at `~/.claude/projects/-Users-jjackson-dev-the-texas-gambit/memory/` (MEMORY.md auto-loads).
