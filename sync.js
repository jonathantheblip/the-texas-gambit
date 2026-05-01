/* Hill Country Estate — sync layer
 *
 * Responsibilities
 * ────────────────
 * 1. Boot: pull every table, reconstruct the nested store shape that the
 *    UI expects, hand it to HCEStore.applyRemote() so the cache + UI
 *    snap to the server.
 * 2. Realtime: subscribe to Postgres changes on every table; on any
 *    delivery, refetch and applyRemote(). (One global channel — simpler
 *    and the diff-based merge handles it.)
 * 3. Outbox: HCEStore.save() generates per-row ops; we queue them in
 *    localStorage so offline writes survive a refresh, and flush as
 *    soon as we're online.
 * 4. Status: dispatch `hce.sync.status` events ('idle' | 'syncing' |
 *    'offline' | 'unconfigured' | 'error') so app.jsx can drive the
 *    indicator pill.
 *
 * If window.__HCE_CONFIG.url isn't set, we register no-op stubs and
 * announce 'unconfigured' so the rest of the app keeps working in
 * pure-localStorage mode (current/legacy behavior).
 */
(function(){
  const Store = window.HCEStore;
  if (!Store) { console.warn('[HCESync] HCEStore missing; not initializing.'); return; }

  const cfg = (window.__HCE_CONFIG || {});
  const OUTBOX_KEY = 'hce.outbox';
  const RECONCILE_MS = 60_000; // safety-net pull every 60s

  let supabase = null;
  let channel = null;
  let pulling = false;
  let flushing = false;
  let lastStatus = null;

  // ── Status broadcast ─────────────────────────────────────────────
  function setStatus(s) {
    if (s === lastStatus) return;
    lastStatus = s;
    try { window.dispatchEvent(new CustomEvent('hce.sync.status', { detail: s })); } catch(e){}
  }

  // ── Outbox helpers ───────────────────────────────────────────────
  function readOutbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch(e){ return []; }
  }
  function writeOutbox(arr) {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(arr)); } catch(e){}
  }

  function queueOps(ops) {
    if (!ops || !ops.length) return;
    const out = readOutbox().concat(ops);
    writeOutbox(out);
    flushOutbox();
  }

  async function applyOp(op) {
    if (!supabase) throw new Error('not configured');
    const t = supabase.from(op.table);
    if (op.op === 'upsert') {
      const { error } = await t.upsert(op.row);
      if (error) throw error;
    } else if (op.op === 'delete') {
      let q = t.delete();
      // Compose .eq() chain across all key fields in op.row
      Object.keys(op.row).forEach(k => { q = q.eq(k, op.row[k]); });
      const { error } = await q;
      if (error) throw error;
    }
  }

  async function flushOutbox() {
    if (!supabase || flushing) return;
    if (!navigator.onLine) { setStatus('offline'); return; }
    let out = readOutbox();
    if (!out.length) { setStatus('idle'); return; }
    flushing = true;
    setStatus('syncing');
    try {
      while (out.length) {
        const op = out[0];
        try {
          await applyOp(op);
          out = out.slice(1);
          writeOutbox(out);
        } catch(e) {
          // Stop on first failure; will retry on next save / online / reconcile.
          console.warn('[HCESync] outbox op failed', op, e);
          setStatus('error');
          flushing = false;
          return;
        }
      }
      setStatus('idle');
    } finally {
      flushing = false;
    }
  }

  // ── Remote → store reconstruction ────────────────────────────────
  async function pullAll() {
    if (!supabase || pulling) return;
    if (!navigator.onLine) { setStatus('offline'); return; }
    pulling = true;
    setStatus('syncing');
    try {
      const [rs, notes, pins, specs, decs, journal, wall] = await Promise.all([
        supabase.from('room_state').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('pins').select('*'),
        supabase.from('room_specs').select('*'),
        supabase.from('decisions').select('*'),
        supabase.from('journal').select('*').order('t', { ascending: true }),
        supabase.from('wall').select('*'),
      ]);
      const errs = [rs, notes, pins, specs, decs, journal, wall].map(r => r.error).filter(Boolean);
      if (errs.length) { console.warn('[HCESync] pull errors', errs); setStatus('error'); return; }

      const next = { rooms:{}, decisions:{}, journal:[], wall:[] };

      (rs.data || []).forEach(r => {
        next.rooms[r.room_id] = next.rooms[r.room_id] || { notes:[], pins:[], specs:{}, mood:[] };
        const room = next.rooms[r.room_id];
        room.status = r.status ?? null;
        room.react = r.react ?? null;
        room.mood = r.mood || [];
        room.updatedAt = r.updated_at ? new Date(r.updated_at).getTime() : undefined;
        room.updatedBy = r.updated_by || undefined;
      });
      (notes.data || []).forEach(n => {
        next.rooms[n.room_id] = next.rooms[n.room_id] || { notes:[], pins:[], specs:{}, mood:[] };
        next.rooms[n.room_id].notes.push({
          id: n.id, t: n.t, text: n.text, kind: n.kind || 'text',
          pinId: n.pin_id || undefined, author: n.author,
        });
      });
      (pins.data || []).forEach(p => {
        next.rooms[p.room_id] = next.rooms[p.room_id] || { notes:[], pins:[], specs:{}, mood:[] };
        next.rooms[p.room_id].pins.push({
          id: p.id, imgSlug: p.img_slug || undefined,
          x: p.x, y: p.y, text: p.text, t: p.t, author: p.author,
        });
      });
      (specs.data || []).forEach(s => {
        next.rooms[s.room_id] = next.rooms[s.room_id] || { notes:[], pins:[], specs:{}, mood:[] };
        next.rooms[s.room_id].specs[s.spec_key] = s.value;
      });
      (decs.data || []).forEach(d => {
        next.decisions[d.id] = { pick: d.pick, t: d.t, decidedBy: d.decided_by };
      });
      (journal.data || []).forEach(j => {
        next.journal.push({
          id: j.id, t: j.t, roomId: j.room_id || undefined,
          kind: j.kind, text: j.text, extra: j.extra || undefined,
          author: j.author,
        });
      });
      (wall.data || []).forEach(w => {
        next.wall.push({ roomId: w.room_id, imgSlug: w.img_slug, t: w.t, author: w.author });
      });

      // First-load auto-migration: if the server is empty AND we have a
      // populated localStorage cache, push the cache up rather than blow
      // away the user's existing notes.
      const isEmpty =
        (rs.data || []).length === 0 &&
        (notes.data || []).length === 0 &&
        (pins.data || []).length === 0 &&
        (specs.data || []).length === 0 &&
        (decs.data || []).length === 0 &&
        (journal.data || []).length === 0 &&
        (wall.data || []).length === 0;
      const cached = Store.load();
      const cacheHasContent = cached && (
        Object.keys(cached.rooms || {}).length ||
        Object.keys(cached.decisions || {}).length ||
        (cached.journal || []).length ||
        (cached.wall || []).length
      );
      if (isEmpty && cacheHasContent && !localStorage.getItem('hce.migrated')) {
        console.info('[HCESync] server empty + local cache present → seeding server from cache');
        const ops = Store._diff({ rooms:{}, decisions:{}, journal:[], wall:[] }, cached);
        queueOps(ops);
        try { localStorage.setItem('hce.migrated', '1'); } catch(e){}
        // Don't applyRemote(empty) — keep the cache visible while ops flush.
        setStatus(navigator.onLine ? 'syncing' : 'offline');
        return;
      }

      Store.applyRemote(next);
      setStatus('idle');
    } finally {
      pulling = false;
      // After a successful pull, kick the outbox in case offline writes piled up.
      if (readOutbox().length) flushOutbox();
    }
  }

  // ── Realtime ─────────────────────────────────────────────────────
  function subscribeRealtime() {
    if (!supabase || channel) return;
    channel = supabase.channel('hce-global')
      .on('postgres_changes',
        { event: '*', schema: 'public' },
        () => { pullAll(); }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setStatus(readOutbox().length ? 'syncing' : 'idle');
      });
  }

  // ── Online / offline transitions ─────────────────────────────────
  window.addEventListener('online', () => {
    if (!supabase) return;
    flushOutbox();
    pullAll();
  });
  window.addEventListener('offline', () => setStatus('offline'));

  // ── Periodic safety-net pull ─────────────────────────────────────
  setInterval(() => { if (supabase && navigator.onLine && !pulling) pullAll(); }, RECONCILE_MS);

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    if (!cfg.url || !cfg.anonKey) {
      console.info('[HCESync] no __HCE_CONFIG.url — running in localStorage-only mode.');
      setStatus('unconfigured');
      // Public surface stubs so callers can still call queueOps() safely.
      window.HCESync = { queueOps: () => {}, status: () => 'unconfigured', pull: () => {} };
      return;
    }
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('[HCESync] Supabase SDK not loaded; running in localStorage-only mode.');
      setStatus('unconfigured');
      window.HCESync = { queueOps: () => {}, status: () => 'unconfigured', pull: () => {} };
      return;
    }
    supabase = window.supabase.createClient(cfg.url, cfg.anonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    });

    window.HCESync = {
      queueOps,
      status: () => lastStatus,
      pull: pullAll,
      _supabase: supabase, // exposed for migrate.html
    };

    setStatus(navigator.onLine ? 'syncing' : 'offline');
    pullAll();
    subscribeRealtime();
  }

  // store.js + Supabase SDK both load synchronously above this script;
  // initialize on the next tick so the rest of the bundle can hook in.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
