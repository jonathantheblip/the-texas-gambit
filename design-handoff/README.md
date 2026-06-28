# Design pack — the walk (portable, no repo needed)

For Claude Design. You don't need the repo: design and prototype against the data
and contracts here, and **Code implements your work into the real app**. Jon is the
bridge — send your design/prototype/spec back through him and Code wires it in.

Regenerated anytime with `npm run export:design`.

## Files
- **`walk_graph.json`** — every room (53) with what you need to prototype the walk:
  ```jsonc
  {
    "id": "sunroom",
    "name": "Sunroom",
    "building": "Wharf Wing",
    "floor": "ground",
    "render": "ww_sunroom_hero.webp",   // served at lookbook_images/<render>
    "w": 28, "d": 24, "height": 16, "area": 672,
    "intent": "Captain Jack's Wharf — the boundary dissolves…",
    "neighbors": [
      { "id": "pool_terrace", "heading": "S", "vert": null, "via": "door" },
      { "id": "glass_bridge", "heading": "W", "vert": null, "via": "door" }
    ]
  }
  ```
  - `heading`: `N|E|S|W|null` — compass to the neighbor (drive the slide from this).
  - `vert`: `up|down|null` — set only for stairs → lift/drop, don't slide.
  - `via`: `door|opening|stair` — animation hint (`opening` = carved/open threshold).
- **`compound_plan.json`** — footprints + bounds + north for the map (each room has
  feet `x,y,w,d` and normalized `nx,ny,nw,nh`, north up, `northAngleDeg: 0`).
  `outliers:["observatory_tower"]` is the folly 270' out — drop it or edge it.

## The renders
Filenames only here. The colored-pencil renders themselves are yours (design-studio
side) / Jon can send the `lookbook_images/` WebPs. Path in-app: `lookbook_images/<render>`.

## Things Code owns and implements for you (you specify the behavior)
- **3D camera drift** — `cameraBus.driftTo(roomId, fromHeading)` + `onArrival(cb)`.
  Code runs the move (ease-in-out, ~1.1s) and fires arrival on settle; tell us the
  easing/framing you want. (Not callable in your sandbox — it lives in the 3D scene.)
- **Single current-room source** — Code holds one `{ mode, roomId, focusId,
  lastHeading }`; crumbs, map, and walk all read/write it so they never disagree.
  `lastHeading` carries the heading of the last step for your arrival animation.
- **Entry** — the walk starts at `front_porch` and is free from there. Want a gentle
  guided first route? Say so and Code adds it.

## How we hand off
You're prototyping the arrival feel in the Sunroom group — perfect. Build it against
`walk_graph.json` (real names/renders/headings). When it's ready, send Jon the
interaction spec or the prototype (code or recording); Code rebuilds it in the app
against the live `neighborsOf` / `cameraBus` so it's the real thing, not a mock.

Your four decisions — heading-based arrival, one wayfinding system, portrait-immersive /
landscape-survey, Reading-the-Room at arrival — are exactly right. Go.
