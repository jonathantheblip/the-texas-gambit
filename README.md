# The Texas Gambit

A private design-feedback site for **the Hill Country compound**. Two voices share one project: Helen designs from feeling and reference; Jon plans from spec and budget. The site holds both — same data, two lenses.

> Live: https://jonathantheblip.github.io/the-texas-gambit/

---

## What this is

Fourteen years of building, eight buildings, thirty-one rooms, three ancestor houses (the Glebe in Marston St. Lawrence, Captain Jack's Wharf in Provincetown, Texas Hill Country itself), and a Mississippi cabin that doesn't know it's the fourth.

The site is a **place to react** before drawings get locked. Helen tours rooms, hearts images, leaves notes; Jon checks specs, sees what's locked vs. open, watches money. Every reaction shows up in the other person's view — so a "love this" on a render becomes a row in Jon's working set, and a Jon-side spec change shows up in Helen's letters.

## Two modes

Toggle between **HELEN** and **JON** in the topbar (top right).

**Helen mode** is image-first, serif typography, honey/cream palette. The Compound, Rooms, The Wall (pinboard of loved + saved), The Plan (year-by-year savings cadence — "$1–4K per month, 5 off-ramps, 2035 move-in"), Phasing, Ancestors, Decisions (framed as invitations, not tasks), My Notes (chronological aggregation of voice notes + comments + reactions).

**Jon mode** is dark cobalt, sans-serif, document-grade. The same compound but with Helen Digest (her week as a real document), Working Set (rooms with open conflicts), Locked Specs Register, Conflict Surface (locked specs vs. requested changes), The Plan (full $5.86M financial breakdown across 14 years with five gates), Decisions (full board), Briefs.

## How to navigate

- **Topbar**: brand · breadcrumb · search (⌘K) · day/dusk · open-decisions chip · mode toggle
- **Topnav** (above the fold): Compound · Rooms · The Wall · The Plan · Phasing · Ancestors · Decisions · My Notes
- **Compound page** has two views: **Buildings** (cards) and **Floor Plan** (SVG site plan, click to drill in)
- **Building → Room → Detail**: tap a building card, then a room card, then anchor details inside the room
- **Lens**: click an ancestor card to "follow" that ancestor's thread through the compound — buildings + rooms drawing from it lift, the rest dim back

## What's in the data

Everything the site renders is in `data.js` — buildings, rooms, anchors (specific design moments inside each room), decisions, the Wall items, the timeline, ancestors, briefs metadata. To change what's shown, edit `data.js`. Reactions and notes save to `localStorage` per browser.

## Stack

Plain client-side React via Babel-in-the-browser. No build step. No backend. Drop these files on any static host and it works.

- `index.html` — entry point, loads everything in order
- `app.jsx` — root component, routing, mode/dusk/lens state
- `views-*.jsx` — the actual screens
- `pass3.jsx`, `pass4.jsx` — feature additions (search, compare, the Plan, etc.)
- `data.js` — all content
- `store.js` — localStorage persistence
- `styles.css` + `styles-floorplan.css` — all styling, both modes
- `lookbook_images/` — every image referenced by `data.js`

## See also

- [GH_PAGES_SETUP.md](GH_PAGES_SETUP.md) — step-by-step to put this on GitHub Pages
- [SYNC.md](SYNC.md) — workflow between the design environment and Claude Code

— Jon, with Claude
