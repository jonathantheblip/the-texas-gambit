import { describe, it, expect } from 'vitest';
import { mergeLayer } from './roomLayerStore.js';

describe('mergeLayer — shared notes + feel-chips', () => {
  it('unions notes by id (append-only) and sorts by time', () => {
    const local = { sunroom: { notes: [{ id: 'a', t: 2, text: 'mine', author: 'jon' }] } };
    const remote = { sunroom: { notes: [{ id: 'b', t: 1, text: 'theirs', author: 'helen' }] } };
    const m = mergeLayer(local, remote);
    expect(m.sunroom.notes.map((n) => n.id)).toEqual(['b', 'a']); // sorted by t
  });

  it('does not duplicate a note present on both sides', () => {
    const note = { id: 'x', t: 5, text: 'hi', author: 'jon' };
    const m = mergeLayer({ r: { notes: [note] } }, { r: { notes: [note] } });
    expect(m.r.notes).toHaveLength(1);
  });

  it('takes the newer chip selection (last-write-wins)', () => {
    const local = { r: { chips: ['Calm'], chipsAt: 100 } };
    const remote = { r: { chips: ['Bright', 'Social'], chipsAt: 200 } };
    expect(mergeLayer(local, remote).r.chips).toEqual(['Bright', 'Social']);
    expect(mergeLayer(remote, local).r.chips).toEqual(['Bright', 'Social']);
  });

  it('keeps local chips when local is newer', () => {
    const local = { r: { chips: ['Cozy'], chipsAt: 300 } };
    const remote = { r: { chips: [], chipsAt: 50 } };
    expect(mergeLayer(local, remote).r.chips).toEqual(['Cozy']);
  });

  it('merges rooms present on only one side', () => {
    const m = mergeLayer({ a: { notes: [{ id: '1', t: 1 }] } }, { b: { chips: ['X'], chipsAt: 1 } });
    expect(Object.keys(m).sort()).toEqual(['a', 'b']);
    expect(m.b.chips).toEqual(['X']);
  });
});
