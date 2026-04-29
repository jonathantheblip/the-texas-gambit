/* Hill Country Estate — Room views (Building + Room Detail) */

window.HCERoomViews = (function(){
  const { useState, useEffect, useMemo, useRef } = React;
  const D = window.HCE;
  const Store = window.HCEStore;
  const { Lightbox } = window.HCELightbox;

  /* ─── Image renderer (real PNG > placeholder) ─── */
  function LookbookImage({ image, room, className, onMeta }) {
    const html = useMemo(() => image.real ? null : window.placeholderFor(image, room),
      [image.slug, room && room.id]);
    if (image.real) {
      return <img className={`real-img ${className||''}`} src={image.src} alt={image.alt} loading="lazy"
        onLoad={(e)=> onMeta && onMeta({ w: e.target.naturalWidth, h: e.target.naturalHeight })} />;
    }
    return <div className={className} dangerouslySetInnerHTML={{__html: html}} />;
  }

  /* ─── Building View ─── */
  function BuildingView({ id, go, store, setStore, mode }) {
    const b = D.BUILDINGS.find(x => x.id === id);
    if (!b) return <div className="page"><div className="page-inner"><h1>Not found</h1></div></div>;
    const rooms = D.ROOMS.filter(r => r.building === id);
    const floors = [...new Set(rooms.map(r => r.floor))];
    const [floor, setFloor] = useState(floors[0] || 'ground');
    const [view, setView] = useState('rooms'); // 'rooms' | 'plan'
    const flrRooms = rooms.filter(r => r.floor === floor);
    const phase = D.PHASES.find(p => p.id === b.phase);
    const plan = b.plans && b.plans.find(p => p.floor === floor);

    return (
      <div className="page fade-up">
        <div className="page-inner">
          <div className="building-head">
            <div>
              <div className="page-head" style={{padding:0}}>
                <h1>{b.name}</h1>
                <div className="sub">{phase ? `Phase ${phase.id} · ${phase.name} · ${phase.years}` : ''}{b.label ? ` — ${b.label}` : ''}</div>
              </div>
            </div>
            <div className="view-toggle">
              <button className={view==='rooms'?'active':''} onClick={()=>setView('rooms')}>Rooms</button>
              {plan && <button className={view==='plan'?'active':''} onClick={()=>setView('plan')}>Plan</button>}
            </div>
          </div>

          {floors.length > 1 && (
            <div className="floor-tabs">
              {floors.map(f => (
                <button key={f} className={f===floor?'active':''} onClick={()=>setFloor(f)}>
                  {f === 'ground' ? 'Ground Floor' : f === 'upper' ? 'Upper Floor' : f}
                </button>
              ))}
            </div>
          )}

          {view === 'plan' && plan ? (
            <FloorplanView file={plan.file} label={plan.label} mode={mode} />
          ) : (
            <div className="rooms-grid">
              {flrRooms.map((r, idx) => {
                const rs = store.rooms[r.id] || {};
                return (
                  <button key={r.id} className="room-card fade-up" style={{animationDelay: `${idx*0.04}s`}}
                    data-ancestors={(r.ancestors || []).join(' ')}
                    onClick={()=> go({ kind:'room', id: r.id })}>
                    <div className="thumb">
                      {r.images[0] ? <LookbookImage image={r.images[0]} room={r} /> : null}
                    </div>
                    <div className="badges">
                      {r.ancestors.slice(0,3).map(a => (
                        <span key={a} className={`badge dot ${a}`} title={D.ANCESTORS[a].name}></span>
                      ))}
                    </div>
                    {rs.status === 'love' && <span className="room-state-pill loved">Loved</span>}
                    {rs.status === 'changes' && <span className="room-state-pill changes">Changes</span>}
                    <div className="body">
                      <h3>{r.name}</h3>
                      <div className="tag">{r.tag}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── Floor plan inline-fetch viewer ─── */
  function FloorplanView({ file, label, mode }) {
    const [svg, setSvg] = useState(null);
    const [err, setErr] = useState(false);
    useEffect(() => {
      let alive = true;
      fetch(`lookbook_images/${file}`)
        .then(r => r.text())
        .then(t => { if (alive) setSvg(t); })
        .catch(() => { if (alive) setErr(true); });
      return () => { alive = false; };
    }, [file]);
    return (
      <div className="fp-stage" data-mode={mode}>
        <div className="fp-toolbar">
          <span>{label || 'Plan'}</span>
          <span>Drag · pinch · scroll</span>
        </div>
        {err ? <div style={{padding:'40px', textAlign:'center', opacity:.6}}>Floor plan unavailable.</div> :
          svg ? <div className="fp-svg" dangerouslySetInnerHTML={{__html: svg}} /> :
            <div style={{padding:'40px', textAlign:'center', opacity:.6}}>Loading…</div>}
      </div>
    );
  }

  /* ─── Quick-react chip ─── */
  const QUICK_REACTS = [
    { id:'love',         label:'Love it',           kind:'love' },
    { id:'not-sure',     label:'Not sure',          kind:'mood' },
    { id:'lets-talk',    label:"Let's talk",        kind:'mood' },
    { id:'different',    label:'Different direction', kind:'changes' },
  ];

  /* ─── Room Detail ─── */
  function RoomDetail({ id, go, store, setStore, mode }) {
    const r = D.ROOMS.find(x => x.id === id);
    if (!r) return <div className="page"><div className="page-inner"><h1>Room not found</h1></div></div>;

    const [imgIdx, setImgIdx] = useState(0);
    const [meta, setMeta] = useState(null);
    const [pinMode, setPinMode] = useState(false);
    const [openPin, setOpenPin] = useState(null);
    const [zoom, setZoom] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');
    const imgWrapRef = useRef(null);
    const rs = Store.room(store, r.id);
    const img = r.images[imgIdx];
    const pins = (rs.pins || []).filter(p => p.imgSlug === img.slug);

    // Update store helper
    const update = (mut) => {
      const next = JSON.parse(JSON.stringify(store));
      mut(next);
      setStore(next);
    };

    // ─ Status / quick-react
    const setStatus = (kind, label) => {
      update(s => {
        const rr = Store.room(s, r.id);
        if (kind === 'love') rr.status = rr.status === 'love' ? null : 'love';
        else if (kind === 'changes') rr.status = rr.status === 'changes' ? null : 'changes';
        else {
          const i = rr.mood.indexOf(label);
          if (i >= 0) rr.mood.splice(i, 1); else rr.mood.push(label);
        }
        Store.pushJournal(s, { roomId: r.id, kind:'react', text: label });
      });
    };
    const isReactActive = (qr) => {
      if (qr.kind === 'love') return rs.status === 'love';
      if (qr.kind === 'changes') return rs.status === 'changes';
      return rs.mood && rs.mood.includes(qr.label);
    };

    // ─ Pin add
    const onImgClick = (e) => {
      if (!pinMode) return;
      const wrap = imgWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const text = window.prompt('What about this spot?');
      if (!text) { setPinMode(false); return; }
      update(s => {
        const rr = Store.room(s, r.id);
        const id = 'p_' + Date.now().toString(36);
        rr.pins.push({ id, imgSlug: img.slug, x, y, text, t: Date.now() });
        rr.notes.push({ id: 'n_'+id, t: Date.now(), kind:'pin', pinId:id, text });
        Store.pushJournal(s, { roomId: r.id, kind:'pin', text, extra:{ pinId:id, imgSlug: img.slug } });
      });
      setPinMode(false);
    };

    const removePin = (pinId) => {
      update(s => {
        const rr = Store.room(s, r.id);
        rr.pins = rr.pins.filter(p => p.id !== pinId);
        rr.notes = rr.notes.filter(n => n.pinId !== pinId);
      });
      setOpenPin(null);
    };

    // ─ Spec react
    const setSpecReact = (k, val) => {
      update(s => {
        const rr = Store.room(s, r.id);
        rr.specs[k] = rr.specs[k] === val ? null : val;
        Store.pushJournal(s, { roomId: r.id, kind:'spec', text:`${val} · ${k}` });
      });
    };

    // ─ Note add
    const addNote = () => {
      const text = noteDraft.trim();
      if (!text) return;
      update(s => {
        const rr = Store.room(s, r.id);
        rr.notes.push({ id:'n_'+Date.now().toString(36), t: Date.now(), kind:'text', text });
        Store.pushJournal(s, { roomId: r.id, kind:'note', text });
      });
      setNoteDraft('');
    };

    // ─ Decision pick
    const pickDecision = (decId, opt) => {
      update(s => {
        s.decisions[decId] = { pick: opt, t: Date.now() };
        Store.pushJournal(s, { roomId: r.id, kind:'decision', text:`${decId}: ${opt}` });
      });
    };

    // Decisions referencing this room
    const roomDecisions = (D.DECISIONS || []).filter(d => (d.rooms || []).includes(r.id));

    // ─ Image nav
    const next = () => setImgIdx(i => (i + 1) % r.images.length);
    const prev = () => setImgIdx(i => (i - 1 + r.images.length) % r.images.length);

    useEffect(() => {
      const onKey = (e) => {
        if (zoom) return;
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'Escape') go({ kind:'building', id: r.building });
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [zoom, r.images.length]);

    // Aspect class based on real-image natural dimensions
    const aspectClass = img.real
      ? (meta && meta.h > meta.w ? 'portrait' : (meta && (meta.w/meta.h) > 2 ? 'cinema' : 'landscape'))
      : '';
    const wrapClasses = ['img-wrap', aspectClass, !img.real && 'has-svg-placeholder'].filter(Boolean).join(' ');

    return (
      <div className="room-detail fade-up">
        {/* Image stage */}
        <div className={`image-stage ${img.caption ? 'has-caption':''}`}>
          {r.images.length > 1 && (
            <>
              <button className="arrow left" onClick={prev} aria-label="Previous">‹</button>
              <button className="arrow right" onClick={next} aria-label="Next">›</button>
              <div className="pager">{imgIdx+1} / {r.images.length}</div>
            </>
          )}
          {pinMode && <div className="pin-instruction">Tap the photo to drop a comment</div>}
          <span className="zoom-hint">Tap to zoom</span>
          <div className="frame">
            <div ref={imgWrapRef} className={wrapClasses}
              onClick={(e) => { if (pinMode) onImgClick(e); else if (!openPin) setZoom(true); }}>
              <LookbookImage image={img} room={r} onMeta={setMeta} />
              {pins.map((p, i) => (
                <span key={p.id} className="pin-marker"
                  style={{ left: p.x+'%', top: p.y+'%' }}
                  onClick={(e) => { e.stopPropagation(); setOpenPin(openPin === p.id ? null : p.id); }}>
                  {i+1}
                </span>
              ))}
              {openPin && pins.find(p => p.id === openPin) && (() => {
                const p = pins.find(x => x.id === openPin);
                return (
                  <div className="pin-tooltip" style={{ left: p.x+'%', top: p.y+'%' }} onClick={(e) => e.stopPropagation()}>
                    <button className="close-pin" onClick={() => setOpenPin(null)}>×</button>
                    <div className="meta">Pin {pins.indexOf(p)+1} · {new Date(p.t).toLocaleDateString()}</div>
                    {p.text}
                    <div style={{marginTop:8, display:'flex', justifyContent:'flex-end'}}>
                      <button className="btn-ghost" style={{padding:'4px 8px', fontSize:'9px'}} onClick={() => removePin(p.id)}>Remove</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          {img.caption && <div className="caption">{img.caption}</div>}
          <div className="quick-reacts">
            {QUICK_REACTS.map(qr => (
              <button key={qr.id} className={`quick-react ${qr.kind} ${isReactActive(qr) ? 'active':''}`}
                onClick={() => setStatus(qr.kind, qr.label)}>
                {qr.label}
              </button>
            ))}
            <button className={`quick-react pin ${pinMode ? 'active':''}`} onClick={() => setPinMode(m => !m)}>
              {pinMode ? 'Tap photo…' : `Pin a thought${pins.length ? ` (${rs.pins.filter(p=>p.imgSlug===img.slug).length})` : ''}`}
            </button>
          </div>
        </div>

        {/* Detail panel */}
        <div className="detail-panel">
          <div className="page-head" style={{padding:0}}>
            <h2>{r.name}</h2>
            <div className="panel-tag">{r.tag}</div>
          </div>

          <div className="panel-section">
            <h4>Ancestors</h4>
            <div className="ancestor-chips">
              {r.ancestors.map(a => {
                const A = D.ANCESTORS[a];
                return (
                  <span key={a} className={`ancestor-chip ${a}`}>
                    <span className="dot"></span>{A.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="panel-section">
            <h4>Design Intent</h4>
            <div className="intent first-letter">{r.intent}</div>
            {r.helenNote && <div className="helen-note">{r.helenNote}</div>}
          </div>

          {roomDecisions.length > 0 && (
            <div className="panel-section">
              <h4>Open Decisions</h4>
              {roomDecisions.map(dec => (
                <div key={dec.id} className="decision-callout" style={{marginTop: 8}}>
                  <div className="dc-title">{dec.title}</div>
                  <div className="dc-body">{dec.body}</div>
                  {dec.options && (
                    <div className="dc-options">
                      {dec.options.map(opt => (
                        <button key={opt} className={(store.decisions[dec.id]||{}).pick === opt ? 'helen-pick' : ''}
                          onClick={() => pickDecision(dec.id, opt)}>{opt}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {(mode === 'jon' || rs.specs && Object.keys(rs.specs).length || (r.specs && r.specs.length)) && r.specs && (
            <div className="panel-section">
              <h4>{mode === 'jon' ? 'Locked Specs' : 'Anchor Details'}</h4>
              <ul className="spec-list">
                {r.specs.map(sp => {
                  const cur = rs.specs && rs.specs[sp.k];
                  return (
                    <li key={sp.k}>
                      <span className="k">{sp.k}</span>
                      <span className="v">{sp.v}</span>
                      <span className="spec-react">
                        <button className={`locked ${cur==='lock' ? 'active':''}`} onClick={() => setSpecReact(sp.k, 'lock')} title="Locked, looks right">Lock</button>
                        <button className={`ask ${cur==='ask' ? 'active':''}`} onClick={() => setSpecReact(sp.k, 'ask')} title="Ask about this">Ask</button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {r.zones && (
            <div className="panel-section">
              <h4>Zones</h4>
              <ul className="spec-list">
                {r.zones.map(z => (
                  <li key={z.z}>
                    <span className="k">Zone {z.z}</span>
                    <span className="v"><strong>{z.name}</strong> — {z.what}</span>
                    <span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="panel-section">
            <h4>Helen's Notes</h4>
            {(rs.notes || []).length > 0 ? (
              <div className="note-feed">
                {rs.notes.map(n => (
                  <div key={n.id} className={`note kind-${n.kind || 'text'}`}>
                    <div className="meta">
                      {n.kind === 'pin' && <span className="pin-ref">Pin {(rs.pins.findIndex(p => p.id === n.pinId)+1) || '·'}</span>}
                      {new Date(n.t).toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}
                    </div>
                    {n.text}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{fontStyle:'italic', color:'var(--walnut-faint)', fontSize:'13px'}}>
                No notes yet. Type below, or pin a spot on the photo.
              </div>
            )}
            <div className="note-input">
              <textarea placeholder="A thought, a question, a memory the rendering reminds you of…"
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }} />
              <button onClick={addNote}>Save</button>
            </div>
          </div>

          <div className="panel-section">
            <h4>Mood</h4>
            <div className="mood-tags">
              {['Calm','Generous','Witty','Quiet','Earned'].map(m => (
                <button key={m} className={`mood-tag ${(rs.mood||[]).includes(m) ? 'active':''}`}
                  onClick={() => setStatus('mood', m)}>{m}</button>
              ))}
            </div>
          </div>

          {mode === 'jon' && r.specs && (
            <div className="panel-section">
              <h4>Reference Briefs</h4>
              <div className="ref-link">
                <a onClick={() => go({ kind:'briefs' })}>Imber · Design Intent</a>
                <a onClick={() => go({ kind:'briefs' })}>Dibello · Technical</a>
              </div>
            </div>
          )}
        </div>

        {zoom && <Lightbox image={img} caption={img.caption} onClose={() => setZoom(false)} />}
      </div>
    );
  }

  return { BuildingView, RoomDetail, LookbookImage };
})();
