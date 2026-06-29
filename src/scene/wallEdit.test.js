import { describe, it, expect } from 'vitest';
import { wallResize, MIN_DIM } from './wallEdit.js';

const s = { x: 10, y: 20, w: 16, d: 12, h: 9 };

describe('wallResize', () => {
  it('E/N/T grow the held dimension, far wall anchored (no x/y shift)', () => {
    expect(wallResize('E', s, 4)).toEqual({ w: 20 });
    expect(wallResize('N', s, 4)).toEqual({ d: 16 });
    expect(wallResize('T', s, 3)).toEqual({ height: 12 });
  });

  it('W shifts x so the east wall stays put', () => {
    // grow width by 4 → west wall moves out 4ft, x drops 4, east edge (x+w) unchanged
    expect(wallResize('W', s, 4)).toEqual({ x: 6, w: 20 });
    expect(10 + 16).toBe(6 + 20); // east edge preserved
  });

  it('S shifts y so the north wall stays put', () => {
    expect(wallResize('S', s, 4)).toEqual({ y: 16, d: 16 });
    expect(20 + 12).toBe(16 + 16); // north edge preserved
  });

  it('clamps to MIN_DIM when shrunk past it', () => {
    expect(wallResize('E', s, -100)).toEqual({ w: MIN_DIM });
    // W clamp keeps the east edge: x = east - MIN
    expect(wallResize('W', s, -100)).toEqual({ x: 10 + 16 - MIN_DIM, w: MIN_DIM });
  });

  it('rounds sub-foot drags to whole feet', () => {
    expect(wallResize('E', s, 2.6)).toEqual({ w: 19 }); // 16 + 2.6 → 18.6 → 19
    expect(wallResize('N', s, -1.4)).toEqual({ d: 11 }); // 12 - 1.4 → 10.6 → 11
  });
});
