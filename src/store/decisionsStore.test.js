import { describe, it, expect } from 'vitest';
import { mergeDecisions } from './decisionsStore.js';

describe('mergeDecisions — shared Open Decisions state', () => {
  it('unions notes by id (append-only) and sorts by time', () => {
    const local = { d1: { notes: [{ id: 'a', t: 2, text: 'mine', author: 'jon' }] } };
    const remote = { d1: { notes: [{ id: 'b', t: 1, text: 'theirs', author: 'helen' }] } };
    expect(mergeDecisions(local, remote).d1.notes.map((n) => n.id)).toEqual(['b', 'a']);
  });

  it('does not duplicate a note present on both sides', () => {
    const note = { id: 'x', t: 5, text: 'hi', author: 'jon' };
    const m = mergeDecisions({ d: { notes: [note] } }, { d: { notes: [note] } });
    expect(m.d.notes).toHaveLength(1);
  });

  it('takes the newer status (last-write-wins by t)', () => {
    const local = { d: { status: 'open', optionId: null, t: 100 } };
    const remote = { d: { status: 'decided', optionId: 'a', t: 200 } };
    expect(mergeDecisions(local, remote).d).toMatchObject({ status: 'decided', optionId: 'a' });
    expect(mergeDecisions(remote, local).d).toMatchObject({ status: 'decided', optionId: 'a' });
  });

  it('keeps the local status when local is newer', () => {
    const local = { d: { status: 'flagged-for-conversation', optionId: null, t: 300 } };
    const remote = { d: { status: 'open', optionId: null, t: 50 } };
    expect(mergeDecisions(local, remote).d.status).toBe('flagged-for-conversation');
  });

  it('merges decisions present on only one side', () => {
    const m = mergeDecisions({ a: { notes: [{ id: '1', t: 1 }] } }, { b: { status: 'decided', optionId: 'x', t: 1 } });
    expect(Object.keys(m).sort()).toEqual(['a', 'b']);
    expect(m.b.status).toBe('decided');
  });
});
