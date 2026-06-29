# Carryover — state & overnight run

*As of 2026-06-28. Branch `render-forward-3d` (committed, not pushed, not deployed). Read with [NORTH_STAR.md](NORTH_STAR.md) — that's the forest; this is the trees.*

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

## In flight: Design (no repo access; via the portable pack + Jon)
Prototyping the render→massing **arrival cross-fade feel**, the **unified wayfinding** (crumbs + minimap + walk as one), **portrait/landscape** refinement, and **Reading-the-Room / feel-chips** at arrival.
**Code awaits from Design:** per-room **facing (N/E/S/W)** and the **cross-fade timing/easing** — small inputs to wire into `massing.open` / `MassingCurtain`/`styles.css` — plus whatever spec or prototype they send. The portable pack is `design-handoff/` (regenerate with `npm run export:design`); bundles `design-handoff.zip` (+ optional `renders.zip`) are at the repo root.

## Parked
The **dream** (Marble/Skybox immersive 360) — needs new 360 art. Tested, proven, not now. Don't spend overnight effort here.

## Run / verify
- `npm install` (see Gotchas) · `npm run dev` · `npm run build` · `npm run preview` · `npm test` · `npm run validate`.
- Preview via the **Claude_Preview MCP**: `preview_start "dev"` → `preview_screenshot` / `preview_eval` / `preview_resize`. Verify on phone viewports: **375×812 (portrait)**, **812×375 (landscape)**.
- Always keep `npm test` + `npm run validate` green and the build clean before committing.

## Gotchas
- **npm EACCES** (root-owned `~/.npm`): pass `--cache /private/tmp/<scratchpad>/.npmcache`. Don't `sudo`.
- **Supabase**: sync shows "Local only" until the `room_overrides` table exists (it's in `supabase/schema.sql`). Applying it needs the dashboard — Jon's action, not Code's. The sandbox preview can't fully test realtime sync or PWA install regardless; verify those post-deploy.
- App code may use `Date.now()`/`Math.random()` freely (the ban is only inside Workflow scripts).

## Deploy
Dormant. `.github/workflows/deploy.yml` deploys on push to `main` once **Settings → Pages → Source = GitHub Actions** (Jon's one-time switch). `ci.yml` runs locks + tests + build on every push. Per the north star: **deploy after Design's experience is integrated and verified** — not half-built.

## Overnight-run protocol
1. **Ingest** Design's dropped file. Read NORTH_STAR.md + this file + skim CODE_DESIGN_CONTRACT.md.
2. **Ask Jon** every clarifying question up front (scope, priorities, how far to deploy, no-go zones, anything missing from Design's drop like facing data).
3. **Then run autonomously:** integrate Design's work against the live APIs; wire facing + cross-fade; build the unified wayfinding / Reading-the-Room as Design specs; add tests for new logic; **verify on a phone viewport**; commit checkpoints with clear messages.
4. **Pre-authorized** (per Jon): commits, pushes, deployment — but only once integrated, green (`npm test` + `npm run validate` + build), and verified. Don't deploy half-built.
5. **Don't** rabbit-hole, break the locks, touch the parked dream, or collide with Design's experience layer beyond integrating their handoff.
6. **Leave a running log + a final summary**: what shipped, what's open, decisions made, anything Jon must do (e.g. apply the Supabase table, flip the Pages setting).

## Pointers
HANDOFF_FOR_CLAUDE_CODE.md (original brief) · DESIGN_BRIEF.md (what Design owns) · IMMERSIVE_PROMPTS.md (the dream) · ../SYNC.md · ../README.md · ../GH_PAGES_SETUP.md · `design-handoff/` (portable pack) · memory at `~/.claude/projects/-Users-jjackson-dev-the-texas-gambit/memory/` (MEMORY.md auto-loads).
