import { describe, it, expect } from 'vitest';
import { arrivalFacing, getFlyEnabled } from './flyto.js';
import { facingOf } from '../data/facings.js';

describe('arrivalFacing', () => {
  it('arrives along the travel heading for a flat walk', () => {
    expect(arrivalFacing({ heading: 'E', vert: null }, 'kitchen')).toBe('E');
    expect(arrivalFacing({ heading: 'N', vert: null }, 'kitchen')).toBe('N');
  });

  it("falls back to the room's considered pose on a stair (no heading)", () => {
    const rel = { heading: null, vert: 'up' };
    expect(arrivalFacing(rel, 'primary_bedroom_ne_over_library'))
      .toBe(facingOf('primary_bedroom_ne_over_library'));
  });

  it('falls back to the considered pose for a map teleport (no link)', () => {
    expect(arrivalFacing(null, 'observatory_tower')).toBe(facingOf('observatory_tower'));
    expect(arrivalFacing(undefined, 'pool')).toBe(facingOf('pool'));
  });
});

describe('getFlyEnabled', () => {
  it('defaults ON when storage is unavailable (Node) or unset', () => {
    expect(getFlyEnabled()).toBe(true);
  });
});
