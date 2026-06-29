import { describe, it, expect } from 'vitest';
import { ALL_ROOMS } from './rooms.js';
import { FACINGS, facingOf } from './facings.js';
import { FEEL, feelChipsFor } from './feel.js';
import { BUILDING_LINEAGE, lineageOf, LINEAGES } from './lineage.js';

const ROOM_IDS = new Set(ALL_ROOMS.map((r) => r.id));
const DIRS = new Set(['N', 'E', 'S', 'W']);

describe('facings — arrival poses for the step-into', () => {
  it('only references real rooms, all N/E/S/W', () => {
    for (const [id, dir] of Object.entries(FACINGS)) {
      expect(ROOM_IDS.has(id), `facing for unknown room '${id}'`).toBe(true);
      expect(DIRS.has(dir), `bad facing '${dir}' for '${id}'`).toBe(true);
    }
  });

  it('gives every room a facing — so stepping into any space has a considered pose', () => {
    for (const r of ALL_ROOMS) {
      expect(facingOf(r.id), `no facing for '${r.id}'`).toBeTruthy();
    }
  });
});

describe('feel-chips', () => {
  it('only references real rooms', () => {
    for (const id of Object.keys(FEEL)) {
      expect(ROOM_IDS.has(id), `feel chips for unknown room '${id}'`).toBe(true);
    }
  });

  it('never offers an empty chip prompt', () => {
    for (const r of ALL_ROOMS) {
      expect(feelChipsFor(r.id).length).toBeGreaterThan(0);
    }
  });
});

describe('lineage — color = building', () => {
  it('maps every building in the table to a known lineage', () => {
    const buildings = new Set(ALL_ROOMS.map((r) => r.building));
    for (const b of buildings) {
      expect(BUILDING_LINEAGE[b], `building '${b}' unmapped`).toBeTruthy();
      expect(LINEAGES[BUILDING_LINEAGE[b]]).toBeTruthy();
    }
  });

  it('lineageOf always resolves to a family with a hue', () => {
    for (const r of ALL_ROOMS) {
      expect(lineageOf(r.building).hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
