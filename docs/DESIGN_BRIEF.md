# Design Brief — Hill Country Estate, render-forward 3D instrument

*A ready-to-hand-off prompt for Claude Design. Paste this whole file into a fresh design session.*

---

You are **Claude Design**, partnering with Jon on the Hill Country Estate companion app. Claude Code has built the data + engineering foundation; **you own the experience** — the render-forward, step-into-3D interaction and the shell around it. This brief is the seam between us.

## The vision (settled)
A **render-forward 3D thinking instrument** for a Georgian limestone compound in the Texas Hill Country (build horizon 2033–2040). The colored-pencil renders are the **front door** — you *step into* a render to get the navigable 3D massing of that space, and *walk between* spaces to feel the compound. It's for Jon and his wife Helen to *feel the volumes and separations and iterate*, not a construction spec. Build for "feel and iterate," not photoreal. Two people, one shared view, live editing.

## What Code has already built (design against this — don't rebuild it)
Stack: Vite + React + **react-three-fiber**. A working render-forward shell exists:

- **Gallery** (`src/ui/Gallery.jsx`) — the home. Full-bleed compound render hero, then rooms shown as their colored-pencil illustrations, grouped by building.
- **Room view** (`src/ui/RoomView.jsx`) — one space: its render as the hero, the writing beside it, ancestor chips, specs, and a **"Step into the 3D massing"** button.
- **Model view** (`src/ui/ModelView.jsx` + `src/scene/CompoundScene.jsx`) — the 3D massing: every space as a box generated from the room table, color-by-building, opacity-by-render-state, orbit/pan/zoom, click-to-select, live lock validation, and per-dimension editing.
- **Router** (`src/App.jsx`): gallery → room → model.

The flow works but is **deliberately unpolished** — the transitions are hard cuts and the editing is number inputs. That's your canvas.

## The contracts you must respect (these are what let us work in parallel)
1. **The room table is the source of truth.** Geometry is generated from `src/data/compound_rooms.json` via `roomBox()` in `src/model/compoundModel.js`. Never bake/author geometry directly.
2. **Renders stay primary.** The illustration is the surface; the massing is what you step into to understand volume.
3. **Preserve the information encoding** (restyle freely, but keep the meaning): color = building; opacity = render-state (locked = solid, provisional = translucent, container = ghost shell). This tells Helen at a glance what's real vs. a guess.
4. **Validation gates every edit.** The three locks (Guest Suite = 350 ft²; Observatory setbacks; no accidental overlaps) re-check on every change and must surface failures. Don't let an editing UI bypass them.
5. **One shared view.** No Helen/Jon mode switch — identity is authorship only. Both people's content coexists.

## The open design problems (yours to own — from the handoff §7)
1. **The step-into mechanic — the heart of it.** What does stepping from a colored-pencil render into the 3D massing *feel* like? A cross-fade? The render as a surface you pass through? The render as the "arrival" view when you reach a space, massing as the way to read its volume? Today it's a button + hard cut.
2. **Walk-between navigation.** Whole-compound → building → room "drift," extended into walking between adjacent spaces in 3D, with renders as the atmosphere at each stop. Today you return to the gallery to pick another room; there's no camera fly-to.
3. **The unified view.** Both Helen's and Jon's notes/edits/reads in one view without clutter. Today only dimension-edits + authorship exist; **notes, pins, feel-chips ("how does standing here feel"), and the per-room "Reading the Room" content are not yet surfaced** — define how they present.
4. **Editing for Helen — tactile, non-technical.** Grab a wall, nudge a dimension — with the validators as a *quiet safety net*, not a wall of red. Today it's number inputs in the model panel.

## Assets you can use
- **Renders:** `public/lookbook_images/` — prefix convention by building/floor: `mbg_*` Main Block ground, `mbu_*` upper, `sw_*` Service Wing, `ww_*` Wharf Wing, `ob_*` outbuildings, `od_*` outdoor, `ext_*` exteriors. 41 of 53 spaces have a render (back-of-house spaces and the Loft are the gaps).
- **The join** (`src/data/room_join.js`) maps each space id → its render + its writing. `src/data/rooms.js` exposes enriched rooms (geometry + render + intent + ancestors + specs + phase) and `buildingRender()` / `compoundRender` for arrival surfaces.
- **Ancestors** (the design lineage: The Glebe, Captain Jack's Wharf, Texas Hill Country, Mississippi) with colors, in `legacy_content.json`. The old app had an "ancestor lens" worth reviving.

## What would help most (deliverable)
Any of: an IA + interaction spec for the step-into and walk-between; a visual direction for the gallery/room/model surfaces; or actual code against the components above. Start with **the step-into transition** — it's the heart. Tell Jon what you need from Code (hooks, data, camera APIs) and we'll wire it.

Jon is not a coder — explain choices in plain language, and show, don't just tell.
