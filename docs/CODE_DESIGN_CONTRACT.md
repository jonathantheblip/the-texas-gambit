# Code ↔ Design contract — the walk

Answers to Design's asks. These pieces are **committed in this project** (same repo) — import them directly; build on them, don't recreate them.

## 1. Neighbors — `src/data/adjacency.js`
```js
import { neighborsOf, ENTRY_ROOM } from './data/adjacency.js';

neighborsOf(roomId) // → strongest-first array of:
{
  id: 'library_ne',
  heading: 'N' | 'E' | 'S' | 'W' | null,  // compass to the neighbor (null for stairs)
  vert:    'up' | 'down' | null,           // set only for stair links → lift/drop, not slide
  via:     'door' | 'opening' | 'stair',   // animation hint
  strength: 12,                            // shared-wall length; sort key, not for display
}
```
Animate from `heading` (or `vert`). `via:'opening'` = a carved/open threshold (e.g. Powder Room); `via:'stair'` = a floor change.

## 2. Plan geometry (for the map) — `src/data/plan.js`
```js
import { compoundPlan } from './data/plan.js';
// {
//   axes: 'x=East(+), y=North(+), feet', northUp: true, northAngleDeg: 0,
//   bounds: { minX, maxX, minY, maxY, width, height },
//   outliers: ['observatory_tower'],   // ~270' south — drop or edge it
//   rooms: [{ id, building, floor, x, y, w, d,   // feet (footprint = bbox)
//             nx, ny, nw, nh }]                  // normalized 0..1, north up
// }
```
Rooms are axis-aligned rectangles, so each footprint **is** its bbox. North is up (angle 0). `src/ui/Minimap.jsx` is a working default you can replace or restyle.

## 3. Single current-room source — `src/nav/navStore.js` + `useNav()`
Crumbs, minimap, and the walk all read/write this one place, so they never disagree.
```js
import { nav } from './nav/navStore.js';
import { useNav } from './nav/useNav.js';

const view = useNav(); // { mode:'gallery'|'room'|'model', roomId, focusId, lastHeading }

nav.goRoom(id);            // jump to a room
nav.stepTo(id, heading);   // a walk step (records heading for arrival anim)
nav.enterWalk();           // start at the front door (ENTRY_ROOM)
nav.openModel(focusId?);   // into the 3D massing
nav.goGallery();           // back to overview
```
`lastHeading` is the heading of the last step — use it to drive the directional arrival.

## 4. 3D camera — `src/scene/cameraBus.js`  (Code owns the camera)
```js
import { cameraBus } from './scene/cameraBus.js';

cameraBus.driftTo(roomId, fromHeading);     // glide the 3D camera to a room
const off = cameraBus.onArrival((roomId) => raiseRender(roomId)); // fires on settle
```
Code runs the actual move (ease-in-out, ~1.1s) inside the scene and emits arrival. You drive it; we own the animation — tell us if you want different easing/framing.

## 5. "Walk from the front door"
Just a **start id**: `ENTRY_ROOM === 'front_porch'`. The walk is free from there (adjacency-driven) — Helen wanders. If you want a gentle guided first route, say so and Code will add `suggestedRoute()`.

## Logistics
Same repo, same files — pull and import. Prototyping the arrival feel in the Sunroom group now and wiring to `neighborsOf` when convenient is exactly right; the shapes above are stable, so that prototype will drop straight in.
