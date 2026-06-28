# Handoff — Data-Driven 3D Compound Model → PWA

*For Claude Code. Prepared by Claude (design-studio side) for Jon Jackson.*
*Project: Hill Country Estate — a Georgian limestone compound, Texas Hill Country, build horizon 2033–2040.*

---

## 0. Read this first (60 seconds)

We are reorganizing the PWA around a **render-forward 3D model of the whole compound**. The colored-pencil render is the primary surface; you *step into* it to get the navigable 3D massing of a space / room / building / the compound, and walk between spaces for feel. The two separate user modes (Helen's and Jon's) collapse into **one shared view** with live, propagating editing. This is a real restructuring, not a feature bolt-on — and **Claude Design is engaged from the start** to own the experience (§7). The four decisions that set this direction are settled and recorded in §9. One principle governs the engineering underneath it:

> **The room table (`compound_rooms.json`) is the single source of truth. The 3D geometry is *generated from* it at runtime. Validation gates every edit. The `.gltf` is a regenerated export, never the source.**

If you internalize one thing, internalize that. Baking the geometry as the source — editing meshes instead of data — is the failure mode this whole design exists to prevent. (Context: an earlier version of this project nearly traced static SVG floor plans into the model and inherited their errors. Same trap, do not re-enter it.)

This is a **2026 thinking instrument**, not a construction spec. The point is letting Jon and his wife Helen *feel* the volumes and separations and iterate on them. Room dimensions are mostly provisional placeholders until the architect's Design Development (~2031). Only the tagged locks are real. Build for "feel and iterate," not photoreal.

---

## 1. What the PWA currently is (verify against the repo before touching it)

I do **not** have your repo in context — discover it first (`Phase 0` below) and treat the description here as what I understand the frame to be, to be confirmed. As I understand it the PWA is:

- **React + react-three-fiber**, GitHub-hosted, deployed as a PWA.
- It already has a set of **capabilities** that must carry forward (the *structure* around them is being reimagined — see §9):
  - "Reading the Room" — a per-room experiential read.
  - "How does standing here feel" chips (per-room emotional prompts).
  - Notes-and-pins (annotations attached to places).
  - Helen / Jon **personas / user modes** — *being retired* into a single shared view (Decision 2, §9).
  - **Ancestor-layer toggles** (the design is governed by layered "ancestors"; toggles reveal layers).
  - Day mode, **phase tags** (construction phases), and a **building → room drift** navigation feel.

**Important:** unlike a typical "add a feature, don't disturb the frame" handoff, the settled decisions in §9 *do* reorganize the shell — the colored-pencil render becomes the primary surface you step into, and the two user modes collapse into one. So this is a genuine restructuring, and you have latitude to do it boldly (Decision 4). What must survive the restructuring is the **capabilities** above (Reading-the-Room, chips, notes-pins, the layer/phase toggles, the building→room drift) and the **contracts** in §3 — not the current screen structure. Map the existing hooks where they help (layer toggles ≈ node visibility; building→room drift ≈ camera navigation; notes-pins ≈ 3D pins on rooms), but don't feel bound to the current IA.

---

## 2. The package (manifest)

```
hill_country_pwa_model/
  README.md                          short orientation + manifest
  HANDOFF_FOR_CLAUDE_CODE.md         this document
  data/
    compound_rooms.json              ← SOURCE OF TRUTH. 53 rooms + meta/locks.
  model/
    compoundModel.js                 ← framework-agnostic core: room→geometry + validators.
                                       Port this into the r3f app. No three/DOM deps.
    compound_model.html              ← working reference viewer (vanilla three.js).
                                       READ IT to see the target behavior, then port to r3f.
    compound_model.gltf              ← baked export (handoff/portability). Regenerated, not source.
    validate.py                      ← the same validators as a CLI gate (Claude-loop side).
  docs/
    Compound_Dimensional_Schedule_v2.md   the human-readable schedule (the "why" behind the numbers)
```

`compoundModel.js` and `validate.py` and `compound_model.html` implement **the same three validation rules**. Keep them in sync. If you change a rule, change all three.

---

## 3. The contracts (must be preserved exactly)

### 3.1 Coordinate convention
- `x = East(+)`, `y = North(+)`, `z = Up(+)`, units = **feet**.
- Origin `(0,0,0)` = the **Main Block's SW ground-floor corner**.
- A room = SW corner `(x, y)`, footprint `W` (east–west) × `D` (north–south), `zFloor`..`zCeil`.
- three.js / glTF are **Y-up**, so a room maps to: `position = [x+W/2, zFloor+height/2, -(y+D/2)]`, `scale = [W, height, D]`. (`roomBox()` in `compoundModel.js` does this — use it, don't re-derive.)

### 3.2 Room schema (`data/compound_rooms.json`)
```jsonc
{
  "meta": { "origin": "...", "axes": "...", "locks": { "guestSuiteTotal": 350,
            "observatoryPoolMin": 200, "observatoryMotorBarnMin": 150, ... }, "containers": [...] },
  "rooms": [
    { "id": "drawing_room_sw",     // stable slug; used as the glTF node name
      "name": "Drawing Room (SW)", // human label; validators resolve anchors by name
      "building": "Main Block",    // groups rooms; drives color + building toggles
      "floor": "ground",           // ground | upper | loft | crown | site; drives floor toggles
      "x": 0, "y": 0,              // SW corner, feet
      "w": 16, "d": 20,           // footprint W x D, feet
      "zFloor": 0, "zCeil": 12,   // floor/ceiling height; height = zCeil - zFloor
      "height": 12, "area": 320,  // derived; recompute area = w*d on edit
      "tag": "D",                 // L locked · D derived · A area-locked-shape-guessed · ~ best-guess
      "render": "solid",          // "locked" | "provisional" | "container" (see 3.3)
      "notes": "..." }
  ]
}
```
> Note: in the current data the per-room render-state lives under `render` as `locked` / `provisional` / `container`. The `tag` (`L/D/A/~`) is the provenance; the `render` state is what drives opacity. Don't conflate them.

### 3.3 Solid / container convention (prevents double-rendered volume)
A few rooms are **carved inside** another, or are **open to a volume above**. If you extrude all of them as solids you double-render mass. Each room is therefore `solid` or `container`:
- **Containers** render as a ghost shell (low opacity) or are CSG-subtracted by their child; the child renders solid inside. The six container relationships:
  - Everyday Dining ⊃ Powder Room
  - Aurelia's Provincetown Suite ⊃ Pink En-Suite
  - Rafa's Texas Room ⊃ Rafa En-Suite
  - Loft ⊃ Podcast Studio
  - Octagonal Stair Hall — open to the Dome / Oculus above
  - Pool Terrace ⊃ Pool
- **Everything else is a leaf solid** — extrude straight from `(x, y, zFloor)` at `(W, height, D)`.
These six are the **only** intentional plan-overlaps. Any other overlap is a bug; the validator enforces that.

### 3.4 Visual encoding (carry it forward; Design may restyle, but keep the *information*)
- Color by **building** (`PALETTE` in `compoundModel.js`).
- Opacity by **render state**: `locked` = opaque (the bones read solid), `provisional` = translucent (best-guess reads ghostly), `container` = near-transparent shell. This is meaningful, not decorative — it tells Jon and Helen at a glance what's real vs. a guess. Preserve the distinction even if Design changes the exact palette.

### 3.5 Layer toggles → node visibility (this is the integration seam with the existing frame)
- Toggle **by building** and **by floor** = show/hide the corresponding nodes. (Already in the reference viewer.)
- A "show provisional / locked-only" toggle filters by render state.
- Map the PWA's existing **ancestor-layer** and **phase** toggles onto node visibility / styling the same way. The model should be a set of toggleable node groups, not a monolith.
- Note: the **Helen/Jon persona (user-mode) split is being retired** (Decision 2, §9) — there is no longer a per-user mode to toggle. Both users' content (notes, edits, reads) lives in one shared view.

### 3.6 Validation rules (the locks — port them into EVERY edit path)
`validate(rooms)` returns `{ ok, checks }`. The three checks:
1. **Guest Suite total** = sum of (Guest Bedroom + Guest Sitting + Guest En-Suite) areas must be `350 ± 5` ft².
2. **Observatory setbacks** = ≥ 200′ from the Pool, ≥ 150′ from any Motor Barn room (rectangle edge-to-edge distance).
3. **No accidental overlaps** = no two same-building, same-floor rooms overlap in plan, except the six container pairs in §3.3.

These are the locks that have repeatedly been broken by hand-editing. **Any client-side edit surface (drag, type-in, import) must re-run `validate()` and show failures immediately.** A red check = a lock broke. Do not let an edit that fails validation become the canonical table silently.

---

## 4. Integration plan (phased; Phases 0–2 are foundational and run in parallel with Design)

**The spine of the app is the render-forward experience** (Decision 1, §9): the colored-pencil render is the primary surface, and you *step into* it to get the navigable 3D massing of a space / room / building / the whole compound, walking from one space to another for feel. That experience is **Design-led** (§7) — Code builds the foundation (data → geometry → r3f scene) underneath it and wires it up once Design defines the IA and the step-into interaction. Phases 0–2 don't wait on Design; the shell work (Phase 3+) does.

**Phase 0 — Discover.** Read the existing PWA. Map: where 3D currently lives (if at all), the component tree, the state model, the storage layer, where the "Reading the Room" capabilities and toggles are wired, and where the two user modes diverge (you'll be merging them). Produce a short note on what gets restructured. **Do not refactor before this** — but once mapped, you have latitude to restructure boldly (Decision 4).

**Phase 1 — Land the data + core.** Add `data/compound_rooms.json` as the canonical source. Port `compoundModel.js` into the codebase as a module (it's framework-agnostic ES — drop it in, import `roomBox`, `validate`, `PALETTE`, `LOCKS`). Add a build/test that runs `validate()` on the table and fails CI if a lock breaks.

**Phase 2 — Render the model in r3f.** Build r3f components that consume the room table and emit boxes via `roomBox()`. Honor §3.3 (containers ghosted/subtracted) and §3.4 (opacity by state). Camera + orbit/pan/zoom; sensible default framing of the whole compound; a ground plane + north indicator. The reference viewer (`compound_model.html`) is the behavioral spec — match it, in r3f idiom. *Independent of Design; can proceed now.*

**Phase 3 — Build the render-forward shell + unify the views (with Design).** This is where the app gets reorganized. Working to Design's IA (§7): make the colored-pencil render the primary surface and build the **step-into** transition (render → the Phase-2 3D massing for that space) and **walk-between** navigation across spaces. **Retire the two user modes into one shared view** — both Helen's and Jon's content present, no mode switch. Carry the surviving capabilities into the new shell: connect building/floor/ancestor/phase toggles to node visibility (§3.5); attach notes-and-pins as 3D pins; attach the feel-chips and Reading-the-Room content per room (room `id` is the join key). Follow the Design pass so you build the reimagined shell, not the old one.

**Phase 4 — Shared, live editing + validation (enabled now, not deferred).** Selecting a room → editable W / D / X / Y / Height → on change, recompute area, re-run `validate()`, surface failures (red). **Helen's edits are enabled immediately and must propagate to Jon's view** (Decision 2) — this means **shared/synced persistence, not per-user local state**: edits go to a shared store both clients read (a small backend, a shared cloud doc, or a synced store — your call, but local-only won't satisfy "propagates to my view"). Do **not** assume `localStorage` works in the deployment target. Provide export/import of the room table as JSON. *Design owns how editing surfaces for Helen — tactile, non-technical, with the validators as a quiet safety net rather than a wall of red (§7).*

**Phase 5 — The data round-trip.** Export the edited table (for the Claude-loop: Jon hands it back, Claude re-validates with `validate.py` and regenerates the `.gltf`). Import a table (so Claude-loop or Design edits flow back in). Both directions pass through `validate()`.

---

## 5. What NOT to do (guardrails)

- **Do not** bake the geometry as the source of truth. The JSON is the source; geometry is generated.
- **Do not** let any edit path bypass `validate()`.
- **Do not** trace the old Gemini SVG floor plans for geometry — they're stale and unmeasured (topology reference only).
- **Do not** treat room dimensions/areas as locked design intent. They're provisional placeholders until the architect's DD (~2031). Only the tagged locks (`tag: L`, and the three validator locks) are real.
- **Do** reorganize boldly — the shell is being reimagined (render-forward primary view; the two user modes merged into one; Decisions 1, 2, 4). But **carry the capabilities forward**: Reading-the-Room, feel-chips, notes-pins, and the layer/phase toggles must survive the restructuring as features in the new unified shell, even though the two-mode structure and the current IA do not.
- **Do not** introduce `localStorage`/`sessionStorage` assumptions that break in the deployment target — use the PWA's storage layer.

---

## 6. Done = acceptance criteria

- [ ] The PWA renders the compound **from `compound_rooms.json`**, not from baked geometry.
- [ ] The app is **render-forward**: the colored-pencil render is the primary surface, and you can **step into** it to the 3D massing and **walk between** spaces (per Design's IA).
- [ ] The two user modes are **merged into one shared view**; the surviving capabilities (Reading-the-Room, chips, notes-pins, layer/phase toggles) are present in it and wired to the model.
- [ ] Building / floor / state toggles map to node visibility.
- [ ] Selecting a room and editing its size updates the model live **and** re-runs the three validators; a lock break is visible immediately.
- [ ] **Helen's edits propagate to Jon's view** — state is shared/synced, not local-only.
- [ ] The room table round-trips (export + import) through the shared store.
- [ ] `validate.py` (and the `validate()` port) pass on the current table; CI fails if a lock breaks.
- [ ] The solid/container convention and the coordinate convention are honored (no double-rendered volume; correct orientation; north is north).

---

## 7. Where Claude Design comes in (engaged from the start)

The render-forward, step-into-3D experience (Decision 1) is fundamentally an **information-architecture and interaction** design — so **Claude Design is in the loop early** (Decision 3), not just before the shell wiring. The clean split:

- **Code owns:** the data-driven geometry, the validators, shared persistence, the technical r3f integration. (Phases 0–2, 4–5.)
- **Design owns:** the render-forward experience and the shell — the primary render surface, the **step-into** transition (render → 3D massing), the **walk-between** navigation across spaces, the single unified view, and how editing surfaces for Helen.
- **The shared interface is the room table + the contracts in §3.** Design can reimagine the shell freely **as long as it consumes `compound_rooms.json` and respects the validation / solid-container / coordinate contracts.** That boundary is what lets Design and Code work in parallel without colliding.

The live design problems for Claude Design (the primary-view question is already settled — these are what's open):
- **The step-into mechanic.** What does "stepping into" a colored-pencil render *feel* like — a cross-fade from render to massing? the render as a surface you pass through into the 3D scene? the render surfacing as the "arrival" view when you reach a space, with the massing as the way to understand its volume? This is the heart of the experience.
- **Walk-between navigation.** Whole-compound → building → room "drift" (the PWA already has this feel) extended into a 3D walk between spaces, with renders as the atmosphere at each stop.
- **The unified view.** Both Helen's and Jon's content in one shared view with no mode switch — how to present two people's notes/edits/reads together without clutter.
- **Editing for Helen** — tactile and non-technical (grab a wall, nudge a dimension), with the live validators as a quiet safety net rather than a wall of red.

**Sequencing:** Design starts now, in parallel with Code's Phases 0–2 (data, core, render-in-r3f) — those are foundational and don't depend on the IA. Code's Phase 3 (the render-forward shell + view unification) builds to Design's IA.

---

## 8. The colored-pencil renders (now the primary surface)

Decision 1 promotes the renders from "a future affordance" to **the front door of the app** — so this is no longer parked. Two things make that tractable: the renders mostly **already exist**, and they're **locked**. Per the project record the house style is **"colored pencil illustration"** for exteriors and **"colored pencil architectural rendering"** for interiors; all six exterior views and the interior set are locked, with the Loft the only known gap. So the render *work* splits cleanly:

- **Integration (Code, foundational — not deferred).** Surface the existing per-room hero images as the primary surface you step into. Add a `renderImage` field to the room schema (filename/URL) per room/building. The hero images follow a prefix convention by building/floor — e.g. `mbg_*` Main Block ground, `mbu_*` Main Block upper, `sw_*` Service Wing, `ww_*` Wharf Wing, `ob_*` outbuildings, `ext_*` exterior views, `od_*` outdoor. Mapping room `id` → image is a real reconciliation task, but it should be done **against the actual asset folder** (don't hand-invent the mapping). This is now a Phase-1/3 concern, not a someday.
- **Production (Claude design-thinking + render pipeline — *not* a Code task).** Finishing the Loft, and any new renders, follow the project's **Prompt Bible v9** rules. That stays on the design-studio side.

The relationship to hold onto: the **render carries soul/atmosphere; the 3D massing carries volume/spatial truth.** They're two views of the same space, and the step-into transition (§7) is what binds them. Architect for both to coexist per room from the start.

---

## 9. Decisions (settled by Jon, 2026-06-27)

These were the open questions; they're now answered. They drive §§1, 4, 5, 7, 8 above.

1. **Render-forward primary view.** The colored-pencil render is the **primary surface**, and you *step into* it to see the space / room / building / whole compound in 3D. Helen should be able to explore a space and **walk from one space to another** to get a feel for the compound. → Renders are primary (§8); the step-into + walk-between are the core experience, Design-led (§7).
2. **Immediate, shared editing — and one unified view.** Helen can give feedback right away via **in-app editing that propagates to Jon's view**. The separate Helen/Jon user modes are **retired** into a **single shared view** containing everything from both. → Editing is enabled now, not Claude-loop-only (Phase 4); state is **shared/synced, not local-only** (implies a shared store/backend); the two-mode structure is gone (§1, §5).
3. **Claude Design in the loop early.** → Design engaged from the start, in parallel with Code's Phases 0–2; Code's shell work (Phase 3) builds to Design's IA (§7).
4. **Repo + branch, but the app isn't precious.** Use a repo and a working branch, but it isn't used often enough to need a continuously-deployable build kept alive in case something breaks. → Code has latitude to restructure boldly; no staging/blue-green/feature-flag-the-old-experience discipline required (§1 Phase 0, §5).

---

*Source of truth is `data/compound_rooms.json`. The model is generated from it; validation gates every change; the `.gltf` is a regenerated export. Everything else follows from that.*
