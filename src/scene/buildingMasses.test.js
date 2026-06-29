import { describe, it, expect } from 'vitest';
import { buildingsOf, phaseOpacity } from './buildingMasses.js';
import roomsData from '../data/compound_rooms.json';

const rooms = roomsData.rooms;

describe('buildingsOf', () => {
  const masses = buildingsOf(rooms);
  const byName = Object.fromEntries(masses.map((m) => [m.building, m]));

  it('produces one mass per distinct building', () => {
    expect(masses.length).toBe(new Set(rooms.map((r) => r.building)).size);
  });

  it('each mass covers all its rooms (bounding volume)', () => {
    for (const m of masses) {
      const rs = rooms.filter((r) => r.building === m.building);
      const minX = Math.min(...rs.map((r) => r.x));
      const maxX = Math.max(...rs.map((r) => r.x + r.w));
      expect(m.center[0]).toBeCloseTo((minX + maxX) / 2, 5);
      expect(m.size[0]).toBeGreaterThanOrEqual(1);
    }
  });

  it('flyToId is a real room of that building', () => {
    for (const m of masses) {
      const r = rooms.find((x) => x.id === m.flyToId);
      expect(r).toBeTruthy();
      expect(r.building).toBe(m.building);
    }
  });

  it('carries the building palette colour and a phase', () => {
    expect(byName['Main Block'].color).toHaveLength(3);
    expect(byName['Main Block'].phase).toBe(1);
    expect(byName['Motor Barn'].phase).toBe(3);
  });
});

describe('phaseOpacity', () => {
  it('grades from solid (phase 1) to faint (last phase)', () => {
    expect(phaseOpacity(1, 3)).toBe(0.8);
    expect(phaseOpacity(3, 3)).toBe(0.3);
    expect(phaseOpacity(2, 3)).toBeCloseTo(0.55, 5);
  });
  it('falls back to a mid opacity when unphased', () => {
    expect(phaseOpacity(null, 3)).toBe(0.5);
    expect(phaseOpacity(1, 1)).toBe(0.5);
  });
});
