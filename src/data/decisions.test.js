import { describe, it, expect } from 'vitest';
import { DECISIONS, decisionPinsFor, STATUS_LABEL } from './decisions.js';
import { ALL_ROOMS } from './rooms.js';

describe('DECISIONS — content integrity', () => {
  const roomIds = new Set(ALL_ROOMS.map((r) => r.id));

  it('has unique decision ids', () => {
    const ids = DECISIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every decision has at least 2 options with unique ids', () => {
    for (const d of DECISIONS) {
      expect(d.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(d.options.map((o) => o.id)).size).toBe(d.options.length);
    }
  });

  it('every decision has a title, an element, and a context of no more than 3 sentences', () => {
    for (const d of DECISIONS) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.element.length).toBeGreaterThan(0);
      const sentences = d.context.split(/(?<=[.!?])\s+/).filter(Boolean);
      expect(sentences.length).toBeLessThanOrEqual(3);
    }
  });

  it('a pinned decision points at a real room, with in-range coords', () => {
    for (const d of DECISIONS) {
      if (!d.pin) continue;
      expect(roomIds.has(d.pin.roomId)).toBe(true);
      expect(d.pin.x).toBeGreaterThanOrEqual(0);
      expect(d.pin.x).toBeLessThanOrEqual(100);
      expect(d.pin.y).toBeGreaterThanOrEqual(0);
      expect(d.pin.y).toBeLessThanOrEqual(100);
    }
  });

  it('decisionPinsFor returns kind:"decision" pins carrying their decisionId', () => {
    const pinned = DECISIONS.find((d) => d.pin);
    const pins = decisionPinsFor(pinned.pin.roomId);
    expect(pins.some((p) => p.decisionId === pinned.id && p.kind === 'decision')).toBe(true);
  });

  it('returns [] for a room with no open decisions', () => {
    expect(decisionPinsFor('__no_such_room__')).toEqual([]);
  });

  it('the status label map covers every status the schema defines', () => {
    expect(Object.keys(STATUS_LABEL)).toEqual(
      expect.arrayContaining(['open', 'decided', 'flagged-for-conversation', 'deferred-to-site'])
    );
  });
});
