import { describe, it, expect } from 'vitest';
import { pinsFor, ROOM_PINS } from './pins.js';

describe('pinsFor', () => {
  it('returns the Drawing Room pins', () => {
    const p = pinsFor('drawing_room_sw');
    expect(p.length).toBe(5);
    expect(p[0]).toMatchObject({ label: expect.any(String), note: expect.any(String) });
  });

  it('canonicalizes aliased ids without throwing', () => {
    expect(Array.isArray(pinsFor('octagonal_stair_hall'))).toBe(true);
  });

  it('returns [] for rooms without pins', () => {
    expect(pinsFor('sauna')).toEqual([]);
  });

  it('every authored pin has in-range coords and a known kind', () => {
    const KINDS = ['material', 'view', 'feature', 'heritage'];
    for (const pins of Object.values(ROOM_PINS)) {
      for (const p of pins) {
        expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(100);
        expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(100);
        expect(KINDS).toContain(p.kind);
        expect(p.label.length).toBeGreaterThan(0);
        expect(p.note.length).toBeGreaterThan(0);
      }
    }
  });
});
