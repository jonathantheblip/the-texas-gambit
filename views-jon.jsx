/* Hill Country Estate — Jon-mode views (Digest, Working Set) */

window.HCEJonViews = (function(){
  const { useMemo } = React;
  const D = window.HCE;

  /* ─────────────────────────────────────────────────────────────
     The Helen Digest — a real document, not a feed
     ───────────────────────────────────────────────────────────── */
  function HelenDigest({ go, store }) {
    const data = useMemo(() => analyzeStore(store), [store]);

    const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    const totalReactions = data.lovedRooms.length + data.changeRooms.length + data.uncertainRooms.length
      + data.specLocks.length + data.specAsks.length + data.notesCount;

    return (
      <div className="page jon-digest fade-up">
        <div className="page-inner">
          <header className="digest-masthead">
            <div className="digest-meta">
              <span className="run">Memo · No. {data.runNumber}</span>
              <span className="date">{today}</span>
            </div>
            <h1>Helen on the Compound</h1>
            <p className="dek">Where her instincts have settled, where they're still moving, and what to read into the silences. Synthesized from {totalReactions || '—'} interactions across {data.touchedRoomsCount} rooms.</p>
          </header>

          {totalReactions === 0 ? (
            <div className="digest-empty">
              <p>Helen hasn't reacted to anything yet. Open the companion in Helen mode, walk her through a few rooms, and this page will fill in.</p>
            </div>
          ) : (
            <div className="digest-grid">
              {/* CONFIDENCE COLUMN */}
              <section className="digest-col confidence">
                <div className="col-head">
                  <span className="col-mark">◉</span>
                  <h2>Confidence</h2>
                  <p className="col-sub">She's said yes. Build it.</p>
                </div>

                {data.lovedRooms.length > 0 && (
                  <div className="digest-block">
                    <div className="block-label">Rooms · loved</div>
                    {data.lovedRooms.map(r => (
                      <button key={r.id} className="digest-row" onClick={() => go({ kind:'room', id: r.id })}>
                        <span className="row-name">{r.name}</span>
                        <span className="row-tag">{r.tag}</span>
                      </button>
                    ))}
                  </div>
                )}

                {data.specLocks.length > 0 && (
                  <div className="digest-block">
                    <div className="block-label">Specs · locked</div>
                    {data.specLocks.map(s => (
                      <button key={s.id} className="digest-row" onClick={() => go({ kind:'room', id: s.roomId })}>
                        <span className="row-name">{s.k}</span>
                        <span className="row-where">{s.roomName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {data.decidedDecisions.length > 0 && (
                  <div className="digest-block">
                    <div className="block-label">Decisions · answered</div>
                    {data.decidedDecisions.map(d => (
                      <div key={d.id} className="digest-row decision">
                        <span className="row-name">{d.title}</span>
                        <span className="row-pick">→ {d.pick}</span>
                      </div>
                    ))}
                  </div>
                )}

                {data.lovedRooms.length === 0 && data.specLocks.length === 0 && data.decidedDecisions.length === 0 && (
                  <p className="col-empty">Nothing yet. Early days.</p>
                )}
              </section>

              {/* DRIFT COLUMN */}
              <section className="digest-col drift">
                <div className="col-head">
                  <span className="col-mark">◌</span>
                  <h2>Drift</h2>
                  <p className="col-sub">Still wobbling. Don't lock yet.</p>
                </div>

                {data.changeRooms.length > 0 && (
                  <div className="digest-block">
                    <div className="block-label">Rooms · different direction</div>
                    {data.changeRooms.map(r => (
                      <button key={r.id} className="digest-row" onClick={() => go({ kind:'room', id: r.id })}>
                        <span className="row-name">{r.name}</span>
                        <span className="row-tag">{r.tag}</span>
                      </button>
                    ))}
                  </div>
                )}

                {data.uncertainRooms.length > 0 && (
                  <div className="digest-block">
                    <div className="block-label">Rooms · "not sure" / "let's talk"</div>
                    {data.uncertainRooms.map(r => (
                      <button key={r.id} className="digest-row" onClick={() => go({ kind:'room', id: r.id })}>
                        <span className="row-name">{r.name}</span>
                        <span className="row-mood">{r.moods.join(' · ')}</span>
                      </button>
                    ))}
                  </div>
                )}

                {data.specAsks.length > 0 && (
                  <div className="digest-block">
                    <div className="block-label">Specs · she's asking</div>
                    {data.specAsks.map(s => (
                      <button key={s.id} className="digest-row" onClick={() => go({ kind:'room', id: s.roomId })}>
                        <span className="row-name">{s.k}</span>
                        <span className="row-where">{s.roomName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {data.openDecisionsCount > 0 && (
                  <div className="digest-block">
                    <div className="block-label">Decisions · {data.openDecisionsCount} open</div>
                    <button className="digest-row" onClick={() => go({ kind:'decisions' })}>
                      <span className="row-name">See open invitations →</span>
                    </button>
                  </div>
                )}

                {data.changeRooms.length === 0 && data.uncertainRooms.length === 0 && data.specAsks.length === 0 && (
                  <p className="col-empty">She hasn't raised concerns. (That's not the same as "all clear.")</p>
                )}
              </section>
            </div>
          )}

          {/* CONFLICTS */}
          {data.conflicts.length > 0 && (
            <section className="digest-conflicts">
              <div className="col-head">
                <span className="col-mark conflict">⚠</span>
                <h2>Conflicts</h2>
                <p className="col-sub">Where her reaction contradicts the locked spec. Resolve before DD.</p>
              </div>
              {data.conflicts.map((c, i) => (
                <button key={i} className="conflict-row" onClick={() => go({ kind:'room', id: c.roomId })}>
                  <div className="conflict-where">{c.roomName} · {c.k}</div>
                  <div className="conflict-vs">
                    <div><span className="lbl">Locked</span> {c.locked}</div>
                    <div><span className="lbl helen">Helen</span> {c.reaction}</div>
                  </div>
                </button>
              ))}
            </section>
          )}

          {/* PULL QUOTES */}
          {data.pullQuotes.length > 0 && (
            <section className="digest-quotes">
              <div className="col-head">
                <span className="col-mark">"</span>
                <h2>In Her Own Words</h2>
                <p className="col-sub">Five most recent notes, verbatim.</p>
              </div>
              {data.pullQuotes.map(q => (
                <button key={q.id} className="pull-quote" onClick={() => q.roomId ? go({ kind:'room', id: q.roomId }) : null}>
                  <blockquote>{q.text}</blockquote>
                  <cite>— {q.where} · {new Date(q.t).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</cite>
                </button>
              ))}
            </section>
          )}

          {/* SILENCES */}
          {data.silentBuildings.length > 0 && (
            <section className="digest-silences">
              <div className="col-head">
                <span className="col-mark">·</span>
                <h2>Silences</h2>
                <p className="col-sub">Where she's been quiet. Could be assent. Could be unread.</p>
              </div>
              <div className="silence-grid">
                {data.silentBuildings.map(b => (
                  <button key={b.id} className="silence-row" onClick={() => go({ kind:'building', id: b.id })}>
                    <span className="row-name">{b.name}</span>
                    <span className="row-where">{b.untouched} of {b.total} rooms · no reaction</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <footer className="digest-foot">
            <div>Hill Country Compound · Companion build {data.runNumber}</div>
            <div>DiBello · Imber · Sundt</div>
          </footer>
        </div>
      </div>
    );
  }

  /* ─── analysis ─── */
  function analyzeStore(store) {
    const rooms = store.rooms || {};
    const decisions = store.decisions || {};
    const journal = store.journal || [];

    const lovedRooms = [];
    const changeRooms = [];
    const uncertainRooms = []; // "not sure" / "let's talk"
    const specLocks = [];
    const specAsks = [];
    const conflicts = [];
    const touchedRoomIds = new Set();

    Object.entries(rooms).forEach(([rid, rs]) => {
      const r = D.ROOMS.find(x => x.id === rid);
      if (!r) return;
      const hasAny = rs.status || (rs.mood && rs.mood.length) ||
        (rs.notes && rs.notes.length) || (rs.pins && rs.pins.length) ||
        (rs.specs && Object.values(rs.specs).some(Boolean));
      if (hasAny) touchedRoomIds.add(rid);

      if (rs.status === 'love') lovedRooms.push(r);
      if (rs.status === 'changes') changeRooms.push(r);
      if (rs.mood && rs.mood.length) {
        const wobbly = rs.mood.filter(m => ["Not sure","Let's talk"].includes(m));
        if (wobbly.length) uncertainRooms.push({ ...r, moods: rs.mood });
      }
      // Specs
      Object.entries(rs.specs || {}).forEach(([k, v]) => {
        if (!v) return;
        const spec = (r.specs || []).find(s => s.k === k);
        const entry = { id: rid+':'+k, k, roomId: rid, roomName: r.name, value: spec && spec.v };
        if (v === 'lock') specLocks.push(entry);
        if (v === 'ask') specAsks.push(entry);
        // Conflict: Helen says "ask" on a spec marked as a global lock
        if (v === 'ask' && spec) {
          const isGloballyLocked = (D.LOCKED_SPECS || []).some(ls =>
            ls.value === spec.v || ls.item.toLowerCase().includes(spec.k.toLowerCase().split(' ')[0])
          );
          if (isGloballyLocked) {
            conflicts.push({
              roomId: rid, roomName: r.name, k,
              locked: spec.v,
              reaction: 'Helen flagged "Ask"',
            });
          }
        }
      });
      // Conflict: room marked Changes + has locked specs
      if (rs.status === 'changes' && r.specs) {
        // Pull a representative spec
        const spec = r.specs.find(s => /^(Walls|Floor|Door|Stair|Bay|Roof|Range)/.test(s.k));
        if (spec) {
          const exists = conflicts.find(c => c.roomId === rid && c.k === spec.k);
          if (!exists) conflicts.push({
            roomId: rid, roomName: r.name, k: 'Room direction',
            locked: spec.v,
            reaction: 'Helen wants a different direction',
          });
        }
      }
    });

    const decidedDecisions = (D.DECISIONS || [])
      .filter(d => decisions[d.id] && decisions[d.id].pick)
      .map(d => ({ ...d, pick: decisions[d.id].pick }));
    const openDecisionsCount = (D.DECISIONS || []).length - decidedDecisions.length;

    // Pull quotes — five most recent text notes
    const pullQuotes = [];
    Object.entries(rooms).forEach(([rid, rs]) => {
      const r = D.ROOMS.find(x => x.id === rid);
      (rs.notes || []).forEach(n => {
        if ((n.kind === 'text' || n.kind === 'pin') && n.text && n.text.length > 8) {
          pullQuotes.push({ id: n.id, text: n.text, t: n.t, where: r ? r.name : 'General', roomId: rid });
        }
      });
    });
    pullQuotes.sort((a,b) => b.t - a.t);
    const pullQuotesTop = pullQuotes.slice(0, 5);

    // Silences — buildings where ≥3 rooms are untouched
    const silentBuildings = [];
    D.BUILDINGS.filter(b => b.id !== 'compound' && b.id !== 'covered-walkway' && b.id !== 'grape-pergola').forEach(b => {
      const bRooms = D.ROOMS.filter(r => r.building === b.id);
      if (bRooms.length === 0) return;
      const untouched = bRooms.filter(r => !touchedRoomIds.has(r.id)).length;
      if (untouched >= Math.max(3, Math.ceil(bRooms.length * 0.7))) {
        silentBuildings.push({ id: b.id, name: b.name, untouched, total: bRooms.length });
      }
    });

    // A "run number" — counts journal entries / 10, just to feel like a memo
    const runNumber = String(Math.max(1, Math.floor(journal.length / 10) + 1)).padStart(3, '0');

    return {
      lovedRooms, changeRooms, uncertainRooms,
      specLocks, specAsks, conflicts,
      decidedDecisions, openDecisionsCount,
      pullQuotes: pullQuotesTop,
      silentBuildings,
      touchedRoomsCount: touchedRoomIds.size,
      notesCount: pullQuotes.length,
      runNumber,
    };
  }

  /* ─────────────────────────────────────────────────────────────
     The Working Set — Jon's home view (drawing-tab metaphor)
     ───────────────────────────────────────────────────────────── */
  const TABS = [
    { sheet:'A0.0', title:'Site Plan',         to:{ kind:'home', view:'plan' }, phase:'·' },
    { sheet:'A1.0', title:'Main Block',        to:{ kind:'building', id:'main-block' }, phase:'2A' },
    { sheet:'A2.0', title:'Service Wing',      to:{ kind:'building', id:'service-wing' }, phase:'2B' },
    { sheet:'A2.1', title:'Wharf Wing',        to:{ kind:'building', id:'wharf-wing' }, phase:'2B' },
    { sheet:'A2.2', title:'Pool Terrace',      to:{ kind:'building', id:'pool' }, phase:'2B' },
    { sheet:'A3.0', title:'Motor Barn',        to:{ kind:'building', id:'motor-barn' }, phase:'2C' },
    { sheet:'A3.1', title:'Pavilion',          to:{ kind:'building', id:'pavilion' }, phase:'2C' },
    { sheet:'A3.2', title:'Observatory',       to:{ kind:'building', id:'observatory' }, phase:'2C' },
    { sheet:'D0.0', title:'Decisions',         to:{ kind:'decisions' }, phase:'·' },
    { sheet:'D1.0', title:'Locked Specs',      to:{ kind:'specs' }, phase:'·' },
    { sheet:'M0.0', title:'Helen Digest',      to:{ kind:'digest' }, phase:'·' },
  ];

  function WorkingSet({ go, store }) {
    const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    const data = useMemo(() => analyzeStore(store), [store]);
    const decisionsOpen = (D.DECISIONS || []).length - data.decidedDecisions.length;

    // Phase-aware urgency calc — fake but plausible
    const targetDate = 'AUG 2026';
    const daysToLock = Math.max(0, Math.floor((new Date('2026-08-01') - new Date()) / (1000*60*60*24)));

    return (
      <div className="page working-set fade-up">
        <div className="page-inner">
          <header className="ws-titleblock">
            <div>
              <div className="ws-mini">Hill Country Compound · 40 acres · Bandera County</div>
              <h1>Working Set</h1>
              <div className="ws-mini">DiBello AOR · Imber Design · Sundt CM/GC · Construction window 2033 → 2040</div>
            </div>
            <div className="ws-stamp">
              <div className="stamp-row"><span className="lbl">Issued</span> <span>{today}</span></div>
              <div className="stamp-row"><span className="lbl">Phase</span> <span>SD → DD</span></div>
              <div className="stamp-row"><span className="lbl">Mode</span> <span>Companion · Jon</span></div>
            </div>
          </header>

          <div className="ws-pressure">
            <div className="pressure-num">{decisionsOpen}</div>
            <div>
              <div className="pressure-line">decisions to lock by <strong>{targetDate}</strong></div>
              <div className="pressure-sub">{daysToLock} days · {data.openDecisionsCount > 0 ? 'critical path' : 'on track'}</div>
            </div>
            <button className="btn-primary" onClick={() => go({ kind:'decisions' })}>Open Decisions →</button>
          </div>

          <div className="ws-sheets">
            {TABS.map(t => {
              const isBldg = t.to.kind === 'building';
              const b = isBldg ? D.BUILDINGS.find(x => x.id === t.to.id) : null;
              const phaseRooms = isBldg ? D.ROOMS.filter(r => r.building === t.to.id) : null;
              return (
                <button key={t.sheet} className={`ws-sheet phase-${t.phase}`}
                  onClick={() => go(t.to)}>
                  <div className="sheet-tab">
                    <span className="sheet-no">{t.sheet}</span>
                    <span className="sheet-phase">{t.phase}</span>
                  </div>
                  <div className="sheet-title">{t.title}</div>
                  {isBldg && phaseRooms && (
                    <div className="sheet-meta">
                      {phaseRooms.length} rooms
                      {b && b.plans && ` · ${b.plans.length} sht`}
                    </div>
                  )}
                  {t.to.kind === 'decisions' && (
                    <div className="sheet-meta">{decisionsOpen} open · {data.decidedDecisions.length} answered</div>
                  )}
                  {t.to.kind === 'digest' && (
                    <div className="sheet-meta">{data.touchedRoomsCount} touched · {data.conflicts.length} conflicts</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     Locked Specs — D1.0 sheet
     ───────────────────────────────────────────────────────────── */
  function LockedSpecs({ go }) {
    const grouped = useMemo(() => {
      const g = {};
      (D.LOCKED_SPECS || []).forEach(s => {
        if (!g[s.ref]) g[s.ref] = [];
        g[s.ref].push(s);
      });
      return g;
    }, []);

    return (
      <div className="page locked-specs fade-up">
        <div className="page-inner">
          <header className="ws-titleblock">
            <div>
              <div className="ws-mini">Sheet D1.0 · Project Register</div>
              <h1>Locked Specs</h1>
              <div className="ws-mini">{(D.LOCKED_SPECS || []).length} entries · authoritative · do not deviate</div>
            </div>
          </header>

          {Object.entries(grouped).map(([ref, specs]) => {
            // Match ref to a brief id (Imber/Dibello → imber)
            const briefKey = ref.toLowerCase().split('/')[0];
            const brief = (D.BRIEFS || []).find(b => b.id === briefKey);
            return (
            <section key={ref} className="spec-group">
              <h3 className="spec-group-head">
                {ref}
                {brief && (
                  <span className="brief-excerpt">
                    <span className="be-trigger">ⓘ</span>
                    <span className="be-tooltip">
                      <span className="be-title">{brief.title}</span>
                      <span className="be-who">{brief.who}</span>
                      <span className="be-pull">{brief.pull}</span>
                      <span className="be-summary">{brief.summary}</span>
                    </span>
                  </span>
                )}
              </h3>
              <table className="spec-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Locked Value</th>
                    <th>Ancestor</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.map((s, i) => (
                    <tr key={i}>
                      <td className="item">{s.item}</td>
                      <td className="value">{s.value}</td>
                      <td className="ancestor"><span className={`anc-pill ${s.ancestor}`}>{D.ANCESTORS[s.ancestor].name}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            );
          })}
        </div>
      </div>
    );
  }

  return { HelenDigest, WorkingSet, LockedSpecs, analyzeStore };
})();
