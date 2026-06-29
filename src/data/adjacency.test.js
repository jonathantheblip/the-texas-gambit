import { describe, it, expect } from 'vitest';
import { neighborsOf } from './adjacency.js';
import { canonicalId } from './aliases.js';

const ids = (ns) => ns.map((n) => n.id);

describe('neighborsOf — the walk graph', () => {
  it('returns the documented shape', () => {
    const n = neighborsOf('great_room_se')[0];
    expect(n).toHaveProperty('id');
    expect(n).toHaveProperty('heading');
    expect(n).toHaveProperty('vert');
    expect(n).toHaveProperty('via');
  });

  it('finds same-floor wall neighbors with a compass heading', () => {
    const ns = neighborsOf('great_room_se');
    const entry = ns.find((n) => n.id === 'entry_hall_front_s_ctr');
    expect(entry).toBeTruthy();
    expect(entry.heading).toBe('W');
    expect(entry.vert).toBe(null);
    expect(ids(ns)).toContain('library_ne');
  });

  it('does not walk up through a ceiling (no direct vertical from a plain room)', () => {
    expect(neighborsOf('great_room_se').some((n) => n.vert)).toBe(false);
  });

  it('routes floor changes through the stair', () => {
    const up = neighborsOf('octagonal_stair_hall').find((n) => n.id === 'upper_gallery_landing');
    expect(up).toBeTruthy();
    expect(up.vert).toBe('up');
    expect(up.via).toBe('stair');
  });

  it('is symmetric for same-level neighbors', () => {
    expect(ids(neighborsOf('front_porch'))).toContain('entry_hall_front_s_ctr');
    expect(ids(neighborsOf('entry_hall_front_s_ctr'))).toContain('front_porch');
  });
});

describe('aliased spaces — entry hall + staircase read as one', () => {
  it('the octagonal stair hall folds into the entry hall', () => {
    expect(canonicalId('octagonal_stair_hall')).toBe('entry_hall_front_s_ctr');
  });

  it('you never walk "between" the two halves; the stair-up lives on the entry hall', () => {
    const ns = neighborsOf('entry_hall_front_s_ctr');
    expect(ids(ns)).not.toContain('octagonal_stair_hall');   // not a separate destination
    const up = ns.find((n) => n.id === 'upper_gallery_landing');
    expect(up).toBeTruthy();
    expect(up.vert).toBe('up');                               // the stair's connection folded in
  });

  it('coming down the stair lands on the entry hall, never the stair hall', () => {
    const ns = neighborsOf('upper_gallery_landing');
    expect(ids(ns)).not.toContain('octagonal_stair_hall');
    const down = ns.find((n) => n.id === 'entry_hall_front_s_ctr');
    expect(down?.vert).toBe('down');
  });
});
