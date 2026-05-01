/* Hill Country Estate — Helen-mode immersive room view ("Standing in the Room") */

window.HCEHelenRoom = (function(){
  const { useState, useEffect, useMemo, useRef } = React;
  const D = window.HCE;
  const Store = window.HCEStore;
  const { Lightbox } = window.HCELightbox;
  const { LookbookImage } = window.HCERoomViews;

  /* ─── Mood as primary axis: sentence completion ─── */
  const MOOD_SENTENCES = [
    "Standing here makes me feel…",
  ];
  const MOOD_COMPLETIONS = [
    'at home',
    'safe',
    'unhurried',
    'small in a good way',
    'ready for guests',
    'like writing a letter',
    'like a Sunday morning',
    'like coming back from somewhere',
    'rooted',
    'awake',
    'private',
    'curious',
    'expansive',
    'remembered',
    'unsure',
    'overwhelmed',
    "like it's not finished",
  ];

  /* ─── Helen-mode RoomDetail ─── */
  function HelenRoomDetail({ id, go, store, setStore, lensAncestor, setLensAncestor }) {
    const r = D.ROOMS.find(x => x.id === id);
    if (!r) return <div className="page"><div className="page-inner"><h1>Room not found</h1></div></div>;

    const [imgIdx, setImgIdx] = useState(0);
    const [zoom, setZoom] = useState(false);
    const [pinMode, setPinMode] = useState(false);
    const [openPin, setOpenPin] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');
    const imgWrapRef = useRef(null);
    const rs = Store.room(store, r.id);
    const img = r.images[imgIdx];
    const pins = (rs.pins || []).filter(p => p.imgSlug === img.slug);
    const wallSaved = (store.wall || []).some(w => w.roomId === r.id && w.imgSlug === img.slug);

    const update = (mut) => {
      const next = JSON.parse(JSON.stringify(store));
      mut(next);
      setStore(next);
    };

    // ─ Image nav
    const next = () => { setImgIdx(i => (i + 1) % r.images.length); setOpenPin(null); };
    const prev = () => { setImgIdx(i => (i - 1 + r.images.length) % r.images.length); setOpenPin(null); };

    useEffect(() => {
      const onKey = (e) => {
        if (zoom || drawerOpen) return;
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'Escape') go({ kind:'building', id: r.building });
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [zoom, drawerOpen, r.images.length]);

    // ─ Heart / love
    const toggleLove = () => {
      update(s => {
        const rr = Store.touch(s, r.id);
        rr.status = rr.status === 'love' ? null : 'love';
        Store.pushJournal(s, { roomId: r.id, kind:'react', text: rr.status === 'love' ? 'Loved' : 'Unloved' });
      });
    };

    // ─ Save current image to Wall
    const toggleWall = () => {
      update(s => {
        s.wall = s.wall || [];
        const idx = s.wall.findIndex(w => w.roomId === r.id && w.imgSlug === img.slug);
        if (idx >= 0) s.wall.splice(idx, 1);
        else {
          s.wall.unshift({ roomId: r.id, imgSlug: img.slug, t: Date.now(), author: Store.identity });
          Store.pushJournal(s, { roomId: r.id, kind:'wall', text: `Saved "${img.caption || img.alt || r.name}" to the wall` });
        }
      });
    };

    // ─ Mood completion (replaces tag picker)
    const toggleMood = (phrase) => {
      update(s => {
        const rr = Store.touch(s, r.id);
        const i = rr.mood.indexOf(phrase);
        if (i >= 0) rr.mood.splice(i, 1);
        else rr.mood.push(phrase);
        Store.pushJournal(s, { roomId: r.id, kind:'mood', text: `Standing here makes me feel ${phrase}` });
      });
    };

    // ─ Pin add (image)
    const onImgClick = (e) => {
      if (!pinMode) {
        if (!openPin) setZoom(true);
        return;
      }
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
        const author = Store.identity;
        rr.pins.push({ id, imgSlug: img.slug, x, y, text, t: Date.now(), author });
        rr.notes.push({ id: 'n_'+id, t: Date.now(), kind:'pin', pinId:id, text, author });
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

    const addNote = () => {
      const text = noteDraft.trim();
      if (!text) return;
      update(s => {
        const rr = Store.room(s, r.id);
        rr.notes.push({ id:'n_'+Date.now().toString(36), t: Date.now(), kind:'text', text, author: Store.identity });
        Store.pushJournal(s, { roomId: r.id, kind:'note', text });
      });
      setNoteDraft('');
    };

    const ancestors = r.ancestors.map(a => D.ANCESTORS[a]).filter(Boolean);
    const isLoved = rs.status === 'love';

    return (
      <div className={`helen-room ${drawerOpen ? 'drawer-open' : ''}`}>
        {/* Full-bleed image stage */}
        <div ref={imgWrapRef} className="hr-stage" onClick={onImgClick}>
          <LookbookImage image={img} room={r} className="hr-image" />

          {/* Pin markers */}
          {pins.map((p, i) => (
            <span key={p.id} className="hr-pin"
              style={{ left: p.x+'%', top: p.y+'%' }}
              onClick={(e) => { e.stopPropagation(); setOpenPin(openPin === p.id ? null : p.id); }}>
              {i+1}
            </span>
          ))}
          {openPin && pins.find(p => p.id === openPin) && (() => {
            const p = pins.find(x => x.id === openPin);
            return (
              <div className="hr-pin-tooltip" style={{ left: p.x+'%', top: p.y+'%' }} onClick={(e) => e.stopPropagation()}>
                <button className="close-pin" onClick={() => setOpenPin(null)}>×</button>
                <div className="meta">Pin {pins.indexOf(p)+1} · {new Date(p.t).toLocaleDateString()}</div>
                {p.text}
                <div style={{marginTop:8, display:'flex', justifyContent:'flex-end'}}>
                  <button className="btn-ghost" style={{padding:'4px 8px', fontSize:'9px'}} onClick={() => removePin(p.id)}>Remove</button>
                </div>
              </div>
            );
          })()}

          {/* Pin instruction */}
          {pinMode && <div className="hr-pin-instruction">Tap the photo to drop a thought</div>}

          {/* Top-bar overlay: room name + ancestor wash */}
          <div className="hr-overlay-top">
            <div className="hr-name-block">
              <h1>{r.name}</h1>
              <div className="hr-tag">{r.tag}</div>
              <div className="hr-ancestors">
                {ancestors.map(a => {
                  const isActive = lensAncestor === a.id;
                  return (
                    <button key={a.id}
                      type="button"
                      className={`hr-ancestor-chip ${a.id}${isActive ? ' is-lens-active' : ''}`}
                      title={isActive ? 'Stop following ' + a.name : 'Follow ' + a.name + ' through the compound'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setLensAncestor) {
                          setLensAncestor(isActive ? null : a.id);
                        }
                      }}>
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <button className="hr-close" onClick={() => go({ kind:'building', id: r.building })} aria-label="Back to building">←</button>
          </div>

          {/* Image pager */}
          {r.images.length > 1 && (
            <>
              <button className="hr-arrow left" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">‹</button>
              <button className="hr-arrow right" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">›</button>
              <div className="hr-pager">
                {r.images.map((_, i) => (
                  <span key={i} className={i===imgIdx?'on':''} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}></span>
                ))}
              </div>
            </>
          )}

          {/* Caption */}
          {img.caption && <div className="hr-caption">{img.caption}</div>}

          {/* Floating action bar (right side) */}
          <div className="hr-actions" onClick={(e) => e.stopPropagation()}>
            <button className={`hr-action heart ${isLoved ? 'on' : ''}`} onClick={toggleLove} title={isLoved ? 'Loved' : 'Love it'}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill={isLoved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 21s-7.5-4.6-9.5-10C1 7 4 4 7.5 4c2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4 20 4 23 7 21.5 11 19.5 16.4 12 21 12 21z"/></svg>
            </button>
            <button className={`hr-action wall ${wallSaved ? 'on' : ''}`} onClick={toggleWall} title={wallSaved ? "Saved to Wall" : "Save to Wall"}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill={wallSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z"/></svg>
            </button>
            <button className={`hr-action pin ${pinMode ? 'on' : ''}`} onClick={() => setPinMode(m => !m)} title="Pin a thought">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z"/></svg>
            </button>
          </div>

          {/* Drawer pull tab */}
          <button className="hr-drawer-tab" onClick={() => setDrawerOpen(o => !o)}>
            <span className="grip"></span>
            <span>{drawerOpen ? 'Close' : 'Reading the Room'}</span>
            <span className="meta">{rs.notes && rs.notes.length ? `${rs.notes.length} note${rs.notes.length===1?'':'s'}` : 'tap to open'}</span>
          </button>
        </div>

        {/* Sliding drawer */}
        <div className="hr-drawer" onClick={(e) => e.target === e.currentTarget && setDrawerOpen(false)}>
          <div className="hr-drawer-inner">
            <div className="hr-drawer-head">
              <h2>{r.name}</h2>
              <button className="hr-drawer-close" onClick={() => setDrawerOpen(false)}>Close</button>
            </div>

            {/* Mood — sentence completion */}
            <section className="hr-section">
              <div className="hr-mood-line">Standing here makes me feel…</div>
              <div className="hr-mood-grid">
                {MOOD_COMPLETIONS.map(phrase => (
                  <button key={phrase} className={`hr-mood-chip ${(rs.mood||[]).includes(phrase) ? 'on':''}`}
                    onClick={() => toggleMood(phrase)}>
                    {phrase}
                  </button>
                ))}
              </div>
              {(rs.mood || []).filter(m => MOOD_COMPLETIONS.includes(m)).length > 0 && (
                <div className="hr-mood-readback">
                  Standing here makes me feel{' '}
                  {(rs.mood || []).filter(m => MOOD_COMPLETIONS.includes(m)).map((m, i, arr) => (
                    <span key={m}>
                      <em>{m}</em>{i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ', and ' : '.'}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Design intent */}
            <section className="hr-section">
              <h3>What this room is reaching for</h3>
              <p className="hr-intent">{r.intent}</p>
              {r.helenNote && <div className="hr-helen-note">{r.helenNote}</div>}
            </section>

            {/* Notes */}
            <section className="hr-section">
              <h3>Your notes <span className="count">{(rs.notes || []).length}</span></h3>
              {(rs.notes || []).length === 0 ? (
                <p className="hr-empty">No notes yet. Type below, or pin a spot on the photo.</p>
              ) : (
                <div className="hr-notes">
                  {[...rs.notes].reverse().map(n => {
                    const longNote = n.text && n.text.length > 120;
                    return (
                      <div key={n.id} className={`hr-note ${longNote ? 'letter' : ''} kind-${n.kind || 'text'}`}>
                        <div className="hr-note-meta">
                          {n.kind === 'pin' && <span className="hr-pin-ref">Pin {(rs.pins.findIndex(p => p.id === n.pinId)+1) || '·'}</span>}
                          <span>{new Date(n.t).toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}</span>
                          {n.author && <span className={`author-badge author-${n.author}`}>— {n.author === 'jon' ? 'J' : 'H'}</span>}
                        </div>
                        <div className="hr-note-text">{n.text}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="hr-note-input">
                <textarea placeholder="A thought, a question, a memory the rendering reminds you of…"
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addNote(); } }} />
                <button onClick={addNote} disabled={!noteDraft.trim()}>Save · ⌘↵</button>
              </div>
            </section>

            {/* Anchor details (optional, simple) */}
            {r.specs && r.specs.length > 0 && (
              <section className="hr-section">
                <h3>The bones of this room</h3>
                <ul className="hr-specs">
                  {r.specs.map(sp => (
                    <li key={sp.k}>
                      <span className="hr-spec-k">{sp.k}</span>
                      <span className="hr-spec-v">{sp.v}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Technical layer (Pass 4) */}
            {window.RoomTechReveal && (
              <section className="hr-section hr-section-tech">
                <window.RoomTechReveal roomId={r.id} />
              </section>
            )}
          </div>
        </div>

        {zoom && <Lightbox image={img} caption={img.caption} onClose={() => setZoom(false)} />}
      </div>
    );
  }

  return { HelenRoomDetail, MOOD_COMPLETIONS };
})();
