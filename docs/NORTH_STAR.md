# North Star — Hill Country Estate

**The single test for any decision:** *does it help Helen feel and envision the compound, on her phone, before it's built?* When unsure whether something matters, weigh it against this. If it doesn't serve it, it's probably a weed.

## What this is
A private, **render-forward 3D instrument** for Jon and his wife Helen to feel the volumes and separations of their future Hill Country compound (Georgian limestone, Texas Hill Country; build horizon **2033–2040**) and iterate on it over years. A **thinking/feeling instrument, not a construction spec.** "Feel and iterate," never photoreal. Room dimensions are provisional until the architect's Design Development (~2031); only the tagged locks are real.

## Who it's for
- **Helen** — the primary user, on an **iPhone (mostly portrait), not technical.** Thumb-first, calm, legible. She designs from feeling and reference.
- **Jon** — owns the project; plans from spec and budget; reviews, edits, decides.
- They share **one view** — the old Helen/Jon mode split is retired; identity is authorship only.

## The vision (settled)
The **colored-pencil renders are the front door.** You step *into* a render to the navigable **3D massing** of that space, and **walk room to room** to feel the compound. Renders carry soul/atmosphere; the 3D carries volume/spatial truth; the step-into binds them.

## The one principle (never violate)
`src/data/compound_rooms.json` is the **source of truth.** 3D geometry is *generated from it*; **validation gates every edit**; the `.gltf` is a regenerated export, never the source. Don't bake or edit geometry — edit the table. The three locks: **Guest Suite = 350 ft²**; **Observatory setbacks** (≥200′ from the pool, ≥150′ from the Motor Barn); **no accidental** same-building/same-floor overlaps (six carved/open pairs excepted). Tests + CI enforce them.

## What "great" looks like
Helen opens it on her phone, sees the compound as illustrations, taps a room, reads how it feels, and *walks* — porch → entry → great room → upstairs — each step a painting plus a sense of where she is, optionally stepping into the 3D volume. She nudges a wall; it syncs to Jon; the locks keep it honest, quietly.

## Optimize for
- The *feeling* of envisioning the house on a phone — clarity, calm, atmosphere.
- The renders as the primary surface; the writing as the soul.
- The locks as a quiet safety net (never a wall of red).
- Reversible, verified changes. Staying oriented.

## Avoid / don't chase
- Photoreal. Baking geometry as source. `localStorage`-only assumptions.
- Breaking the locks. Colliding with Design's experience layer.
- Rabbit-holes, low-value bug-chasing, over-engineering.
- The **"dream"** (Marble/Skybox immersive 360) is **parked** — it needs new 360 art from the design-studio pipeline; proven, but not worth effort now.

## Who owns what
- **Code** (this repo): data-driven geometry, validators, persistence/sync, the r3f integration, build/deploy, performance, tests. **Implements Design's work into the app.**
- **Design** (Claude Design, *no repo access*): the experience — the render-forward shell, the step-into transition, the walk, mobile portrait/landscape, the unified wayfinding (crumbs + map + walk), Reading-the-Room/feel. Works against the contract + portable pack; hands work back through Jon; Code integrates.

## Working with Jon
- **Plain language** (he's not a coder); show, don't just tell.
- **Outcome over preservation** — don't be conservative for its own sake; serve the vision.
- **Don't rush to ship ahead of dependencies** — e.g. deploy *after* Design's experience is integrated, so Helen's first live look is the polished one. Be directed, not passive; match his deliberate pace.
