/* Hill Country Estate — Pass 3 enhancements
   • Dusk mode toggle (theme + image filter)
   • Plain-English search palette (Cmd-K)
   • Spec hover → brief excerpt
   • Side-by-side compare for decisions
   • Mississippi easter egg
*/

window.HCEPass3 = (function(){
  const { useState, useEffect, useMemo, useRef, useCallback } = React;
  const D = window.HCE;
  const Store = window.HCEStore;

  /* ─────────────────────────────────────────────────────────────
     DUSK MODE — global toggle
     ───────────────────────────────────────────────────────────── */
  function useDusk() {
    const [dusk, setDusk] = useState(() => {
      try { return localStorage.getItem('hce-dusk') === '1'; } catch(e){ return false; }
    });
    useEffect(() => {
      document.body.setAttribute('data-tone', dusk ? 'dusk' : 'day');
      try { localStorage.setItem('hce-dusk', dusk ? '1' : '0'); } catch(e){}
    }, [dusk]);
    return [dusk, setDusk];
  }

  function DuskToggle({ dusk, setDusk }) {
    return (
      <button className={`dusk-toggle ${dusk ? 'on' : ''}`}
        onClick={() => setDusk(d => !d)}
        title={dusk ? 'Switch to day' : 'Switch to dusk'}
        aria-label="Toggle dusk mode">
        {dusk ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
          </svg>
        )}
        <span>{dusk ? 'Dusk' : 'Day'}</span>
      </button>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     SEARCH — plain-English palette (Cmd/Ctrl-K)
     ───────────────────────────────────────────────────────────── */
  function buildIndex() {
    const idx = [];
    D.ROOMS.forEach(r => {
      idx.push({
        kind:'room', id: r.id, label: r.name, sub: r.tag,
        body: [r.intent, r.helenNote || '', (r.specs||[]).map(s => `${s.k} ${s.v}`).join(' ')].join(' '),
        route: { kind:'room', id: r.id }
      });
    });
    D.BUILDINGS.forEach(b => {
      idx.push({
        kind:'building', id: b.id, label: b.name, sub: b.tagline || '',
        body: [b.tagline || '', b.summary || ''].join(' '),
        route: { kind:'building', id: b.id }
      });
    });
    (D.LOCKED_SPECS || []).forEach(s => {
      idx.push({
        kind:'spec', id: s.item, label: s.item, sub: s.ref || 'Locked spec',
        body: (s.value || '') + ' ' + (s.ref || '') + ' ' + (s.ancestor || ''),
        route: { kind:'specs' }
      });
    });
    (D.DECISIONS || []).forEach(d => {
      idx.push({
        kind:'decision', id: d.id, label: d.title, sub: d.status,
        body: (d.body||'') + ' ' + (d.options||[]).join(' '),
        route: { kind:'decisions' }
      });
    });
    Object.values(D.ANCESTORS || {}).forEach(a => {
      idx.push({
        kind:'ancestor', id: a.id, label: a.name, sub: 'Ancestor',
        body: [a.idea || '', a.bringForward || '', a.leaveBehind || ''].join(' '),
        route: { kind:'ancestors' }
      });
    });
    return idx;
  }

  function score(item, q) {
    if (!q) return 0;
    const ql = q.toLowerCase();
    const tokens = ql.split(/\s+/).filter(Boolean);
    const label = item.label.toLowerCase();
    const body = (item.body || '').toLowerCase();
    let s = 0;
    tokens.forEach(t => {
      if (label === t) s += 100;
      else if (label.startsWith(t)) s += 40;
      else if (label.includes(t)) s += 20;
      if (body.includes(t)) s += 4;
    });
    return s;
  }

  const KIND_LABELS = {
    room:'Room', building:'Building', spec:'Locked spec',
    decision:'Decision', ancestor:'Ancestor'
  };
  const KIND_GLYPHS = {
    room:'⊞', building:'◰', spec:'⊟', decision:'◆', ancestor:'☷'
  };

  function SearchPalette({ open, onClose, go }) {
    const [q, setQ] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef(null);
    const index = useMemo(buildIndex, []);

    useEffect(() => {
      if (open) {
        setQ('');
        setActiveIdx(0);
        setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
      }
    }, [open]);

    const results = useMemo(() => {
      if (!q.trim()) {
        // No query: show suggestions
        return [
          { ...index.find(i => i.kind==='room' && i.id==='kitchen'), reason:'The cobalt island' },
          { ...index.find(i => i.kind==='room' && i.id==='library'), reason:'Imber §VI' },
          { ...index.find(i => i.kind==='decision' && i.id==='wharf-trim'), reason:'Decision · pending' },
          { ...index.find(i => i.kind==='ancestor' && i.id==='glebe'), reason:'Ancestor' },
          { ...index.find(i => i.kind==='spec' && i.id==='Roof'), reason:'Locked spec' },
        ].filter(r => r && r.label).slice(0, 8);
      }
      return index
        .map(i => ({ ...i, _s: score(i, q) }))
        .filter(i => i._s > 0)
        .sort((a,b) => b._s - a._s)
        .slice(0, 18);
    }, [q, index]);

    useEffect(() => {
      if (!open) return;
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i+1, results.length-1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i-1, 0)); }
        if (e.key === 'Enter') {
          e.preventDefault();
          const r = results[activeIdx];
          if (r) { go(r.route); onClose(); }
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open, results, activeIdx, onClose, go]);

    if (!open) return null;
    return (
      <div className="search-scrim" onClick={onClose}>
        <div className="search-palette" onClick={(e) => e.stopPropagation()}>
          <div className="search-input-row">
            <span className="search-glyph">⌕</span>
            <input ref={inputRef} className="search-input"
              placeholder="Try: cobalt, library color, dark sky, oysterman, Mississippi…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setActiveIdx(0); }} />
            <kbd>esc</kbd>
          </div>
          {!q.trim() && <div className="search-hint">Quick paths · or type to search rooms, specs, decisions, ancestors</div>}
          <div className="search-results">
            {results.length === 0 && q.trim() && (
              <div className="search-empty">
                Nothing matches "{q}". Try a feeling word ("warm", "open"), a material ("limestone", "white oak"), or a name ("Glebe", "Oysterman").
              </div>
            )}
            {results.map((r, i) => (
              <button key={`${r.kind}-${r.id || r.label}`}
                className={`search-result ${i === activeIdx ? 'active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => { go(r.route); onClose(); }}>
                <span className="sr-glyph">{KIND_GLYPHS[r.kind]}</span>
                <span className="sr-body">
                  <span className="sr-label">{r.label}</span>
                  <span className="sr-sub">{KIND_LABELS[r.kind]}{r.sub ? ' · ' + r.sub : ''}</span>
                </span>
                {r.reason && <span className="sr-reason">{r.reason}</span>}
              </button>
            ))}
          </div>
          <div className="search-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>⌘K</kbd> toggle</span>
          </div>
        </div>
      </div>
    );
  }

  function useSearch(go) {
    const [open, setOpen] = useState(false);
    useEffect(() => {
      const onKey = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setOpen(o => !o);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);
    const palette = <SearchPalette open={open} onClose={() => setOpen(false)} go={go} />;
    return { open, setOpen, palette };
  }

  function SearchTrigger({ onOpen }) {
    return (
      <button className="search-trigger" onClick={onOpen} aria-label="Search">
        <span className="search-glyph">⌕</span>
        <span className="search-trigger-label">Search the compound</span>
        <kbd>⌘K</kbd>
      </button>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     COMPARE — side-by-side overlay for two-option decisions
     ───────────────────────────────────────────────────────────── */
  function CompareOverlay({ decisionId, onClose, store, setStore }) {
    const decision = useMemo(() => (D.DECISIONS || []).find(d => d.id === decisionId), [decisionId]);
    if (!decision) return null;
    const ds = store.decisions[decision.id] || {};
    const pick = (opt) => {
      const next = JSON.parse(JSON.stringify(store));
      next.decisions[decision.id] = { ...ds, pick: opt, t: Date.now() };
      Store.pushJournal(next, { roomId: (decision.rooms||[])[0], kind:'decision', text:`Picked "${opt}" for ${decision.title}` });
      setStore(next);
    };

    // Use a representative image from the linked rooms, if any
    const linkedRooms = (decision.rooms || []).map(rid => D.ROOMS.find(r => r.id === rid)).filter(Boolean);
    const heroImg = linkedRooms.find(r => r.images && r.images.length > 0)?.images[0];
    const w = window.HCERoomViews;

    useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
      <div className="compare-scrim" onClick={onClose}>
        <div className="compare-overlay" onClick={(e) => e.stopPropagation()}>
          <header className="compare-head">
            <div>
              <div className="compare-eyebrow">Side-by-side · {decision.priority || 'decision'}</div>
              <h2>{decision.title}</h2>
              <p>{decision.body}</p>
            </div>
            <button className="compare-close" onClick={onClose}>Close ✕</button>
          </header>

          <div className={`compare-grid cols-${decision.options.length}`}>
            {decision.options.map((opt, i) => {
              const picked = ds.pick === opt;
              return (
                <article key={opt} className={`compare-pane ${picked ? 'picked' : ''}`}>
                  <div className="compare-pane-img">
                    {heroImg && linkedRooms[0] ? <w.LookbookImage image={heroImg} room={linkedRooms[0]} /> : <div className="compare-placeholder" />}
                    <div className={`compare-tint variant-${i}`} />
                    <div className="compare-letter">{String.fromCharCode(65 + i)}</div>
                  </div>
                  <div className="compare-pane-body">
                    <div className="compare-opt-name">{opt}</div>
                    <button className={`compare-pick ${picked ? 'on' : ''}`}
                      onClick={() => pick(opt)}>
                      {picked ? '✓ This is what feels right' : 'This is what feels right'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <footer className="compare-foot">
            <span>Linked rooms: {(linkedRooms.map(r => r.name)).join(' · ') || '—'}</span>
            <span>Brief: {decision.brief || '—'}</span>
          </footer>
        </div>
      </div>
    );
  }

  function useCompare() {
    const [openId, setOpenId] = useState(null);
    return {
      openCompare: (id) => setOpenId(id),
      closeCompare: () => setOpenId(null),
      openId,
    };
  }

  /* ─────────────────────────────────────────────────────────────
     MISSISSIPPI EASTER EGG
     A small ♥ on the topbar that fades in after a chord is hit.
     Click the brand sigil 5 times → a quiet overlay surfaces a
     line from the Freddy Hemley conservation brief.
     ───────────────────────────────────────────────────────────── */
  function useEasterEgg() {
    const [open, setOpen] = useState(false);
    const counter = useRef({ n: 0, t: 0 });
    const onSigilClick = useCallback(() => {
      const now = Date.now();
      if (now - counter.current.t > 1500) counter.current.n = 0;
      counter.current.n += 1;
      counter.current.t = now;
      if (counter.current.n >= 5) {
        counter.current.n = 0;
        setOpen(true);
      }
    }, []);
    const overlay = open ? <MississippiOverlay onClose={() => setOpen(false)} /> : null;
    return { onSigilClick, overlay, open };
  }

  function MississippiOverlay({ onClose }) {
    useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);
    return (
      <div className="mississippi-scrim" onClick={onClose}>
        <div className="mississippi-card" onClick={(e) => e.stopPropagation()}>
          <div className="ms-eyebrow">Found a quiet moment</div>
          <blockquote className="ms-quote">
            Helen's father's photographs line the stair wall.
          </blockquote>
          <p className="ms-body">
            Roughly one hundred and thirty Mississippi photographs — black and white, mostly. Acid-free interleaving this weekend. A paper conservator surveys next. The walls are the gallery; the family is the curator.
          </p>
          <div className="ms-meta">From the Freddy Hemley Conservation Plan · Living document</div>
          <button className="ms-close" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return {
    useDusk, DuskToggle,
    useSearch, SearchTrigger, SearchPalette,
    CompareOverlay, useCompare,
    useEasterEgg,
  };
})();
