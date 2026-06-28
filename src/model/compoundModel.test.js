import { describe, it, expect } from 'vitest';
import roomsData from '../data/compound_rooms.json';
import { validate, roomBox } from './compoundModel.js';

const ROOMS = roomsData.rooms;
const clone = () => ROOMS.map((r) => ({ ...r }));
const byId = (rs, id) => rs.find((r) => r.id === id);

describe('validate — the locks', () => {
  it('passes on the source table', () => {
    expect(validate(ROOMS).ok).toBe(true);
  });

  it('breaks the Guest Suite lock when a guest room shrinks', () => {
    const rs = clone();
    byId(rs, 'guest_bedroom').w = 4;
    const res = validate(rs);
    expect(res.ok).toBe(false);
    expect(res.checks.find((c) => c.id === 'guestSuite').ok).toBe(false);
  });

  it('allows the six carved/open container overlaps (no false positive)', () => {
    expect(validate(ROOMS).checks.find((c) => c.id === 'overlaps').ok).toBe(true);
  });

  it('catches an accidental same-building, same-floor overlap', () => {
    const rs = clone();
    const d = byId(rs, 'drawing_room_sw');
    const g = byId(rs, 'great_room_se');
    d.x = g.x; d.y = g.y; // stack two Main Block ground rooms → illegal overlap
    expect(validate(rs).checks.find((c) => c.id === 'overlaps').ok).toBe(false);
  });

  it('breaks the Observatory→pool setback when the tower moves onto the pool', () => {
    const rs = clone();
    const obs = byId(rs, 'observatory_tower');
    const pool = byId(rs, 'pool');
    obs.x = pool.x; obs.y = pool.y;
    expect(validate(rs).checks.find((c) => c.id === 'setbackPool').ok).toBe(false);
  });
});

describe('roomBox — table → Y-up geometry', () => {
  it('maps SW-corner + footprint to centered position/scale', () => {
    // Great Room (SE): x28 y0 w16 d20 zFloor0 height12
    const b = roomBox(byId(ROOMS, 'great_room_se'));
    expect(b.position).toEqual([36, 6, -10]); // [x+w/2, zFloor+h/2, -(y+d/2)]
    expect(b.scale).toEqual([16, 12, 20]);     // [W, height, D]
  });
});
