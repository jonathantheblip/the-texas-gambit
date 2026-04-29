/* Hill Country Estate — Root app + routing + chrome */

(function(){
  const { useState, useEffect, useMemo, useRef } = React;
  const D = window.HCE;
  const Store = window.HCEStore;
  const { BuildingView, RoomDetail } = window.HCERoomViews;
  const { CompoundHome, RoomsIndex, Phasing, Decisions, Journal, Ancestors, HelenWall } = window.HCEOtherViews;
  const { HelenDigest, WorkingSet, LockedSpecs } = window.HCEJonViews;
  const { HelenRoomDetail } = window.HCEHelenRoom;

  // ── Route helpers (URL hash routing) ──
  function parseRoute() {
    const h = (location.hash || '#/').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    if (parts.length === 0) return { kind:'home' };
    const [k, id, ...rest] = parts;
    const m = { kind: k, id };
    if (rest.length) m.extra = rest.join('/');
    return m;
  }
  function routeToHash(r) {
    let h = '#/';
    if (r.kind === 'home') h = '#/';
    else if (r.id) h = `#/${r.kind}/${r.id}`;
    else h = `#/${r.kind}`;
    return h;
  }

  // ── Top-level App ──
  function App() {
    const [route, setRoute] = useState(parseRoute());
    const [mode, setMode] = useState(() => localStorage.getItem('hce.mode') || 'helen');
    const [store, setStore] = useState(() => Store.load());
    const [syncMsg, setSyncMsg] = useState(null);
    const [lensAncestor, setLensAncestor] = useState(() => sessionStorage.getItem('hce.lens') || null);
    const lastStoreRef = useRef(store);

    // Lens persists for the session only; sets a body attr so CSS can dim non-matching cards
    useEffect(() => {
      if (lensAncestor) {
        sessionStorage.setItem('hce.lens', lensAncestor);
        document.body.setAttribute('data-lens', lensAncestor);
      } else {
        sessionStorage.removeItem('hce.lens');
        document.body.removeAttribute('data-lens');
      }
    }, [lensAncestor]);

    // Lens is a Helen-mode tool only
    useEffect(() => {
      if (mode === 'jon' && lensAncestor) setLensAncestor(null);
    }, [mode]);

    // ── Persist store + show sync indicator
    useEffect(() => {
      Store.save(store);
      if (lastStoreRef.current !== store) {
        const before = JSON.stringify(lastStoreRef.current);
        const after = JSON.stringify(store);
        if (before !== after) {
          setSyncMsg('Saved');
          const t = setTimeout(() => setSyncMsg(null), 1400);
          lastStoreRef.current = store;
          return () => clearTimeout(t);
        }
      }
    }, [store]);

    // ── Persist mode
    useEffect(() => {
      localStorage.setItem('hce.mode', mode);
      document.body.dataset.mode = mode;
      // Dusk is a Helen-mode atmosphere only; clear it when switching to Jon
      if (mode === 'jon') {
        document.body.setAttribute('data-tone', 'day');
      }
      // Swap the browser-tab favicon to match the current mode
      const fav = document.getElementById('favicon');
      if (fav) fav.setAttribute('href', mode === 'jon' ? 'favicon-jon.svg' : 'favicon-helen.svg');
    }, [mode]);

    // ── Hash routing
    useEffect(() => {
      const onHash = () => {
        // Only adopt the hash-derived route if it differs from current "kind" path.
        // This preserves transient props (like focus) that go() sets directly.
        setRoute(prev => {
          const next = parseRoute();
          if (prev && prev.kind === next.kind && prev.id === next.id) return prev;
          return next;
        });
      };
      window.addEventListener('hashchange', onHash);
      return () => window.removeEventListener('hashchange', onHash);
    }, []);

    const go = (r) => {
      const h = routeToHash(r);
      if (location.hash !== h) location.hash = h;
      setRoute(r);
      // Scroll the page container to top on navigation
      requestAnimationFrame(() => {
        const p = document.querySelector('.page');
        if (p) p.scrollTo({ top: 0, behavior: 'instant' });
      });
    };

    // ── Counts for nav badges
    const decisionsOpen = useMemo(() => {
      const decs = D.DECISIONS || [];
      return decs.filter(d => !(store.decisions[d.id] && store.decisions[d.id].pick)).length;
    }, [store]);

    const notesCount = useMemo(() => {
      let n = (store.journal || []).length;
      Object.values(store.rooms || {}).forEach(rs => { n += (rs.notes||[]).length; });
      return n;
    }, [store]);

    // ── Pass 3 hooks
    const [dusk, setDusk] = window.HCEPass3.useDusk();
    const [searchOpen, setSearchOpen] = useState(false);
    const searchPalette = (
      <window.HCEPass3.SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        go={(r) => { go(r); setSearchOpen(false); }}
      />
    );
    useEffect(() => {
      const onKey = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setSearchOpen(o => !o);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);
    const { openCompare, closeCompare, openId: compareId } = window.HCEPass3.useCompare();
    window.__hceOpenCompare = openCompare;  // expose for Decisions view
    const easter = window.HCEPass3.useEasterEgg();
    const onSigilClick = easter.onSigilClick;
    const easterOverlay = easter.overlay;

    // ── Crumb
    const crumb = useMemo(() => {
      const parts = [{ label:'Compound', go: () => go({ kind:'home' }) }];
      if (route.kind === 'building') {
        const b = D.BUILDINGS.find(x => x.id === route.id);
        if (b) parts.push({ label: b.name });
      } else if (route.kind === 'room') {
        const r = D.ROOMS.find(x => x.id === route.id);
        if (r) {
          const b = D.BUILDINGS.find(x => x.id === r.building);
          if (b) parts.push({ label: b.name, go: () => go({ kind:'building', id: b.id }) });
          parts.push({ label: r.name });
        }
      } else if (route.kind === 'rooms') parts.push({ label:'Rooms' });
      else if (route.kind === 'phasing') parts.push({ label:'Phasing' });
      else if (route.kind === 'decisions') parts.push({ label:"Decisions" });
      else if (route.kind === 'notes') parts.push({ label:'Notes' });
      else if (route.kind === 'ancestors') parts.push({ label:'Ancestors' });
      else if (route.kind === 'digest') parts.push({ label:'Helen Digest' });
      else if (route.kind === 'specs') parts.push({ label:'The Plan' }, { label:'Locked Specs' });
      else if (route.kind === 'plan') parts.push({ label:'The Plan' });
      return parts;
    }, [route]);

    // ── Body content
    const lensProps = { lensAncestor, setLensAncestor };
    let body;
    switch (route.kind) {
      case 'building':  body = <BuildingView id={route.id} go={go} store={store} setStore={setStore} mode={mode} {...lensProps} />; break;
      case 'room':
        body = mode === 'helen'
          ? <HelenRoomDetail id={route.id} go={go} store={store} setStore={setStore} {...lensProps} />
          : <RoomDetail      id={route.id} go={go} store={store} setStore={setStore} mode={mode} />;
        break;
      case 'wall':      body = <HelenWall    go={go} store={store} setStore={setStore} />; break;
      case 'rooms':     body = <RoomsIndex   go={go} store={store} mode={mode} {...lensProps} />; break;
      case 'phasing':   body = <Phasing      go={go} store={store} />; break;
      case 'decisions': body = <Decisions    go={go} store={store} setStore={setStore} focus={route.focus} />; break;
      case 'notes':     body = <Journal      go={go} store={store} />; break;
      case 'ancestors': body = <Ancestors    go={go} {...lensProps} />; break;
      case 'digest':    body = <HelenDigest  go={go} store={store} />; break;
      case 'specs':     body = <ThePlan      go={go} store={store} setStore={setStore} />; break;
      case 'plan':      body = <ThePlan      go={go} store={store} setStore={setStore} />; break;
      default:
        body = mode === 'jon'
          ? <WorkingSet go={go} store={store} />
          : <CompoundHome go={go} store={store} mode={mode} {...lensProps} />;
    }

    return (
      <>
        <Topbar mode={mode} setMode={setMode} crumb={crumb} decisionsOpen={decisionsOpen} go={go}
          dusk={dusk} setDusk={setDusk} openSearch={() => setSearchOpen(true)} onSigilClick={onSigilClick} />
        <TopNav route={route} go={go} mode={mode} decisionsOpen={decisionsOpen} notesCount={notesCount} />
        {mode === 'helen' && lensAncestor && (
          <LensRibbon ancestorId={lensAncestor} clear={() => setLensAncestor(null)} go={go} />
        )}
        {body}
        <BottomNav route={route} go={go} mode={mode} decisionsOpen={decisionsOpen} notesCount={notesCount} />
        {syncMsg && <div className="sync-indicator show"><span className="dot"></span>{syncMsg}</div>}
        {searchPalette}
        {compareId && <window.HCEPass3.CompareOverlay decisionId={compareId} onClose={closeCompare} store={store} setStore={setStore} />}
        {easterOverlay}
      </>
    );
  }

  // ── Lens Ribbon — persistent strip when an ancestor lens is active ──
  function LensRibbon({ ancestorId, clear, go }) {
    const a = D.ANCESTORS[ancestorId];
    if (!a) return null;
    const matchedRooms = D.ROOMS.filter(r => (r.ancestors || []).includes(ancestorId));
    const buildings = new Set(matchedRooms.map(r => r.building));
    return (
      <div className={`lens-ribbon lens-${ancestorId}`}>
        <div className="lens-ribbon-inner">
          <div className="lens-text">
            <span className="lens-eyebrow">Following</span>
            <span className="lens-name">{a.name}</span>
            <span className="lens-meta">through {matchedRooms.length} rooms across {buildings.size} buildings</span>
          </div>
          <div className="lens-actions">
            <button onClick={() => go({ kind:'rooms' })}>See all rooms</button>
            <button className="clear" onClick={clear} aria-label="Clear lens">✕ Clear</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Topbar ──
  function Topbar({ mode, setMode, crumb, decisionsOpen, go, dusk, setDusk, openSearch, onSigilClick }) {
    const { DuskToggle, SearchTrigger } = window.HCEPass3;
    return (
      <div className="topbar">
        <div className="brand" onClick={() => go({ kind:'home' })} style={{cursor:'pointer'}}>
          <div className="sigil" onClick={(e) => { e.stopPropagation(); onSigilClick && onSigilClick(); }}>DK</div>
          <div>
            <div className="brand-title">Hill Country Estate</div>
            <div className="brand-meta">DiBello · Imber · Sundt · 2026 → 2038</div>
          </div>
        </div>
        <div className="crumb">
          {crumb.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="sep">›</span>}
              {c.go ? <a onClick={c.go}>{c.label}</a> : <span>{c.label}</span>}
            </React.Fragment>
          ))}
        </div>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <SearchTrigger onOpen={openSearch} />
          {mode === 'helen' && <DuskToggle dusk={dusk} setDusk={setDusk} />}
          {decisionsOpen > 0 && (
            <button className="pending-pill" onClick={() => go({ kind:'decisions' })}>
              {decisionsOpen} open
            </button>
          )}
          <div className="mode-switch">
            <button className={mode==='helen'?'active':''} onClick={() => setMode('helen')}>Helen</button>
            <button className={mode==='jon'?'active':''}   onClick={() => setMode('jon')}>Jon</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Top nav (desktop) ──
  function TopNav({ route, go, mode, decisionsOpen, notesCount }) {
    const helenItems = [
      { id:'home',      label:'Compound',  match:(r)=>['home','building','room'].includes(r.kind) },
      { id:'rooms',     label:'Rooms',     match:(r)=>r.kind==='rooms' },
      { id:'wall',      label:'The Wall',  match:(r)=>r.kind==='wall' },
      { id:'plan',      label:'The Plan',  match:(r)=>r.kind==='plan' },
      { id:'phasing',   label:'Phasing',   match:(r)=>r.kind==='phasing' },
      { id:'ancestors', label:'Ancestors', match:(r)=>r.kind==='ancestors' },
      { id:'decisions', label:'Decisions', badge: decisionsOpen, match:(r)=>r.kind==='decisions' },
      { id:'notes',     label:'My Notes',  badge: notesCount,    match:(r)=>r.kind==='notes' },
    ];
    const jonItems = [
      { id:'home',      label:'Working Set',  match:(r)=>['home','building','room'].includes(r.kind) },
      { id:'digest',    label:'Helen Digest', match:(r)=>r.kind==='digest' },
      { id:'decisions', label:'Decisions',    badge: decisionsOpen, match:(r)=>r.kind==='decisions' },
      { id:'plan',      label:'The Plan',     match:(r)=>r.kind==='plan' || r.kind==='specs' },
      { id:'phasing',   label:'Phasing',      match:(r)=>r.kind==='phasing' },
    ];
    const items = mode === 'jon' ? jonItems : helenItems;
    return (
      <nav className="top-nav">
        {items.map(it => (
          <button key={it.id} className={it.match(route) ? 'active' : ''}
            onClick={() => go({ kind: it.id === 'home' ? 'home' : it.id })}>
            {it.label}{it.badge ? ` · ${it.badge}` : ''}
          </button>
        ))}
      </nav>
    );
  }

  // ── Bottom nav (mobile) ──
  function BottomNav({ route, go, mode, decisionsOpen, notesCount }) {
    const helenItems = [
      { id:'home',      label:'Compound',  glyph:'⌂', match:(r)=>['home','building','room'].includes(r.kind) },
      { id:'rooms',     label:'Rooms',     glyph:'⊞', match:(r)=>r.kind==='rooms' },
      { id:'plan',      label:'The Plan',  glyph:'┃', match:(r)=>r.kind==='plan' },
      { id:'decisions', label:'Decisions', glyph:'◆', match:(r)=>r.kind==='decisions', badge: decisionsOpen },
      { id:'notes',     label:'Notes',     glyph:'✎', match:(r)=>r.kind==='notes' },
    ];
    const jonItems = [
      { id:'home',      label:'Working',   glyph:'▤', match:(r)=>['home','building','room'].includes(r.kind) },
      { id:'digest',    label:'Digest',    glyph:'❝', match:(r)=>r.kind==='digest' },
      { id:'decisions', label:'Decisions', glyph:'◆', match:(r)=>r.kind==='decisions', badge: decisionsOpen },
      { id:'plan',      label:'Plan',      glyph:'┃', match:(r)=>r.kind==='plan' || r.kind==='specs' },
      { id:'phasing',   label:'Phases',    glyph:'⊟', match:(r)=>r.kind==='phasing' },
    ];
    const items = mode === 'jon' ? jonItems : helenItems;
    return (
      <nav className="bottom-nav">
        {items.map(it => (
          <button key={it.id} className={it.match(route) ? 'active' : ''}
            onClick={() => go({ kind: it.id === 'home' ? 'home' : it.id })}>
            <span className="glyph">{it.glyph}</span>
            <span>{it.label}</span>
            {it.badge > 0 && <span className="badge-dot">{it.badge}</span>}
          </button>
        ))}
      </nav>
    );
  }

  // ── Mount ──
  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(<App />);
})();
