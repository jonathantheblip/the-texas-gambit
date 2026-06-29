# Overnight run — log

*Run started 2026-06-28 (night). Branch `render-forward-3d`. Operator: Claude Code (Opus 4.8).*
*Read with [NORTH_STAR.md](NORTH_STAR.md) + [CARRYOVER.md](CARRYOVER.md).*

## Mandate (Jon's answers)
1. **Full rebuild** of Design's "The Walk" against the live APIs (replaces `room` mode).
2. **Deploy fully live to Helen** — but only once complete, green (test + validate + build), and verified on a phone viewport. Never half-built; hold + stage if not.
3. **Feel-chips only** — ship the chip cues; notes start empty.
4. **Sync notes/chips** via Supabase — additive, must not disturb the existing schema/sync.

Priority order: ① cross-fade + facings · ② Reading-the-Room sheet · ③ directional-arrival walk + unified map · ④ stretch: whole-compound bird's-eye.

## What Design delivered (ingested)
- `walk/facings.json` — per-room N/E/S/W arrival facing, all 53 rooms (first pass, tunable).
- Cross-fade spec (4 knobs): `--xfade-dur:780ms`, `--xfade-ease:cubic-bezier(.42,.08,.16,1)`, `--xfade-scale:1.07`, `--xfade-blur:7px`; canvas counter-motion scale 1.045→1 + opacity .5→1 over ~0.66×dur; trigger on `cameraBus.onReady`; reduced-motion → plain dissolve.
- The Walk prototype (vanilla): directional arrival, exit dock, crumbs, unified map (building/compound), Reading-the-Room sheet, landscape survey. Tokens: dark warm void (#0e0c08 / #ECE6DA), fonts Spectral / Hanken Grotesk / IBM Plex Mono, ancestor-lineage hues (glebe green / ptown blue / texas amber / miss plum).
- Bundled `handoff/CLAUDE-CODE-BRIEF.md` is the OLD (2026-05-01) localStorage→Supabase task — already shipped; ignored.

## Architecture decisions
- The Walk = new dark/immersive React experience for `room` mode; Gallery (entry) + ModelView (3D, Code-owned) stay. Walk CSS namespaced `wk-*` under `.walk-root` to avoid bleed.
- Color = building → adopt Design's ancestor-lineage families for the Walk surface; 3D keeps Code's per-building PALETTE.
- `compound_rooms.json` stays source of truth (read-only); locks untouched.
- Notes/chips sync via existing `notes` table + `room_state.mood` (already on realtime publication) — no schema change. Local-first, degrades to local if unreachable.

## Running log
- **Baseline** — green: 15 tests, validate (all locks hold), build clean. ✅
- **Checkpoint ① — facings + cross-fade** ✅
  - New data modules: `src/data/lineage.js` (ancestor families + building→lineage), `src/data/facings.js` (per-room N/E/S/W, all 53), `src/data/feel.js` (chips, observatory id fixed, generic fallback).
  - `navStore.enterMassing` now defaults facing from `facingOf(id)` → every step-into opens to the render's viewpoint (feeds existing facing→entryFacing→driftToRoom chain).
  - Cross-fade upgraded to the push-through: `.massing-curtain` gains the 4 tunable knobs (`--xfade-dur:780ms` etc.) + scale/blur dissolve; `MassingCurtain.jsx` flips `.go` after a forced reflow. Canvas counter-motion (scale 1.045→1, opacity .5→1) via `.stage.arriving/.arrived` in ModelView, gated on `fromWalk`. Reduced-motion → plain dissolve.
  - New test `src/data/walkdata.test.js` (6 cases): facings/feel ids real, every room has a facing, every building maps to a lineage. **21 tests pass; build clean.**
