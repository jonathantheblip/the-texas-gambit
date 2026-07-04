/**
 * decisionsStore — the shared live state for Open Decisions: which option (if any)
 * has been chosen, whether a decision's been flagged for a conversation, and any
 * notes left on it. The content (title / options / context) is static
 * (data/decisions.js); this store only carries what changes.
 *
 * Same shape as roomLayerStore: local-first (localStorage + immediate UI update),
 * synced over Supabase realtime with an offline outbox, degrading to local-only if
 * the backend or table isn't reachable yet. Reuses the identity helper geometryStore
 * already exports (hce.identity) — Helen and Jon share one login-free identity switch.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ENABLED } from '../config.js';
import { getIdentity } from './geometryStore.js';

const CACHE_KEY = 'hce.decisions.v1';
const OUTBOX_KEY = 'hce.decisions.outbox';
const DECISIONS_TABLE = 'decisions';
const NOTES_TABLE = 'decision_notes';
const RECONCILE_MS = 60_000;

// cache shape: { [decisionId]: { status, optionId, t, decidedBy, notes:[{id,t,text,author,optionId}] } }
let state = loadCache();
let supabase = null;
let channel = null;
let status = SUPABASE_ENABLED ? 'syncing' : 'local';
let flushing = false;
let remoteOk = false;   // flips true once a pull succeeds (tables exist + reachable)
const listeners = new Set();

function loadCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; } }
function saveCache() { try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch {} }
function emit() { for (const fn of listeners) fn(state); }
function setStatus(s) {
  if (s === status) return;
  status = s;
  try { window.dispatchEvent(new CustomEvent('hce.decisions.status', { detail: s })); } catch {}
}
const rowOf = (id) => state[id] || { status: 'open', optionId: null, t: null, decidedBy: null, notes: [] };
const newId = (author) => `${author}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ── Public read API ──
export const getDecisionsState = () => state;
export const getDecisionsStatus = () => status;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// ── Writes ──
function setDecisionStatus(id, patch, author) {
  const cur = rowOf(id);
  const next = { ...cur, ...patch, t: Date.now(), decidedBy: author };
  state = { ...state, [id]: next };
  saveCache(); emit();
  queueOp({ op: 'decide', row: { id, pick: next.optionId, status: next.status, t: next.t, decided_by: author } });
  return next;
}

/** One tap: choose an option. Marks the decision Decided, records who/when. */
export const chooseOption = (id, optionId, author = getIdentity()) =>
  setDecisionStatus(id, { status: 'decided', optionId }, author);

/** One tap: "None of these — let's talk." Flags for a conversation; no alternative demanded. */
export const flagForConversation = (id, author = getIdentity()) =>
  setDecisionStatus(id, { status: 'flagged-for-conversation', optionId: null }, author);

/** The inline undo affordance's target — reverts a just-made choice back to open. */
export const undoDecision = (id, author = getIdentity()) =>
  setDecisionStatus(id, { status: 'open', optionId: null }, author);

/** A note on the whole decision (optionId=null) or on one specific option. */
export function addDecisionNote(id, text, author = getIdentity(), optionId = null) {
  const clean = (text || '').trim();
  if (!clean) return null;
  const note = { id: newId(author), t: Date.now(), text: clean, author, optionId };
  const cur = rowOf(id);
  state = { ...state, [id]: { ...cur, notes: [...(cur.notes || []), note] } };
  saveCache(); emit();
  queueOp({ op: 'note.add', row: { id: note.id, decision_id: id, option_id: optionId, t: note.t, text: clean, author } });
  return note;
}

// ── Outbox ──
const readOutbox = () => { try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch { return []; } };
const writeOutbox = (a) => { try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(a)); } catch {} };
function queueOp(op) {
  if (!supabase || !remoteOk) return;   // local-only / tables not reachable: stay local
  writeOutbox(readOutbox().concat([op]));
  flushOutbox();
}
async function flushOutbox() {
  if (!supabase || flushing) return;
  if (!navigator.onLine) { setStatus('offline'); return; }
  let out = readOutbox();
  if (!out.length) { setStatus('idle'); return; }
  flushing = true; setStatus('syncing');
  try {
    while (out.length) {
      const op = out[0];
      try {
        if (op.op === 'decide') {
          const { error } = await supabase.from(DECISIONS_TABLE).upsert(op.row);
          if (error) throw error;
        } else if (op.op === 'note.add') {
          // decision_notes.decision_id → decisions.id (FK): ensure the parent row exists first.
          await supabase.from(DECISIONS_TABLE).upsert({ id: op.row.decision_id });
          const { error } = await supabase.from(NOTES_TABLE).upsert(op.row);
          if (error) throw error;
        }
        out = out.slice(1); writeOutbox(out);
      } catch (e) {
        console.warn('[decisions] outbox op failed (will retry)', op, e?.message || e);
        setStatus('error'); flushing = false; return;
      }
    }
    setStatus('idle');
  } finally { flushing = false; }
}

// ── Merge (pure; also used by tests) ──
// Status is last-write-wins by t. Notes are append-only → union by id, sorted by time.
export function mergeDecisions(local, remote) {
  const ids = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const out = {};
  for (const id of ids) {
    const l = local[id] || {}, r = remote[id] || {};
    const byId = new Map();
    for (const n of (r.notes || [])) byId.set(n.id, n);
    for (const n of (l.notes || [])) byId.set(n.id, n);   // local wins ties (in-flight)
    const notes = [...byId.values()].sort((a, b) => a.t - b.t);
    const remoteNewer = (r.t || 0) > (l.t || 0);
    const winner = remoteNewer ? r : l;
    out[id] = {
      status: winner.status || 'open',
      optionId: winner.optionId ?? null,
      t: Math.max(l.t || 0, r.t || 0) || undefined,
      decidedBy: winner.decidedBy || undefined,
      notes,
    };
  }
  return out;
}

// ── Pull + realtime ──
async function pullAll() {
  if (!supabase || !navigator.onLine) return;
  const decRes = await supabase.from(DECISIONS_TABLE).select('id, pick, status, t, decided_by');
  const noteRes = await supabase.from(NOTES_TABLE).select('id, decision_id, option_id, t, text, author');
  if (decRes.error || noteRes.error) {
    remoteOk = false;
    console.info('[decisions] remote unavailable; local-only:', (decRes.error || noteRes.error)?.message);
    setStatus('local');
    return;
  }
  remoteOk = true;
  const remote = {};
  for (const d of decRes.data) {
    remote[d.id] = { status: d.status || 'open', optionId: d.pick || null, t: Number(d.t) || 0, decidedBy: d.decided_by || undefined, notes: [] };
  }
  for (const n of noteRes.data) {
    (remote[n.decision_id] ||= { status: 'open', optionId: null, notes: [] }).notes.push({
      id: n.id, t: Number(n.t) || 0, text: n.text, author: n.author, optionId: n.option_id || null,
    });
  }
  state = mergeDecisions(state, remote); saveCache(); emit();
  setStatus(readOutbox().length ? 'syncing' : 'idle');
  if (readOutbox().length) flushOutbox();
}

async function init() {
  if (!SUPABASE_ENABLED) { setStatus('local'); return; }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 5 } } });
  } catch (e) {
    console.warn('[decisions] supabase init failed; local-only', e?.message || e);
    setStatus('local'); return;
  }
  pullAll();
  channel = supabase.channel('hce-decisions')
    .on('postgres_changes', { event: '*', schema: 'public', table: DECISIONS_TABLE }, () => pullAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: NOTES_TABLE }, () => pullAll())
    .subscribe();
  window.addEventListener('online', () => { flushOutbox(); pullAll(); });
  window.addEventListener('offline', () => setStatus('offline'));
  setInterval(() => { if (navigator.onLine) pullAll(); }, RECONCILE_MS);
}

// Browser-only: skip the network/realtime side-effects under node (tests).
if (typeof window !== 'undefined' && typeof navigator !== 'undefined') init();
else setStatus('local');
