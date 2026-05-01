/* Hill Country Estate — store + shared utilities (vanilla JS, no JSX)
 *
 * Architecture
 * ────────────
 * • localStorage is a CACHE, not the source of truth (when sync is configured).
 * • Network is the source of truth via window.HCESync (sync.js + Supabase).
 * • This module stays synchronous-friendly: load() returns the cached blob
 *   immediately so `useState(() => Store.load())` keeps working.
 *   When sync.js finishes its first remote pull it calls Store.applyRemote(),
 *   which dispatches `hce.store.remote` so app.jsx can pick up the fresh copy.
 * • save(s) is write-through: localStorage updates instantly; the diff is
 *   handed to HCESync.queueOps() which flushes the outbox to Supabase.
 *
 * If sync.js is absent (no __HCE_CONFIG), this module behaves exactly like
 * the original localStorage-only store — the old single-device behavior.
 */
window.HCEStore = (function(){
  const KEY = 'hce.v3';
  const TODAY = () => new Date().toISOString().slice(0,10);
  const NOW = () => Date.now();

  const subscribers = new Set();
  let last = null; // last persisted snapshot (for diffing)

  // ── Identity ──────────────────────────────────────────────────────
  // The active user (Helen or Jon). Read from the same localStorage key
  // that app.jsx writes when the topbar mode toggle changes.
  function identity() {
    try { return localStorage.getItem('hce.mode') || 'helen'; } catch(e) { return 'helen'; }
  }

  // ── Cache (localStorage) ──────────────────────────────────────────
  function readCache() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch(e){}
    return { rooms:{}, decisions:{}, journal:[], wall:[] };
  }
  function writeCache(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){}
  }

  function load() {
    if (!last) last = readCache();
    return last;
  }

  function save(s) {
    const prev = last || readCache();
    writeCache(s);
    last = s;
    // Hand the diff to the sync layer if present.
    if (window.HCESync && typeof window.HCESync.queueOps === 'function') {
      try {
        const ops = diff(prev, s);
        if (ops.length) window.HCESync.queueOps(ops);
      } catch(e) {
        console.warn('[HCEStore] diff/queue failed', e);
      }
    }
  }

  // ── Remote merge ──────────────────────────────────────────────────
  // sync.js calls this with a freshly-pulled, fully-reconstructed store.
  // We replace the cache and notify subscribers (app.jsx listens).
  function applyRemote(s) {
    writeCache(s);
    last = s;
    subscribers.forEach(fn => { try { fn(s); } catch(e){ console.warn(e); } });
    try { window.dispatchEvent(new CustomEvent('hce.store.remote', { detail: s })); } catch(e){}
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  // ── Room helper (unchanged signature; ensures shape on read) ──────
  function room(s, id) {
    if (!s.rooms[id]) s.rooms[id] = { notes:[], pins:[], specs:{}, mood:[] };
    if (!s.rooms[id].notes) s.rooms[id].notes = [];
    if (!s.rooms[id].pins)  s.rooms[id].pins  = [];
    if (!s.rooms[id].specs) s.rooms[id].specs = {};
    if (!s.rooms[id].mood)  s.rooms[id].mood  = [];
    return s.rooms[id];
  }

  // Stamp a room as "touched by current identity at NOW".
  function touch(s, id) {
    const rr = room(s, id);
    rr.updatedAt = NOW();
    rr.updatedBy = identity();
    return rr;
  }

  // ── Journal ───────────────────────────────────────────────────────
  // Auto-stamps author so every journal entry records who wrote it.
  function pushJournal(s, entry) {
    s.journal.push({
      id: 'j_'+NOW()+'_'+Math.random().toString(36).slice(2,6),
      t: NOW(),
      author: identity(),
      ...entry,
    });
  }

  // ── Diffing (cache → outbox ops) ──────────────────────────────────
  // Compares two store snapshots and emits per-row upsert/delete ops
  // that sync.js can apply against Supabase. Keeps the wire format
  // small: only changed rows make it onto the network.
  function diff(prev, next) {
    const ops = [];
    prev = prev || { rooms:{}, decisions:{}, journal:[], wall:[] };
    next = next || { rooms:{}, decisions:{}, journal:[], wall:[] };

    // — rooms (room_state, notes, pins, specs)
    const prevRoomIds = new Set(Object.keys(prev.rooms || {}));
    const nextRoomIds = new Set(Object.keys(next.rooms || {}));
    nextRoomIds.forEach(id => {
      const a = (prev.rooms || {})[id] || { notes:[], pins:[], specs:{}, mood:[] };
      const b = next.rooms[id] || { notes:[], pins:[], specs:{}, mood:[] };

      // room_state row (status / react / mood)
      if (a.status !== b.status || a.react !== b.react ||
          JSON.stringify(a.mood||[]) !== JSON.stringify(b.mood||[])) {
        ops.push({
          table: 'room_state',
          op: 'upsert',
          row: {
            room_id: id,
            status: b.status ?? null,
            react: b.react ?? null,
            mood: b.mood || [],
            updated_at: new Date(b.updatedAt || NOW()).toISOString(),
            updated_by: b.updatedBy || identity(),
          },
        });
      }

      // notes — by id
      const aNotes = new Map((a.notes||[]).map(n => [n.id, n]));
      const bNotes = new Map((b.notes||[]).map(n => [n.id, n]));
      bNotes.forEach((n, nid) => {
        if (!aNotes.has(nid) || JSON.stringify(aNotes.get(nid)) !== JSON.stringify(n)) {
          ops.push({ table:'notes', op:'upsert', row: {
            id: nid, room_id: id, t: n.t, text: n.text, kind: n.kind || 'text',
            pin_id: n.pinId || null, author: n.author || identity(),
          }});
        }
      });
      aNotes.forEach((_, nid) => { if (!bNotes.has(nid)) ops.push({ table:'notes', op:'delete', row:{ id: nid }}); });

      // pins — by id
      const aPins = new Map((a.pins||[]).map(p => [p.id, p]));
      const bPins = new Map((b.pins||[]).map(p => [p.id, p]));
      bPins.forEach((p, pid) => {
        if (!aPins.has(pid) || JSON.stringify(aPins.get(pid)) !== JSON.stringify(p)) {
          ops.push({ table:'pins', op:'upsert', row: {
            id: pid, room_id: id, img_slug: p.imgSlug || null,
            x: p.x, y: p.y, text: p.text, t: p.t,
            author: p.author || identity(),
          }});
        }
      });
      aPins.forEach((_, pid) => { if (!bPins.has(pid)) ops.push({ table:'pins', op:'delete', row:{ id: pid }}); });

      // specs — composite key (room_id, spec_key)
      const aSpecs = a.specs || {};
      const bSpecs = b.specs || {};
      Object.keys(bSpecs).forEach(k => {
        if (aSpecs[k] !== bSpecs[k]) {
          ops.push({ table:'room_specs', op:'upsert', row: {
            room_id: id, spec_key: k, value: bSpecs[k],
            updated_at: new Date(NOW()).toISOString(),
            updated_by: identity(),
          }});
        }
      });
      Object.keys(aSpecs).forEach(k => {
        if (!(k in bSpecs)) ops.push({ table:'room_specs', op:'delete', row:{ room_id: id, spec_key: k }});
      });
    });
    // Rooms removed entirely — delete by room_id (cascades cover children).
    prevRoomIds.forEach(id => {
      if (!nextRoomIds.has(id)) ops.push({ table:'room_state', op:'delete', row:{ room_id: id }});
    });

    // — decisions
    const aDec = prev.decisions || {};
    const bDec = next.decisions || {};
    Object.keys(bDec).forEach(id => {
      const a = aDec[id], b = bDec[id];
      if (!a || a.pick !== b.pick || a.t !== b.t) {
        ops.push({ table:'decisions', op:'upsert', row: {
          id, pick: b.pick ?? null, t: b.t || NOW(),
          decided_by: b.decidedBy || identity(),
        }});
      }
    });
    Object.keys(aDec).forEach(id => { if (!(id in bDec)) ops.push({ table:'decisions', op:'delete', row:{ id }}); });

    // — journal (append-only; diff by id)
    const aJ = new Map((prev.journal||[]).map(j => [j.id, j]));
    (next.journal||[]).forEach(j => {
      if (!aJ.has(j.id)) {
        ops.push({ table:'journal', op:'upsert', row: {
          id: j.id, t: j.t, room_id: j.roomId || null, kind: j.kind || 'note',
          text: j.text || '', extra: j.extra || null, author: j.author || identity(),
        }});
      }
    });
    // (Journal entries aren't deleted in the current UI; skip delete pass.)

    // — wall (composite key room_id+img_slug)
    const wallKey = w => `${w.roomId}|${w.imgSlug}`;
    const aWall = new Map((prev.wall||[]).map(w => [wallKey(w), w]));
    const bWall = new Map((next.wall||[]).map(w => [wallKey(w), w]));
    bWall.forEach((w, k) => {
      if (!aWall.has(k)) {
        ops.push({ table:'wall', op:'upsert', row: {
          room_id: w.roomId, img_slug: w.imgSlug, t: w.t || NOW(),
          author: w.author || identity(),
        }});
      }
    });
    aWall.forEach((w, k) => {
      if (!bWall.has(k)) ops.push({ table:'wall', op:'delete', row: { room_id: w.roomId, img_slug: w.imgSlug }});
    });

    return ops;
  }

  // ── Public surface ────────────────────────────────────────────────
  return {
    load, save, room, pushJournal, touch,
    applyRemote, subscribe,
    get identity() { return identity(); },
    TODAY, NOW,
    // exposed for sync.js + tests
    _diff: diff,
  };
})();
