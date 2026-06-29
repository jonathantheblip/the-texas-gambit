/**
 * geometryStore — the shared store for room-dimension edits.
 *
 * One row per edited room: a sparse override of {x,y,w,d,height} on top of the
 * base table in compound_rooms.json. The base table stays the source of truth;
 * an override is just "Helen nudged this wall." Stamped with author + time.
 *
 * Local-first: every edit writes through to localStorage immediately and updates
 * the UI. If Supabase is reachable, edits also sync (realtime both ways) with an
 * offline outbox that flushes on reconnect — the same pattern the legacy app used.
 * If the backend (or the room_overrides table) isn't there yet, it degrades to
 * local-only and the app keeps working.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ENABLED } from '../config.js';

const CACHE_KEY = 'hce.geom.v1';
const OUTBOX_KEY = 'hce.geom.outbox';
const ID_KEY = 'hce.identity';
const TABLE = 'room_overrides';
const FIELDS = ['x', 'y', 'w', 'd', 'height'];
const RECONCILE_MS = 60_000;

const pick = (o, keys) => keys.reduce((a, k) => (o[k] != null ? ((a[k] = o[k]), a) : a), {});

let overrides = loadCache();      // { [roomId]: {x?,y?,w?,d?,height?, updatedAt, updatedBy} }
let supabase = null;
let channel = null;
let status = SUPABASE_ENABLED ? 'syncing' : 'local';
let flushing = false;
let remoteOk = false;   // flips true once a pull succeeds (table exists + reachable)
const listeners = new Set();

function loadCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; } }
function saveCache() { try { localStorage.setItem(CACHE_KEY, JSON.stringify(overrides)); } catch {} }
function emit() { for (const fn of listeners) fn(overrides); }
function setStatus(s) {
  if (s === status) return;
  status = s;
  try { window.dispatchEvent(new CustomEvent('hce.sync.status', { detail: s })); } catch {}
}

// ── Public read API ──
export const getOverrides = () => overrides;
export const getStatus = () => status;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export const getIdentity = () => { try { return localStorage.getItem(ID_KEY) || 'helen'; } catch { return 'helen'; } };
export function setIdentity(id) { try { localStorage.setItem(ID_KEY, id); } catch {} }

// ── Edits ──
export function setOverride(roomId, patch, author = getIdentity()) {
  const next = { ...(overrides[roomId] || {}) };
  for (const k of FIELDS) if (k in patch && patch[k] != null && !Number.isNaN(patch[k])) next[k] = patch[k];
  next.updatedAt = Date.now();
  next.updatedBy = author;
  overrides = { ...overrides, [roomId]: next };
  saveCache(); emit();
  queueOp({ op: 'upsert', row: { room_id: roomId, ...pick(next, FIELDS), updated_at: new Date(next.updatedAt).toISOString(), updated_by: author } });
}

export function resetOverride(roomId) {
  if (!overrides[roomId]) return;
  const next = { ...overrides };
  delete next[roomId];
  overrides = next;
  saveCache(); emit();
  queueOp({ op: 'delete', row: { room_id: roomId } });
}

// ── Outbox ──
const readOutbox = () => { try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch { return []; } };
const writeOutbox = (a) => { try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(a)); } catch {} };
function queueOp(op) {
  if (!supabase || !remoteOk) return;   // local-only (or table not there yet): stay local, no failing ops
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
        if (op.op === 'upsert') {
          const { error } = await supabase.from(TABLE).upsert(op.row);
          if (error) throw error;
        } else if (op.op === 'delete') {
          const { error } = await supabase.from(TABLE).delete().eq('room_id', op.row.room_id);
          if (error) throw error;
        }
        out = out.slice(1); writeOutbox(out);
      } catch (e) {
        console.warn('[geom] outbox op failed (will retry)', op, e?.message || e);
        setStatus('error'); flushing = false; return;
      }
    }
    setStatus('idle');
  } finally { flushing = false; }
}

// ── Pull + realtime ──
async function pullAll() {
  if (!supabase || !navigator.onLine) return;
  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) {
    // Most likely the table doesn't exist yet — degrade to local-only.
    remoteOk = false;
    console.info('[geom] remote unavailable; local-only until room_overrides exists:', error.message);
    setStatus('local');
    return;
  }
  remoteOk = true;
  const remote = {};
  for (const r of data) {
    remote[r.room_id] = {
      ...pick(r, FIELDS),
      updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
      updatedBy: r.updated_by || undefined,
    };
  }
  // Merge: last-write-wins by updatedAt; local edits newer than remote stay on top.
  const merged = { ...remote };
  for (const [id, loc] of Object.entries(overrides)) {
    if (!merged[id] || (loc.updatedAt || 0) >= (merged[id].updatedAt || 0)) merged[id] = loc;
  }
  overrides = merged; saveCache(); emit();
  // Back-fill: push any local edits the server hasn't seen (e.g. made before the
  // table existed, or while offline) so they propagate to the other user.
  for (const [id, loc] of Object.entries(overrides)) {
    if (!remote[id] || (loc.updatedAt || 0) > (remote[id].updatedAt || 0)) {
      writeOutbox(readOutbox().concat([{ op: 'upsert', row: { room_id: id, ...pick(loc, FIELDS), updated_at: new Date(loc.updatedAt || Date.now()).toISOString(), updated_by: loc.updatedBy || getIdentity() } }]));
    }
  }
  if (readOutbox().length) flushOutbox(); else setStatus('idle');
}

async function init() {
  if (!SUPABASE_ENABLED) { setStatus('local'); return; }
  try {
    // Dynamic import keeps the Supabase SDK out of the initial bundle.
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 5 } } });
  } catch (e) {
    console.warn('[geom] supabase init failed; local-only', e?.message || e);
    setStatus('local'); return;
  }
  pullAll();
  channel = supabase.channel('hce-geometry')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => pullAll())
    .subscribe();
  window.addEventListener('online', () => { flushOutbox(); pullAll(); });
  window.addEventListener('offline', () => setStatus('offline'));
  setInterval(() => { if (navigator.onLine) pullAll(); }, RECONCILE_MS);
}

// Browser-only: skip the network/realtime side-effects under node (tests).
if (typeof window !== 'undefined' && typeof navigator !== 'undefined') init();
else setStatus('local');
