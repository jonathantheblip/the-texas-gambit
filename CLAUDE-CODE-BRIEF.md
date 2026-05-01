# Hill Country Estate — Engineering Handoff

**Project:** "Lookbook" — Hill Country Estate companion app
**Repo entry:** `Hill Country Estate.html`
**Stack today:** Vanilla React (UMD + Babel), no build step, single-file HTML loading sibling `.jsx` / `.js` modules. State persists to `localStorage` via `store.js`.
**Date:** 2026-05-01

---

## What this brief covers

Two recently-shipped design changes you should know about (so you don't roll them back), and one new feature to build out: **a real backend so Helen and Jon can share notes, reactions, and decisions across devices.**

Sections:
1. Recently shipped (FYI — already in main)
2. **The ask: shared persistent store** (your task)
3. File-by-file change orders
4. Acceptance criteria
5. Out of scope

---

## 1) Recently shipped — FYI only

These are already in the codebase. Don't undo them; do account for them.

### a) Mode/route guard (`app.jsx`)
A `useEffect` in the `App` component classifies every route as Helen-only, Jon-only, or shared. Navigating to a wrong-mode route auto-switches `mode` to match. The Helen/Jon topbar buttons also `go({ kind: 'home' })` so the user can't get stranded on a now-mismatched page. See `app.jsx` ~line 95 (search for `Mode/route guard`).

Ownership map (keep this canonical when you wire the backend):
- **Shared:** `home`, `building`, `room`, `decisions`, `plan`, `specs`, `phasing`
- **Helen-only:** `rooms`, `wall`, `ancestors`, `notes`
- **Jon-only:** `digest`

### b) Readability sweep (`styles.css`, "PASS 6" block)
A large appended block at the bottom of `styles.css` fixes cross-mode color bleed and text-on-image legibility. Sections §M–§AA. Don't strip it — and if you re-skin any component, mirror these patterns.

### c) Mobile topbar overflow fix (`styles.css`, "PASS 7" block)
At narrow widths (<440px) the right-side topbar cluster (search + dusk + Helen/Jon switch) was getting pushed off-screen by the brand title, which made `<body>` wider than `100vw` and caused page content to appear horizontally clipped. Fixed by adding `overflow-x: hidden; max-width: 100vw` to `html, body` and a responsive `@media (max-width: 480px)` block that tightens topbar paddings, shrinks the brand sigil/title, and ensures `min-width: 0` on flex children so they all stay onscreen.

---

## 2) The ask — Shared persistent store

### Today's behaviour (the problem)
`store.js` is a thin localStorage wrapper around a single key `hce.v3`:

```js
// store.js shape
{
  rooms: {
    [roomId]: {
      status, react, mood: [],
      notes: [{ id, t, text, kind, pinId }],
      pins: [{ id, x, y, text, t }],
      specs: { [specKey]: 'lock' | 'ask' }
    }
  },
  decisions: { [decisionId]: { pick, t } },
  journal: [{ id, t, roomId, kind, text, extra }]
}
```

Every annotation Helen makes (room reactions, pinned spots on photos, journal entries, locked specs, decision picks) is per-browser, per-device. Push to web → empty store. Different browser → empty store. Two people → can't see each other's notes.

### What we want
A single shared store that:
- **Persists across devices and browsers** for both Helen and Jon
- **Distinguishes authorship** — every entry must record which user created it (Helen or Jon)
- **Syncs in near-real-time** — when Helen pins a note on her phone, it shows up on Jon's laptop within a few seconds
- **Survives offline** — the app must keep working when offline; queued writes flush on reconnect
- **Doesn't require accounts/login UI** — there's a hardcoded two-user model (Helen, Jon). The existing topbar mode toggle (Helen/Jon) doubles as the identity selector. A simple shared-secret or magic-link gate is fine to keep the URL un-shareable.

### Recommended shape
- **Backend:** Supabase (Postgres + realtime) is the cheapest path that hits all four requirements. Cloudflare Workers + Durable Objects, or a tiny Fastify on Fly.io, are equally fine. Pick one, document why.
- **Schema:** mirror the current `store.js` shape but flatten it for relational storage:
  - `room_state(room_id PK, status, react, mood jsonb, updated_at, updated_by)`
  - `notes(id PK, room_id, t, text, kind, pin_id, author)` — author ∈ {`helen`,`jon`}
  - `pins(id PK, room_id, x, y, text, t, author)`
  - `room_specs(room_id, spec_key, value, updated_at, updated_by)` — composite PK
  - `decisions(id PK, pick, t, decided_by)`
  - `journal(id PK, t, room_id, kind, text, extra jsonb, author)`
- **Realtime:** Supabase channel per table (or one global channel). On change, the client merges the diff into its in-memory `store` state via `setStore`.
- **Offline:** keep the current localStorage cache as a write-through. Queue mutations to an `outbox` array in localStorage; flush on reconnect, drop on success. Show the existing `.sync-indicator` ('Saved' / 'Syncing' / 'Offline').
- **Auth:** one anonymous Supabase row per session, identity asserted from client (`mode` state). Server-side, accept a shared bearer token in env. NOT trying to be a real auth system — this is a 2-person family tool.

### Identity / authorship
Right now `setStore` mutates the store without recording who did it. You'll need to thread `mode` (the active user) into every write site so the row gets stamped with `author: mode`. Search for `setStore(` across the JSX files (~25 call sites).

A clean way: wrap `setStore` in a `useStore()` hook that takes `(mutator) => setStore(prev => mutator(prev, { author: mode, t: Date.now() }))`. Less invasive: just pass `mode` into each component that already takes `setStore` and have it stamp at the call site.

---

## 3) File-by-file change orders

### `store.js` — replace with a remote-first store
- Keep the same exported surface: `window.HCEStore = { load, save, room, pushJournal, TODAY, NOW }`. Existing call sites should not have to change *signatures* — only behavior.
- `load()` becomes async **but** must still synchronously return the cached localStorage value first so `useState(() => Store.load())` keeps working. Pattern: cache-first, then kick off a remote fetch and `dispatchEvent(new CustomEvent('hce.store.remote'))` so the App can `setStore(Store.load())` to pick up the fresh copy.
- `save(s)` becomes a write-through: localStorage immediately, network in the background, retried via outbox.
- Add `Store.subscribe(fn)` so `App` can listen for remote diffs (realtime channel deliveries) and merge.
- Add `Store.identity` getter that reads `localStorage['hce.mode']` so writes can stamp authorship without each call site passing it.

### `app.jsx`
- The `useEffect` at line ~57 (`Store.save(store)`) stays, but add a sibling effect that subscribes to `Store.subscribe` and merges remote diffs into local state.
- Update the `syncMsg` indicator to show `Syncing…` while the outbox is non-empty and `Offline` when `navigator.onLine === false`.
- Thread `mode` into every `setStore` write path. (See list below.)

### `views-helen-room.jsx`, `views-jon.jsx`, `views-other.jsx`, `views-rooms.jsx`, `pass3.jsx`, `pass4.jsx`
- Search for every `setStore(` call. There are ~25. Each one needs the mutator to record `{ author: mode, t: Date.now() }` on whatever entry it's creating/modifying. Most are pin adds, note adds, react toggles, spec locks/asks, decision picks. Pattern:

  ```js
  // BEFORE
  setStore(s => ({ ...s, rooms: { ...s.rooms, [id]: { ...s.rooms[id], react: 'loved' } } }));

  // AFTER (record updated_by + updated_at)
  setStore(s => ({
    ...s,
    rooms: {
      ...s.rooms,
      [id]: { ...s.rooms[id], react: 'loved', updatedBy: mode, updatedAt: Date.now() }
    }
  }));
  ```

- Where the UI surfaces author (e.g. "Helen, …" prefix on `.helen-note`), keep the existing implicit author for legacy rows but prefer `entry.author` when present.

### `Hill Country Estate.html`
- Add Supabase client `<script>` (or whichever backend SDK you choose) before the existing app scripts.
- Add an env-config block: a `<script>window.__HCE_CONFIG = { url: '...', anonKey: '...' };</script>` placeholder. Document where to set these for the production push.
- Add a `<meta name="theme-color">` switch hook isn't needed — already there.

### New file: `sync.js` (or fold into `store.js`)
- Realtime channel setup
- Outbox flush logic
- Offline detection (`window.addEventListener('online'/'offline')`)
- Periodic reconciliation pull (every 60s) as a safety net if the realtime channel drops

### Migration / seeding
- One-time admin tool: a tiny HTML page (`migrate.html`) that lets Helen paste her current `localStorage['hce.v3']` blob, parses it, and uploads it to the new backend stamped as `author: 'helen'`. Same for Jon. Keep this out of the main bundle.

---

## 4) Acceptance criteria

A change is done when:

1. Helen, on her phone, adds a pinned note on the Front Porch room. Within 5 seconds, Jon — on his laptop, in Jon mode — sees it appear on the same room (he'll see it via `.image-stage` pin if he visits, and via the journal/notes count badge regardless).
2. Each note/pin/decision visibly shows who made it (UI can stay subtle — a small "— H" or "— J" badge on each entry, or use existing styling).
3. Putting the laptop in airplane mode, making 5 changes, then reconnecting, results in all 5 changes landing on the server with correct timestamps and authors. The `.sync-indicator` reflects the state transitions.
4. A fresh device (clean browser, never seen the app) loads the URL, types the shared secret if you went that route, and gets the full shared store within 2 seconds.
5. The mode/route guard (section 1a) still works exactly as it does today — deep link to `/digest` still flips you to Jon mode.
6. The PASS 6 readability fixes (section 1b) are intact in `styles.css`.
7. localStorage is no longer the source of truth — it's a cache. Wiping localStorage and reloading produces the same UI.

---

## 5) Out of scope

- Real account auth (passwords, OAuth, multi-user beyond Helen+Jon).
- Conflict resolution beyond last-write-wins. If both authors edit the same field within the same tick, last write wins. We can revisit if it bites.
- Audit log / version history. (The existing `journal` already serves as a soft activity log.)
- Server-side rendering. Stay pure client-side.
- Mobile native wrapper. PWA install (already wired) is enough.

---

## 6) Open questions / decisions you should make and document

- Backend pick (Supabase vs Workers vs other). Default: Supabase.
- Whether to gate the URL behind a shared secret. Default: yes, simplest possible (one env-injected token).
- Realtime channel granularity (one global vs per-table). Default: one global, simpler.
- Whether to migrate existing localStorage data on first boot for current users, or require the migrate.html tool. Default: auto-migrate on first authenticated load if the server store is empty AND localStorage has data.

When in doubt, lean toward fewer moving parts and document the call.
