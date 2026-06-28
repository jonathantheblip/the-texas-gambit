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

describe('table round-trip (export → import)', () => {
  it('recovers the overrides from an exported table', () => {
    const edited = applyOverrides(ALL_ROOMS, { kitchen: { w: 25 } });
    const table = toGeometryTable(edited);
    const ov = tableToOverrides(table.rooms);
    expect(ov.kitchen).toBeTruthy();
    expect(ov.kitchen.w).toBe(25);
  });
});
