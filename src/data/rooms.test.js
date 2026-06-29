import { describe, it, expect } from 'vitest';
import { ALL_ROOMS, applyOverrides, toGeometryTable, tableToOverrides } from './rooms.js';

const byId = (rs, id) => rs.find((r) => r.id === id);

describe('applyOverrides', () => {
  it('applies an edit, recomputes area, and flags authorship', () => {
    const out = applyOverrides(ALL_ROOMS, { great_room_se: { w: 20, d: 20, updatedBy: 'helen', updatedAt: 1 } });
    const g = byId(out, 'great_room_se');
    expect(g.area).toBe(400);
    expect(g.edited).toBe(true);
    expect(g.editedBy).toBe('helen');
  });

  it('leaves unedited rooms untouched', () => {
    const out = applyOverrides(ALL_ROOMS, { great_room_se: { w: 20 } });
    expect(byId(out, 'drawing_room_sw').edited).toBeUndefined();
  });
});

describe('displayName — plain-language names for Helen', () => {
  it('drops the architect positional suffix but keeps the full name as source of truth', () => {
    const entry = byId(ALL_ROOMS, 'entry_hall_front_s_ctr');
    expect(entry.name).toBe('Entry Hall (front, S-ctr)');   // unchanged — validation anchors key on it
    expect(entry.displayName).toBe('Entry Hall');
    expect(byId(ALL_ROOMS, 'drawing_room_sw').displayName).toBe('Drawing Room');
    expect(byId(ALL_ROOMS, 'aurelia_s_provincetown_suite_nw_over_oval').displayName)
      .toBe("Aurelia's Provincetown Suite");
  });

  it('every room has a non-empty displayName with no leftover "(...)" and a floor label', () => {
    for (const r of ALL_ROOMS) {
      expect(r.displayName.length).toBeGreaterThan(0);
      expect(r.displayName).not.toMatch(/\($/);
      expect(r.displayName).not.toMatch(/\([^)]*\)\s*$/);
      expect(r.floorLabel).toBeTruthy();
    }
  });
});

describe('table round-trip (export → import)', () => {
  it('recovers the overrides from an exported table', () => {
    const edited = applyOverrides(ALL_ROOMS, { kitchen: { w: 25 } });
    const table = toGeometryTable(edited);
    const ov = tableToOverrides(table.rooms);
    expect(ov.kitchen).toBeTruthy();
    expect(ov.kitchen.w).toBe(25);
  });
});
