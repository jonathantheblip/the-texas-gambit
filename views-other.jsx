/* Hill Country Estate — Other views (Compound home, Phasing, Decisions, Notes, Ancestors) */

window.HCEOtherViews = (function(){
  const { useState, useMemo, useEffect } = React;
  const D = window.HCE;
  const Store = window.HCEStore;

  /* ─── Compound home ─── */
  const BUILDING_HERO = {
    'main-block':   { src:'lookbook_images/ext_frontelevation_hero.png',  tag:'The Glebe — five-bay Georgian face' },
    'service-wing': { src:'lookbook_images/sw_kitchen_hero.png',          tag:'Kitchen · pantry · wine' },
    'wharf-wing':   { src:'lookbook_images/ext_wharfwing_hero.png',       tag:'Sunroom · guest suite' },
    'pool':         { src:'lookbook_images/ext_poolterrace_hero.png',     tag:'Six zones at the canyon edge' },
    'motor-barn':   { src:'lookbook_images/ob_motorbarnext_hero.png',     tag:'Garage · greenhouse · loft' },
    'pavilion':     { src:'lookbook_images/ob_pavilion_hero.png',         tag:'Heavy-timber cedar pavilion' },
    'observatory':  { src:'lookbook_images/ob_observatoryextday_hero.png',tag:'Folly at the canyon edge' },
  };

  function CompoundHome({ go, store, mode }) {
    const [view, setView] = useState('list'); // 'list' | 'plan'
    const buildings = D.BUILDINGS.filter(b =>
      b.id !== 'compound' && b.id !== 'covered-walkway' && b.id !== 'grape-pergola'
    );

    const counts = useMemo(() => {
      const c = {};
      D.ROOMS.forEach(r => {
        const s = store.rooms[r.id] || {};
        if (!c[r.building]) c[r.building] = { loved:0, changes:0, total:0 };
        c[r.building].total++;
        if (s.status === 'love') c[r.building].loved++;
        if (s.status === 'changes') c[r.building].changes++;
      });
      return c;
    }, [store]);

    // Aggregate ancestors per building (used for the lens dim/lift)
    const ancestorsByBuilding = useMemo(() => {
      const m = {};
      D.ROOMS.forEach(r => {
        if (!m[r.building]) m[r.building] = new Set();
        (r.ancestors || []).forEach(a => m[r.building].add(a));
      });
      return m;
    }, []);

    return (
      <div className="page fade-up">
        <div className="page-inner">
          <div className="compound-hero">
            <h1>The <em>Compound</em></h1>
            <p className="lede">
              Tap a building, drift through its rooms. Three ancestors — the Glebe, Captain Jack's Wharf,
              the Hill Country — meet on forty acres above a canyon.
            </p>
            <div className="view-toggle">
              <button className={view==='list'?'active':''} onClick={()=>setView('list')}>Buildings</button>
              <button className={view==='plan'?'active':''} onClick={()=>setView('plan')}>Floor Plan</button>
            </div>
          </div>

          {view === 'plan' ? (
            <CompoundPlan />
          ) : (
            <div className="bldg-list">
              {buildings.map((b, idx) => {
                const c = counts[b.id] || {};
                const hero = BUILDING_HERO[b.id];
                const phase = D.PHASES.find(p => p.id === b.phase);
                const bAncs = Array.from(ancestorsByBuilding[b.id] || []).join(' ');
                return (
                  <button key={b.id} className={`bldg-card phase-${b.phase} fade-up`} style={{animationDelay: `${idx*0.05}s`}}
                    data-ancestors={bAncs}
                    onClick={() => go({ kind:'building', id: b.id })}>
                    <div className="bldg-card-img">
                      {hero ? <img src={hero.src} alt={b.name} loading="lazy" /> : <div style={{padding:30, color:'var(--walnut-faint)'}}>{b.name}</div>}
                      <div className="bldg-card-grad"></div>
                      <div className="bldg-card-phase">
                        <span className="dot"></span>Phase {b.phase}
                      </div>
                    </div>
                    <div className="bldg-card-body">
                      <div className="bldg-card-text">
                        <h3>{b.name}</h3>
                        <div className="tagline">{hero ? hero.tag : b.label}</div>
                      </div>
                      <div className="bldg-card-stats">
                        {c.loved > 0 && <span className="bldg-stat loved">♥ {c.loved}</span>}
                        {c.changes > 0 && <span className="bldg-stat changes">{c.changes} ↻</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="bldg-list-foot">
                <div className="phase-key">
                  {D.PHASES.map(p => (
                    <div key={p.id} className="phase-key-row">
                      <span className={`phase-key-swatch phase-${p.id}`}></span>
                      <strong>Phase {p.id}</strong> · {p.name} · <em>{p.years}</em>
                    </div>
                  ))}
                </div>
                <button className="btn-ghost" onClick={() => go({ kind:'ancestors' })}>The Three Ancestors →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── Compound floor plan ─── */
  function CompoundPlan() {
    const [svg, setSvg] = useState(null);
    useEffect(() => {
      let alive = true;
      fetch('lookbook_images/floorplan_compound.svg')
        .then(r => r.text())
        .then(t => { if (alive) setSvg(t); })
        .catch(() => {});
      return () => { alive = false; };
    }, []);
    return (
      <div className="fp-stage">
        <div className="fp-toolbar">
          <span>Site Plan · 40 Acres</span>
          <span>Drag · pinch · scroll</span>
        </div>
        {svg ? <div className="fp-svg" dangerouslySetInnerHTML={{__html: svg}} /> :
          <div style={{padding:'40px', textAlign:'center', opacity:.6}}>Loading site plan…</div>}
      </div>
    );
  }

  /* ─── All Rooms list (a flat searchable index) ─── */
  function RoomsIndex({ go, store, mode }) {
    const [filter, setFilter] = useState('all'); // all | loved | changes | open-decisions
    const [phase, setPhase] = useState('all');

    const openDecisionRoomIds = useMemo(() => {
      const ids = new Set();
      (D.DECISIONS || []).forEach(d => (d.rooms || []).forEach(rid => ids.add(rid)));
      return ids;
    }, []);

    const rooms = D.ROOMS.filter(r => {
      const rs = store.rooms[r.id] || {};
      if (phase !== 'all' && r.phase !== phase) return false;
      if (filter === 'loved') return rs.status === 'love';
      if (filter === 'changes') return rs.status === 'changes';
      if (filter === 'open-decisions') return openDecisionRoomIds.has(r.id);
      return true;
    });

    return (
      <div className="page fade-up">
        <div className="page-inner">
          <div className="page-head">
            <h1>All Rooms</h1>
            <p className="lede">Every room across every building. Filter by what you've touched, by phase, or by what's still open.</p>
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:14, marginBottom:18}}>
            <div className="view-toggle">
              {[['all','All'],['loved','Loved'],['changes','Changes'],['open-decisions','Open Decisions']].map(([id, lbl]) => (
                <button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{lbl}</button>
              ))}
            </div>
            <div className="view-toggle">
              {[['all','All Phases'],['2A','2A'],['2B','2B'],['2C','2C']].map(([id, lbl]) => (
                <button key={id} className={phase===id?'active':''} onClick={()=>setPhase(id)}>{lbl}</button>
              ))}
            </div>
          </div>
          <div className="rooms-grid">
            {rooms.map((r, idx) => {
              const rs = store.rooms[r.id] || {};
              return (
                <button key={r.id} className="room-card fade-up" style={{animationDelay: `${idx*0.02}s`}}
                  data-ancestors={(r.ancestors || []).join(' ')}
                  onClick={() => go({ kind:'room', id: r.id })}>
                  <div className="thumb">
                    {r.images[0] && r.images[0].real ?
                      <img src={r.images[0].src} alt={r.images[0].alt} loading="lazy" /> :
                      r.images[0] ? <div dangerouslySetInnerHTML={{__html: window.placeholderFor(r.images[0], r)}} /> : null}
                  </div>
                  <div className="badges">
                    {r.ancestors.slice(0,3).map(a => (
                      <span key={a} className={`badge dot ${a}`}></span>
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
          {rooms.length === 0 && (
            <div style={{padding:'80px 20px', textAlign:'center', fontStyle:'italic', color:'var(--walnut-faint)'}}>
              Nothing matches that filter yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── Phasing timeline ─── */
  function Phasing({ go, store }) {
    // Build per-phase event lists
    const eventsByPhase = useMemo(() => {
      const out = {};
      D.PHASES.forEach(p => out[p.id] = []);
      D.ROOMS.forEach(r => {
        if (!out[r.phase]) out[r.phase] = [];
        const decs = (D.DECISIONS || []).filter(d => (d.rooms || []).includes(r.id));
        out[r.phase].push({ kind:'room', id: r.id, name: r.name, tag: r.tag, openDecisions: decs.length });
      });
      // Prepend phase-level decision markers (those whose first referenced room sits in this phase)
      (D.DECISIONS || []).forEach(d => {
        const firstRoom = (d.rooms || [])
          .map(rid => D.ROOMS.find(r => r.id === rid))
          .find(Boolean);
        const phaseId = firstRoom ? firstRoom.phase : '2A';
        if (out[phaseId]) {
          out[phaseId].unshift({
            kind:'decision', id: d.id, name: d.title,
            tag: d.priority === 'high' ? 'High priority' : d.priority === 'med' ? 'Medium' : 'Low',
            answered: !!(store.decisions[d.id] && store.decisions[d.id].pick),
          });
        }
      });
      return out;
    }, [store]);

    return (
      <div className="page phasing-page fade-up">
        <div className="page-inner" style={{paddingBottom: 0}}>
          <div className="page-head">
            <h1>The Phasing</h1>
            <p className="lede">Twelve years to build a compound. Three phases, decisions stacked at the front. Scroll across to see how it lands in time.</p>
          </div>
        </div>
        <div className="phase-strip">
          <div className="phase-strip-inner">
            {D.PHASES.map(p => (
              <div key={p.id} className={`phase-col phase-${p.id}`}>
                <div className="phase-col-head">
                  <span className="yrs">{p.years}</span>
                  <h3>Phase {p.id} · {p.name}</h3>
                  <p className="desc">{p.desc}</p>
                </div>
                <div className="phase-col-body">
                  {(eventsByPhase[p.id] || []).map(ev => (
                    <button key={`${ev.kind}-${ev.id}`} className="phase-event"
                      onClick={() => ev.kind === 'room' ? go({ kind:'room', id: ev.id }) : go({ kind:'decisions', focus: ev.id })}>
                      <div className="event-kind">
                        {ev.kind === 'decision'
                          ? (ev.answered ? '◆ Decision · answered' : '◆ Decision · open')
                          : (ev.openDecisions ? `Room · ${ev.openDecisions} open` : 'Room')}
                      </div>
                      <div className="event-title">{ev.name}</div>
                      {ev.tag && <div className="event-desc">{ev.tag}</div>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="phase-col phase-3">
              <div className="phase-col-head">
                <span className="yrs">2040 →</span>
                <h3>Living Phase</h3>
                <p className="desc">The compound continues to settle, layer, and absorb the family. Architecture as ongoing relationship.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Helen's Decisions ─── */
  function Decisions({ go, store, setStore, focus }) {
    const update = (mut) => {
      const next = JSON.parse(JSON.stringify(store));
      mut(next);
      setStore(next);
    };
    const pick = (id, opt) => {
      update(s => {
        s.decisions[id] = { pick: opt, t: Date.now() };
        Store.pushJournal(s, { kind:'decision', text:`${id}: ${opt}` });
      });
    };

    const big = D.DECISIONS || [];
    const micro = D.MICRO_DECISIONS || [];
    const openBig    = big.filter(d => !(store.decisions[d.id] && store.decisions[d.id].pick));
    const answeredBig = big.filter(d =>  (store.decisions[d.id] && store.decisions[d.id].pick));
    const openMicro    = micro.filter(d => !(store.decisions[d.id] && store.decisions[d.id].pick));
    const answeredMicro = micro.filter(d =>  (store.decisions[d.id] && store.decisions[d.id].pick));

    // micro-decisions hidden by default; auto-open if focus matches a micro id
    const focusIsMicro = !!(focus && micro.find(d => d.id === focus));
    const [showMicro, setShowMicro] = useState(focusIsMicro);

    // Scroll-to-focus once on mount or when focus changes
    useEffect(() => {
      if (!focus) return;
      const isMicro = !!micro.find(d => d.id === focus);
      if (isMicro) setShowMicro(true);
      // wait a beat for collapse animation
      const t = setTimeout(() => {
        const el = document.getElementById(`decision-${focus}`);
        if (el) {
          // scroll within the .page scroll container
          const page = el.closest('.page');
          if (page) {
            const rect = el.getBoundingClientRect();
            const pageRect = page.getBoundingClientRect();
            page.scrollTop += (rect.top - pageRect.top) - 80;
          }
          el.classList.add('decision-flash');
          setTimeout(() => el.classList.remove('decision-flash'), 1600);
        }
      }, isMicro ? 250 : 50);
      return () => clearTimeout(t);
    }, [focus]);

    return (
      <div className="page fade-up">
        <div className="page-inner">
          <div className="page-head">
            <h1>Helen's Decisions</h1>
            <p className="lede">
              Open invitations, not a task list. Pick what feels right — you can always change your mind.
              Each pick lands in your notes journal, and Jon and the architects will see it next time we sync.
            </p>
          </div>

          {openBig.length > 0 && (
            <>
              <div className="hr-orn" style={{margin:'8px 0 14px'}}><span>Big decisions · {openBig.length} open</span></div>
              <div className="decision-list">
                {openBig.map(d => (
                  <DecisionCard key={d.id} d={d} pick={pick} go={go} store={store} answered={false} />
                ))}
              </div>
            </>
          )}

          {answeredBig.length > 0 && (
            <>
              <div className="hr-orn" style={{margin:'32px 0 14px'}}><span>Big decisions · {answeredBig.length} answered</span></div>
              <div className="decision-list">
                {answeredBig.map(d => (
                  <DecisionCard key={d.id} d={d} pick={pick} go={go} store={store} answered={true} />
                ))}
              </div>
            </>
          )}

          {(openMicro.length + answeredMicro.length) > 0 && (
            <div className="micro-decisions" style={{marginTop: 40}}>
              <button className="micro-toggle" onClick={() => setShowMicro(s => !s)} aria-expanded={showMicro}>
                <span className="mt-chev">{showMicro ? '▾' : '▸'}</span>
                <span className="mt-label">Smaller decisions on the calendar</span>
                <span className="mt-count">· {openMicro.length} open · {answeredMicro.length} answered</span>
              </button>
              <p className="micro-help">
                These are the small turns — order-of-operations, finish confirmations, expert hand-offs. Mostly the architects, the conservator, or Jon are driving. Surfaced here so you can see them, weigh in if you want, or just nod.
              </p>
              {showMicro && (
                <div className="decision-list micro-list">
                  {[...openMicro, ...answeredMicro].map(d => {
                    const ans = !!(store.decisions[d.id] && store.decisions[d.id].pick);
                    return <MicroDecisionCard key={d.id} d={d} ans={ans} pick={pick} go={go} store={store} />;
                  })}
                </div>
              )}
            </div>
          )}

          {(big.length + micro.length) === 0 && (
            <div style={{padding:'60px 20px', textAlign:'center', fontStyle:'italic', color:'var(--walnut-faint)'}}>
              No pending decisions right now. We'll let you know.
            </div>
          )}
        </div>
      </div>
    );
  }

  function MicroDecisionCard({ d, ans, pick, go, store }) {
    const cur = store.decisions[d.id] && store.decisions[d.id].pick;
    return (
      <div className={`micro-card ${ans ? 'answered' : ''}`} id={`decision-${d.id}`}>
        <div className="mc-head">
          <div className="mc-when">{d.when}</div>
          <h3 className="mc-title">{d.title}</h3>
          <div className="mc-defer">→ {d.defer}</div>
        </div>
        <p className="mc-body">{d.body_helen || d.body}</p>
        <div className="mc-actions">
          <button
            className={`mc-btn ${cur === 'noted' ? 'on' : ''}`}
            onClick={() => pick(d.id, cur === 'noted' ? null : 'noted')}>
            {cur === 'noted' ? '✓ Noted' : 'Note that I\'ve seen it'}
          </button>
          <button
            className={`mc-btn ${cur === 'comment' ? 'on' : ''}`}
            onClick={() => pick(d.id, 'comment')}>
            I want to weigh in
          </button>
        </div>
      </div>
    );
  }


  function DecisionCard({ d, pick, go, store, answered }) {
    const cur = store.decisions[d.id] && store.decisions[d.id].pick;
    const PRI = { high:'High priority', med:'Medium', low:'Low' };
    return (
      <div className={`invitation ${answered ? 'answered':''}`} id={`decision-${d.id}`}>
        <div className="heading">
          {d.brief ? `${d.brief}` : 'Decision'}
          {d.priority && ` · ${PRI[d.priority] || d.priority}`}
        </div>
        <h2>{d.title}</h2>
        {d.body && <p className="ask">{d.body}</p>}
        {d.options && (
          <div className="opt-row">
            {d.options.map(opt => (
              <button key={opt} className={cur === opt ? 'helen-pick' : ''} onClick={() => pick(d.id, opt)}>
                {opt}
              </button>
            ))}
            {d.options.length >= 2 && (
              <button className="opt-compare"
                onClick={() => window.__hceOpenCompare && window.__hceOpenCompare(d.id)}
                title="See the options side-by-side">
                ⇆ Compare side-by-side
              </button>
            )}
          </div>
        )}
        <div className="ref-link">
          {(d.rooms || []).map(rid => {
            const r = D.ROOMS.find(x => x.id === rid);
            return r ? <a key={rid} onClick={() => go({ kind:'room', id: rid })}>{r.name} →</a> : null;
          })}
          {answered && cur && <span style={{color:'var(--cobalt)', fontWeight:600}}>You picked: {cur}</span>}
        </div>
      </div>
    );
  }

  /* ─── Notes journal ─── */
  function Journal({ go, store }) {
    // Compose entries from journal[] and (fallback) per-room notes
    const entries = useMemo(() => {
      const list = [...(store.journal || [])];
      // include notes that pre-date journal tracking
      Object.entries(store.rooms || {}).forEach(([roomId, rs]) => {
        (rs.notes || []).forEach(n => {
          if (!list.find(j => j.kind === (n.kind === 'pin' ? 'pin' : 'note') && j.text === n.text && Math.abs(j.t - n.t) < 1000)) {
            list.push({ id:'jl_'+n.id, t: n.t, roomId, kind: n.kind === 'pin' ? 'pin' : 'note', text: n.text });
          }
        });
      });
      list.sort((a,b) => b.t - a.t);
      return list;
    }, [store]);

    // Group by day
    const days = {};
    entries.forEach(e => {
      const d = new Date(e.t);
      const k = d.toDateString();
      if (!days[k]) days[k] = [];
      days[k].push(e);
    });

    const roomName = (id) => {
      const r = D.ROOMS.find(x => x.id === id);
      return r ? r.name : id;
    };

    return (
      <div className="page fade-up">
        <div className="page-inner">
          <div className="page-head">
            <h1>My Notes</h1>
            <p className="lede">Everything you've said, in order. Tap a line to revisit the room.</p>
          </div>
          {Object.keys(days).length === 0 ? (
            <div className="journal-empty">
              Nothing here yet. Wander into a room and react, pin a thought, or leave a note.
            </div>
          ) : Object.entries(days).map(([day, list]) => (
            <div key={day} className="journal-day">
              <div className="day-head">{day}</div>
              {list.map(e => (
                <div key={e.id} className="journal-entry"
                  onClick={() => e.roomId ? go({ kind:'room', id: e.roomId }) : go({ kind:'decisions' })}>
                  <div className="when">
                    {new Date(e.t).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}
                    {e.roomId && <div className="who-where">{roomName(e.roomId)}</div>}
                  </div>
                  <div>
                    <div className="what">{e.text}</div>
                    <div className="what-meta">{kindLabel(e.kind)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  function kindLabel(k) {
    switch(k) {
      case 'pin': return 'Image pin';
      case 'note': return 'Note';
      case 'react': return 'Quick react';
      case 'spec': return 'Spec reaction';
      case 'decision': return 'Decision';
      default: return 'Note';
    }
  }

  /* ─── Ancestors ─── */
  function Ancestors({ go, lensAncestor, setLensAncestor }) {
    const counts = useMemo(() => {
      const c = {};
      D.ROOMS.forEach(r => {
        r.ancestors.forEach(a => { c[a] = (c[a] || 0) + 1; });
      });
      return c;
    }, []);

    const ANC_NOTE = {
      glebe: 'Marston St. Lawrence, Northants. Georgian columns, sash windows, Palladian symmetry. The architecture of permanence — what we ask for when we want a house to feel earned.',
      ptown: "Provincetown, Cape Cod. White-painted everything, rattan and indigo, art on every wall. The casual coastal soul Helen brings — and where the boundary between inside and outside has always been generous.",
      texas: 'Bandera County, forty acres on a canyon edge. Limestone, live oaks, the way light moves at sundown. The site itself, treated as material.',
      miss: "Mississippi. Helen's grandmother Cornelia kept things alive in greenhouses for sixty years. Appears in this compound exactly once — through a tall arched window, terra cotta and basil and tomatoes — at the edge of the Motor Barn.",
    };

    const onCardClick = (ancestorId) => {
      if (setLensAncestor) {
        // Toggle: clicking the same one again clears
        if (lensAncestor === ancestorId) {
          setLensAncestor(null);
        } else {
          setLensAncestor(ancestorId);
          // Take them to the compound so they can see the lens working
          go({ kind:'home' });
        }
      } else {
        go({ kind:'rooms', filter:`ancestor:${ancestorId}` });
      }
    };

    return (
      <div className="page fade-up">
        <div className="page-inner">
          <div className="page-head">
            <h1>The Ancestors</h1>
            <p className="lede">Three places (plus one quiet fourth) the compound pulls from. Each leads in some rooms; each plays a supporting role in others. The discipline is the balance.</p>
            <p className="lede" style={{marginTop:8, fontSize:'0.95rem', opacity:0.78}}>
              <em>Click an ancestor to follow its thread through the compound — buildings and rooms that draw from it will lift; the rest will quiet down.</em>
            </p>
          </div>
          <div className="ancestor-grid">
            {Object.values(D.ANCESTORS).map(a => {
              const isActive = lensAncestor === a.id;
              return (
                <div key={a.id}
                  className={`ancestor-card ${a.id}${isActive ? ' is-lens-active' : ''}`}
                  onClick={() => onCardClick(a.id)}>
                  <div className="place">{a.place}</div>
                  <h3>{a.name}</h3>
                  <p className="desc">{ANC_NOTE[a.id] || a.desc}</p>
                  <div className="room-count">
                    {counts[a.id] || 0} rooms touched
                    {isActive && <span className="lens-active-tag"> · following</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     HELEN'S WALL — pinboard of loved/saved images
     ───────────────────────────────────────────────────────────── */
  function HelenWall({ go, store, setStore }) {
    const items = useMemo(() => {
      const wall = (store.wall || []).slice();
      // Auto-include loved rooms (their hero image) if not already saved
      const lovedExtras = [];
      Object.entries(store.rooms || {}).forEach(([rid, rs]) => {
        if (rs.status === 'love') {
          const r = D.ROOMS.find(x => x.id === rid);
          if (!r || !r.images || !r.images.length) return;
          const slug = r.images[0].slug;
          if (!wall.some(w => w.roomId === rid && w.imgSlug === slug)) {
            lovedExtras.push({ roomId: rid, imgSlug: slug, t: 0, auto:true });
          }
        }
      });
      return [...wall, ...lovedExtras]
        .map(w => {
          const r = D.ROOMS.find(x => x.id === w.roomId);
          if (!r) return null;
          const img = r.images.find(i => i.slug === w.imgSlug) || r.images[0];
          if (!img) return null;
          return { ...w, room: r, image: img };
        })
        .filter(Boolean);
    }, [store]);

    const remove = (entry) => {
      if (entry.auto) {
        // Toggle off love
        const next = JSON.parse(JSON.stringify(store));
        const rr = (next.rooms[entry.roomId] = next.rooms[entry.roomId] || { status:null, mood:[], notes:[], pins:[], specs:{} });
        rr.status = null;
        setStore(next);
      } else {
        const next = JSON.parse(JSON.stringify(store));
        next.wall = (next.wall || []).filter(w => !(w.roomId === entry.roomId && w.imgSlug === entry.imgSlug));
        setStore(next);
      }
    };

    return (
      <div className="page wall-page fade-up">
        <div className="page-inner">
          <header className="page-head">
            <h1>The Wall</h1>
            <p className="lede">A pinboard of the rooms and images that have stuck. Photos you've loved, saved, or pinned a thought to. Move things around. Take things down. This is yours.</p>
          </header>

          {items.length === 0 ? (
            <div className="wall-empty">
              <p>Nothing on the wall yet.</p>
              <p>Walk through the compound. Tap the heart on rooms that feel right; tap the bookmark on photos you keep coming back to. They'll gather here.</p>
            </div>
          ) : (
            <div className="wall-grid">
              {items.map((entry, i) => {
                const offset = (i * 7) % 6 - 3; // -3..+2 deg jitter
                const w = window.HCERoomViews;
                return (
                  <figure key={`${entry.roomId}-${entry.imgSlug}`} className={`wall-card ${entry.auto ? 'auto' : ''}`}
                    style={{ transform: `rotate(${offset}deg)` }}>
                    <button className="wall-card-img" onClick={() => go({ kind:'room', id: entry.roomId })}>
                      <w.LookbookImage image={entry.image} room={entry.room} />
                    </button>
                    <figcaption>
                      <div className="wall-room">{entry.room.name}</div>
                      <div className="wall-cap">{entry.image.caption || entry.image.alt}</div>
                      {entry.auto && <span className="wall-auto-tag">♥ loved</span>}
                    </figcaption>
                    <button className="wall-remove" onClick={() => remove(entry)} title="Remove">×</button>
                  </figure>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return { CompoundHome, RoomsIndex, Phasing, Decisions, Journal, Ancestors, HelenWall };
})();
