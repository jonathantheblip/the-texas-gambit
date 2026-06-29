/**
 * roomLayerStore — the shared HUMAN layer for the walk: per-room notes and the
 * feel-chips a person has marked "on". One shared view: every entry is stamped
 * with its author (helen | jon), and both people see the same thing.
 *
 * Reuses the backend the geometry store already uses, with NO schema change:
 *   • notes        → public.notes      (kind='note', one row per note)
 *   • feel-chips   → public.room_state (the `mood` jsonb array, one row per room)
 * Both tables already exist and are on the realtime publication.
 *
 * Local-first, exactly like geometryStore: every write hits localStorage + the UI
 * immediately, then syncs (realtime both ways) with an offline outbox that flushes
 * on reconnect. If the backend is unreachable it degrades to local-only and the
 * app keeps working. Authorship comes from the shared identity (hce.identity).
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ENABLED } from '../config.js';

const CACHE_KEY = 'hce.layer.v1';
const OUTBOX_KEY = 'hce.layer.outbox';
const ID_KEY = 'hce.identity';
const NOTES_TABLE = 'notes';
const STATE_TABLE = 'room_state';
const NOTE_KIND = 'note';
const RECONCILE_MS = 60_000;

// cache shape: { [roomId]: { chips:[label], chipsAt:number, chipsBy:string, notes:[{id,t,text,author}] } }
let layer = loadCache();
let supabase = null;
let channel = null;
let status = SUPABASE_ENABLED ? 'syncing' : 'local';
let flushing = false;
let remoteOk = false;
const listeners = new Set();

function loadCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; } }
function saveCache() { try { localStorage.setItem(CACHE_KEY, JSON.stringify(layer)); } catch {} }
function emit() { for (const fn of listeners) fn(layer); }
function setStatus(s) {
  if (s === status) return;
  status = s;
  try { window.dispatchEvent(new CustomEvent('hce.layer.status', { detail: s })); } catch {}
}
const roomOf = (id) => layer[id] || { chips: [], notes: [] };
const newId = (author) => `${author}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ── Public read API ──
export const getLayer = () => layer;
export const getLayerStatus = () => status;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export const getIdentity = () => { try { return localStorage.getItem(ID_KEY) || 'helen'; } catch { return 'helen'; } };

// ── Writes ──
export function toggleChip(roomId, label, author = getIdentity()) {
  const cur = roomOf(roomId);
  const has = (cur.chips || []).includes(label);
  const chips = has ? cur.chips.filter((c) => c !== label) : [...(cur.chips || []), label];
  const at = Date.now();
  layer = { ...layer, [roomId]: { ...cur, chips, chipsAt: at, chipsBy: author } };
  saveCache(); emit();
  queueOp({ op: 'chips.set', row: { room_id: roomId, mood: chips, updated_at: new Date(at).toISOString(), updated_by: author } });
  return chips;
}

export function addNote(roomId, text, author = getIdentity()) {
  const clean = (text || '').trim();
  if (!clean) return null;
  const note = { id: newId(author), t: Date.now(), text: clean, author };
  const cur = roomOf(roomId);
  layer = { ...layer, [roomId]: { ...cur, notes: [...(cur.notes || []), note] } };
  saveCache(); emit();
  queueOp({ op: 'note.add', row: { id: note.id, room_id: roomId, t: note.t, text: clean, kind: NOTE_KIND, author } });
  return note;
}

// ── Outbox ──
const readOutbox = () => { try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch { return []; } };
const writeOutbox = (a) => { try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(a)); } catch {} };
function queueOp(op) {
  if (!supabase || !remoteOk) return;   // local-only / table not reachable: stay local
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
        if (op.op === 'note.add') {
          // notes.room_id → room_state.room_id (FK): ensure the parent row exists first.
          await supabase.from(STATE_TABLE).upsert({ room_id: op.row.room_id });
          const { error } = await supabase.from(NOTES_TABLE).upsert(op.row);
          if (error) throw error;
        } else if (op.op === 'chips.set') {
          const { error } = await supabase.from(STATE_TABLE).upsert(op.row);
          if (error) throw error;
        }
        out = out.slice(1); writeOutbox(out);
      } catch (e) {
        console.warn('[layer] outbox op failed (will retry)', op, e?.message || e);
        setStatus('error'); flushing = false; return;
      }
    }
    setStatus('idle');
  } finally { flushing = false; }
}

// ── Merge (pure; also used by tests) ──
// Notes are append-only → union by id. Chips are last-write-wins by timestamp.
export function mergeLayer(local, remote) {
  const ids = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const out = {};
  for (const id of ids) {
    const l = local[id] || {}, r = remote[id] || {};
    const byId = new Map();
    for (const n of (r.notes || [])) byId.set(n.id, n);
    for (const n of (l.notes || [])) byId.set(n.id, n);     // local wins ties (in-flight)
    const notes = [...byId.values()].sort((a, b) => a.t - b.t);
    const remoteNewer = (r.chipsAt || 0) > (l.chipsAt || 0);
    out[id] = {
      chips: (remoteNewer ? r.chips : l.chips) || [],
      chipsAt: Math.max(l.chipsAt || 0, r.chipsAt || 0) || undefined,
      chipsBy: (remoteNewer ? r.chipsBy : l.chipsBy) || undefined,
      notes,
    };
  }
  return out;
}

// ── Pull + realtime ──
async function pullAll() {
  if (!supabase || !navigator.onLine) return;
  const notesRes = await supabase.from(NOTES_TABLE).select('id, room_id, t, text, author, kind').eq('kind', NOTE_KIND);
  const stateRes = await supabase.from(STATE_TABLE).select('room_id, mood, updated_at, updated_by');
  if (notesRes.error || stateRes.error) {
    remoteOk = false;
    console.info('[layer] remote unavailable; local-only:', (notesRes.error || stateRes.error)?.message);
    setStatus('local');
    return;
  }
  remoteOk = true;
  const remote = {};
  for (const n of notesRes.data) {
    (remote[n.room_id] ||= { chips: [], notes: [] }).notes.push({ id: n.id, t: Number(n.t) || 0, text: n.text, author: n.author });
  }
  for (const s of stateRes.data) {
    const r = (remote[s.room_id] ||= { chips: [], notes: [] });
    r.chips = Array.isArray(s.mood) ? s.mood : [];
    r.chipsAt = s.updated_at ? new Date(s.updated_at).getTime() : 0;
    r.chipsBy = s.updated_by || undefined;
  }
  layer = mergeLayer(layer, remote); saveCache(); emit();
  setStatus(readOutbox().length ? 'syncing' : 'idle');
  if (readOutbox().length) flushOutbox();
}

async function init() {
  if (!SUPABASE_ENABLED) { setStatus('local'); return; }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 5 } } });
  } catch (e) {
    console.warn('[layer] supabase init failed; local-only', e?.message || e);
    setStatus('local'); return;
  }
  pullAll();
  channel = supabase.channel('hce-layer')
    .on('postgres_changes', { event: '*', schema: 'public', table: NOTES_TABLE }, () => pullAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: STATE_TABLE }, () => pullAll())
    .subscribe();
  window.addEventListener('online', () => { flushOutbox(); pullAll(); });
  window.addEventListener('offline', () => setStatus('offline'));
  setInterval(() => { if (navigator.onLine) pullAll(); }, RECONCILE_MS);
}

// Browser-only: skip the network/realtime side-effects under node (tests).
if (typeof window !== 'undefined' && typeof navigator !== 'undefined') init();
else setStatus('local');
