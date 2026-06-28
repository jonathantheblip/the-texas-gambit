# How work flows — Code, Design, and the Claude-loop

Three contributors touch this project. The thing that keeps them from colliding is the **one source of truth** — `src/data/compound_rooms.json` — and the rule that **every change passes through `validate()`** (the locks).

## Who does what
- **Code** (Claude Code, this repo) — owns the app: the data-driven geometry, the validators, persistence, the r3f integration, build/deploy. Implements Design's work into the real app.
- **Design** (Claude Design) — owns the experience: the render-forward shell, the step-into transition, the walk, mobile. **No repo access** — designs against a contract + portable data, and hands work back through Jon.
- **The Claude-loop** (design-studio side) — edits the room table and produces renders. Changes round-trip through the validators.

Jon is the bridge between them.

## Code ↔ Design
Design can't pull the repo, so:
1. Code publishes the seam: **[docs/CODE_DESIGN_CONTRACT.md](docs/CODE_DESIGN_CONTRACT.md)** (the shapes/APIs) and a **portable data pack** in `design-handoff/` (`npm run export:design` → real rooms, renders, adjacency, plan).
2. Design prototypes against that pack and sends Jon an interaction spec or prototype.
3. Code rebuilds it in the app against the live `neighborsOf` / `cameraBus` / nav source — the real thing, not a mock.

Code exposes; Design consumes the contract; Code integrates the result. Neither edits the other's layer.

## The data round-trip (the Claude-loop)
The room table flows both ways, always through validation:
- **Out:** in-app **Export JSON** → hand to the Claude-loop → it re-validates with `scripts/validate.py` and regenerates the `.gltf`.
- **In:** **Import JSON** back into the app (or drop a new `compound_rooms.json`). Import diffs against the base and re-runs the locks.

The `.gltf` is always a regenerated export — never edit it as the source.

## Helen's live edits (no manual handoff)
Dimension edits in the app sync between Helen and Jon automatically via Supabase (`src/store/geometryStore.js`) and survive offline. That's not a "sync dance" — it just propagates.

## The rules
1. **One source of truth between syncs.** `compound_rooms.json` is canonical; don't fork it in two places.
2. **Validation gates every path** — in-app edits, imports, and the Python gate all run the same three locks. CI fails the build if a lock breaks.
3. **Stay in your layer.** Code owns geometry/validators/persistence; Design owns the experience; they meet at the contract.
