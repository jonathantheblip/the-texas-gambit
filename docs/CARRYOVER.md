# Carryover — state & orientation

*Living doc, last refreshed 2026-06-29. **Live** at https://jonathantheblip.github.io/the-texas-gambit/. Read alongside [NORTH_STAR.md](NORTH_STAR.md) (the forest) and [CODE_DESIGN_CONTRACT.md](CODE_DESIGN_CONTRACT.md) (the seam with Design). Memory auto-loads from `~/.claude/projects/-Users-jjackson-dev-the-texas-gambit/memory/` (MEMORY.md).*

> **Anti-staleness rule for whoever edits this:** describe *mechanisms and how to get current truth*, not frozen snapshots. Say "run `npm test`", not "N tests". Say "`main` is live; verify by matching the deployed index chunk", not "live at commit abc123". Frozen facts are where rot starts (this doc has been bitten before).

## What the app is now
A **render-forward 3D PWA** of the Hill Country Estate compound. The spine:
- **Gallery** — every room's colored-pencil render, grouped by building → tap one to enter the walk.
- **The Walk** (`src/ui/Walk.jsx`, `walk.css`) — phone-first, dark, immersive. Each room's render fills the screen; you move to an adjoining space from a thumb-zone compass. **Fly mode** (default on) flies the camera through the 3D massing between rooms; off = the flat directional wipe. Portrait = immersive; phone-landscape = map-forward survey.
- **Reading the room** (`ReadingSheet.jsx`) — intent, feel-chips, author-stamped notes (Helen/Jon).
- **Render pins** (`RestingPins.jsx` + `RenderPins.jsx`) — faint terracotta rings *breathe on each render* (the pins **are** the invitation; no chip). Tap one → the whole render lifts into a dimmed "look closer" where each ring takes its kind colour and a note unfurls. Design's treatment, integrated. (Content workstream — see below.)
- **Step into the 3D massing** (`ModelView.jsx`) — boxes generated from the room table; **Both / Renders / Massing** view toggle + a sticky **Focus** toggle; **grab-a-wall** drag-to-resize with live lock validation; a **Bird's-eye** that pulls back to the whole compound (building masses faded by build phase) and flies you down into any building.
- **Shared + offline** — dimension edits, notes, feel-chips sync via Supabase (local-first, degrades to local); installable PWA; identity = authorship.

## What's shipped (newest first — all live)
- **Render pins — Design's treatment shipped; content ongoing.** Data in `src/data/pins.json` (one object keyed by canonical room id; each pin `{x,y,label,note,kind}`, x/y = % of the render). `pins.js` imports it; `pinsFor(id)` canonicalizes. **Treatment** (`RestingPins.jsx`, `RenderPins.jsx`, pure `pinGeom.js`+test / `pinKinds.jsx` / `pinImage.js`, tokens in `walk.css`): breathing terracotta rings on the render (no chip) ride the `background-size:cover` crop — positioned in COVER-space, repositioned by ResizeObserver **+ resize/orientationchange**; tap → the render lifts into a full-stage look-closer (CONTAIN-fit, so pins are plain `x%/y%` children) where rings draw on in their kind colour and a clamped note unfurls. **Pipeline: Claude Chat authors a JSON batch → drop in chat → merge into `pins.json` → deploy.** 50 rooms wired; remaining keylist rooms still to author.
- **All four of Design's next-layer items** (in `ModelView`/`CompoundScene`, the stepped-into 3D — they compose: bird's-eye → tap a building → fly in → land *focused* with *grabbable walls*):
  - **Walk fly-to** (`flyto.js`, `Flythrough.jsx`) — camera flies through the massing between rooms. Fly toggle persists (`tg.fly`, default on). Substrate is one lazy `CompoundScene` under the render veil, `frameloop` demand↔always so idle costs ~no GPU; three.js stays code-split. Camera *arc* (lift over the masses) is on `driftToRoom({arc})` — bus flights only.
  - **Sticky room-focus** — focus on the entered room now *persists* across the Both/Renders/Massing toggle (the Diorama is focus-aware); the **Focus** toggle is the explicit "see everything" escape.
  - **Grab-a-wall** (`WallHandles.jsx` + pure `wallEdit.js`) — drag a wall grip to resize; far wall anchored, clamp 4ft, locks re-validate live; `setOverride(...,{sync:false})` keeps drag frames off the backend, release commits once. ⚠ **Drag gesture unverified on-device** — the sandbox can't drive r3f pointer picking; Jon to confirm the feel.
  - **Bird's-eye** (`BuildingMasses.jsx` + pure `buildingMasses.js`) — overview of building masses faded by **real build phase** (`phases.js`, from Master Plan v3 Part V: 2A core/Wharf/walkway/Cedar · 2B Service/Orangery/Pool/Pergola · 2C Motor Barn/Observatory), tap-to-fly-in.
- **Renders complete** — every room has art (the last placeholder, the aliased Octagonal Stair Hall, shows the Entry Hall). Drop new PNGs in `~/Downloads`, `optimize_images.mjs` → WebP, wire in `room_join.js`. *New back-of-house rooms have a render but no writing yet (`source:null`).*
- **The Walk + Reading-the-Room + unified map** — Design's original Lookbook drop, integrated against the live APIs. Retired the old `RoomView.jsx` + `Minimap.jsx`.
- **Entry Hall + Octagonal Stair Hall = one space** (`aliases.js`) — folds across walk/nav/massing/map; geometry/locks untouched (still two real volumes).
- **Deployed + Supabase live** — Pages deploy + all sync paths. One open real-device check (below).

## Stack & key files
Vite + React 18 + react-three-fiber/drei/three; Supabase; PWA. (`ls src/**` for the full tree — don't trust a frozen list here.)
- `src/data/` — `compound_rooms.json` (truth) · `rooms.js` (merge/`applyOverrides`) · `room_join.js` (render+writing join; `.png` names → `.webp` at load) · `adjacency.js` (`neighborsOf`, `ENTRY_ROOM`) · `plan.js` (`compoundPlan`) · `aliases.js` · `facings.js` · `feel.js` · `lineage.js` · `phases.js` · **`pins.json` + `pins.js`** · `legacy_content.json`
- `src/model/compoundModel.js` — `roomBox()`, `validate()`, `PALETTE`, `LOCKS`, `ANCHORS` (mirrors `scripts/validate.py`)
- `src/scene/` — `CompoundScene`, `RoomBox`, `Diorama`, **`WallHandles`**, **`BuildingMasses`**, **`Flythrough`**, `cameraBus`, `massing`, `flyto`, `wallEdit`, `buildingMasses`
- `src/ui/` — `Gallery`, `Walk`, `ReadingSheet`, `WalkMap`, `ModelView`, `MassingCurtain`, **`RenderPins`**+**`RestingPins`** (+ pure `pinGeom`/`pinKinds`/`pinImage`), `styles.css`, `walk.css`
- `src/store/` — `geometryStore`+`useGeometry` (dimension sync; `setOverride(id,patch,author,{sync})`) · `roomLayerStore`+`useRoomLayer` (notes/mood)
- `src/nav/` — `navStore`+`useNav` (one current-room source) · `scripts/` — `validate.py`, `optimize_images.mjs`, `export_design_pack.mjs`

## The contracts (Code ↔ Design ↔ Chat seams) — see [CODE_DESIGN_CONTRACT.md](CODE_DESIGN_CONTRACT.md)
- `neighborsOf(id)` → `{id, heading:N/E/S/W|null, vert:up/down|null, via}` · `compoundPlan` · `navStore`/`useNav` · `ENTRY_ROOM='front_porch'`.
- **Camera (Code owns it):** `cameraBus.driftTo/onReady/onArrival`; `massing.open(roomId,{facing,onReady,onExit})`; `CompoundScene` props `frameloop/instantArrival/enableControls/background/birdsEye/onFlyIn`.
- **Render pins (Chat authors, Code displays):** `pins.json` keyed by canonical room id, pins `{x,y (% of render), label, note, kind∈material|view|feature|heritage}`. Positions are %; don't change them in Code.

## Render pins — the active workstream
- **Authoring (Claude Chat):** has the Master Plan + specs + renders; produces one JSON batch per set of rooms, keyed by the room ids Code provides (dwell rooms first). Drops the JSON to Jon → Code.
- **Wiring (Code):** merge the batch into `pins.json`, spot-check one room in the preview, deploy. (50 rooms in; remaining keylist rooms still to author.)
- **Treatment (Design — delivered + integrated):** the breathing-rings-on-the-render entry, the cover→contain lift, the four kind colours (always icon + word, never colour-alone), and the unfurling note are Design's handoff (`handoff-pins/`: README + tokens + annotated DOM + spec PNGs), now live. The `pins.json` data contract is unchanged. Open question Design left: landscape note placement (current default = unfurl beside the pin, clamped — works). Tunable if wanted: `--lc-dim` (.80) lets the walk show faintly through the dimmed surround.
- **Known content notes:** render is canon over the Master Plan where they disagree (Drawing Room is **red**, plan said white plaster — render wins; flag plan drift to Jon). The Drawing Room art-alcove (east wall) needs a *second* render looking east before it can get a pin.

## Run / verify / deploy
- `npm install` (see Gotchas) · `npm run dev` · `npm test` · `npm run validate` · `npm run build`. Keep all three green before committing.
- **Preview (Claude_Preview MCP):** `preview_start "dev"` → `preview_eval`/`preview_screenshot`/`preview_resize`. Verify phone viewports **375×812** + **812×375**. NB: eval runs in an **isolated world** — DOM + drei `<Html>` are reachable; app JS globals and r3f 3D pointer-picking are not (see [[reference-preview-3d-verification]]). Unit-test pure logic instead of synthesizing 3D gestures.
- **Deploy:** `main` is the live branch (push → `.github/workflows/deploy.yml` → Pages). Pattern: commit on `render-forward-3d`, push it (backup), `git branch -f main render-forward-3d`, push both. **Code can push `main` directly now** — Jon added the allow rule ([[reference-deploy-push-credential]]). Verify: Action green, then `curl` the live `index.html` and confirm its `index-*.js` chunk exists in your fresh `dist/`. Only deploy integrated + green + phone-verified.

## Gotchas
- **npm EACCES** (root-owned `~/.npm`): pass `--cache /private/tmp/<scratchpad>/.npmcache`. Don't `sudo`.
- **Dev port:** `vite.config.js` honors `$PORT`; `.claude/launch.json` has `autoPort:true` so two chats can run side by side.
- **Supabase:** schema complete (all tables incl. `room_overrides`). Sandbox preview can reach REST (real errors) but realtime websockets may not connect → it shows "Local only" there; verify true cross-device sync on real devices.
- App code may use `Date.now()`/`Math.random()` freely (the ban is only inside Workflow scripts).

## Open / next
1. **Render pins — keep going:** Design's treatment is integrated; Chat authors the remaining keylist rooms; Code merges + deploys each batch (the merge→spot-check→deploy loop). Drag-on-device feel of the new pins is still a nice on-phone confirm for Jon.
2. **Confirm grab-a-wall on a real device (Jon):** drag a wall, watch the locks re-check — the one piece the sandbox couldn't drive.
3. **Real-device sync check (Jon):** note/edit on one device → appears on another. Low risk (additive, degrades to local), just unconfirmed end-to-end.
4. **Writing for the back-of-house rooms** (`source:null` in `room_join.js`) — Design adds intent/specs when ready.
5. **A second staircase view** — Jon wants it; Claude Chat has struggled to generate it. Parked.
6. **First-pass tunables** (fine to leave): fly `dur`/arc + `--wk-fly-*`; grab-a-wall grip size/min-dim; bird's-eye `overview` angle; per-room facings; cross-fade knobs; pergola phase (inferred 2B).

## Parked
The **dream** (Marble/Skybox immersive 360) — needs new 360 art. Proven, not now.

## Working agreement (per Jon)
Jon is a non-coder; plain language, outcome over preservation. Sequence behind dependencies; let Jon set the pace; no time estimates. Commits/pushes/deploy are pre-authorized once integrated + green + phone-verified — never half-built. Design owns the experience; integrate their drops, don't pre-empt them. Don't rabbit-hole or break the locks.

## Pointers
[CODE_DESIGN_CONTRACT.md](CODE_DESIGN_CONTRACT.md) · [NORTH_STAR.md](NORTH_STAR.md) · [DESIGN_BRIEF.md](DESIGN_BRIEF.md) (what Design owns) · HANDOFF_FOR_CLAUDE_CODE.md (original brief) · IMMERSIVE_PROMPTS.md (the dream) · ../README.md · ../SYNC.md · ../GH_PAGES_SETUP.md · `design-handoff/` (portable pack).
