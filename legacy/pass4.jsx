// Pass 4 — The Plan (mode-aware)
//   Helen mode → <HelenPlan/>: savings cadence + gentle gates, no scary totals.
//   Jon mode   → <JonPlan/>: full v6 financial truth, gates with triggers/recovery.
//   <ThePlan/> dispatches based on body[data-mode].
// + <RoomTechReveal/> for room detail technical layer.
// Globals available: React, ReactDOM, window.HCE
(function(){
  const { useState, useMemo, useEffect, useRef } = React;
  const D = window.HCE;

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  function useMode() {
    const [mode, setMode] = useState(document.body.getAttribute('data-mode') || 'helen');
    useEffect(() => {
      const m = new MutationObserver(() => setMode(document.body.getAttribute('data-mode') || 'helen'));
      m.observe(document.body, { attributes: true, attributeFilter: ['data-mode'] });
      return () => m.disconnect();
    }, []);
    return mode;
  }

  // Pre-compute v6 phase totals (locked in plan, used by Jon view)
  const PHASE_TOTALS = [
    { id:'p0',  label:'Phase 0',  desc:'Land, well, WME, geotech',           years:'2030–2032', total:939500 },
    { id:'p1',  label:'Phase 1',  desc:'Architecture & engineering',         years:'2032–2033', total:228000 },
    { id:'p2a', label:'Phase 2A', desc:'Main Block, site, IBHS, V2G, water', years:'2033–2035', total:2979300 },
    { id:'p2b', label:'Phase 2B', desc:'Wings, pool, orangery, pergola',     years:'2035–2037', total:863500 },
    { id:'p2c', label:'Phase 2C', desc:'Motor barn, observatory, solar',     years:'2037–2040', total:619500 },
    { id:'p3',  label:'Phase 3',  desc:'Furnishing, art, human layer',       years:'2035–2045', total:226500 },
  ];
  const GRAND_TOTAL = PHASE_TOTALS.reduce((a,b) => a + b.total, 0);
  const fmtMoney = n => n >= 1_000_000 ? '$' + (n/1_000_000).toFixed(2).replace(/\.?0+$/,'') + 'M' : '$' + Math.round(n/1000) + 'K';

  // ─────────────────────────────────────────────────────────────
  // <ThePlan/> — dispatcher
  // ─────────────────────────────────────────────────────────────
  function ThePlan(props) {
    const mode = useMode();
    return mode === 'jon' ? <JonPlan {...props}/> : <HelenPlan {...props}/>;
  }

  // ─────────────────────────────────────────────────────────────
  // <HelenPlan/> — savings cadence, gentle gates
  // ─────────────────────────────────────────────────────────────
  function HelenPlan({ go, store, setStore }) {
    const [openYear, setOpenYear] = useState(null);
    const [openGate, setOpenGate] = useState(null);

    // Bucket by helenEra
    const eras = [];
    D.TIMELINE.forEach(y => {
      const last = eras[eras.length - 1];
      if (last && last.era === y.helenEra) last.years.push(y);
      else eras.push({ era: y.helenEra, years: [y] });
    });

    const bigYear = D.TIMELINE.find(y => y.era.includes('Phase 2A · Main Block'))?.year || 2033;
    const moveIn  = 2035;

    return (
      <div className="page hp-shell fade-up">
        <div className="page-inner">
          <div className="hp-page">
            <header className="hp-proem">
              <div className="hp-eyebrow">THE PLAN · WHAT WE&rsquo;RE PUTTING AWAY EACH YEAR</div>
              <h1 className="hp-title">Fourteen years, one shovel-load at a time.</h1>
              <p className="hp-lede">
                Most of these years are quiet. We save. We watch the land. We collect Freddy&rsquo;s photographs and one
                piece of art a year. The construction loan does the heavy lifting when the building actually starts in <b>{bigYear}</b>,
                and we move in by <b>{moveIn}</b>. There are <b>five points</b> along the way where it is genuinely
                ok to slow down or change shape — they are not failures, they are part of the plan.
              </p>

              <div className="hp-summary-grid">
                <div className="hp-sg-cell">
                  <div className="hp-sg-num">$1–4K</div>
                  <div className="hp-sg-lbl">Per month, most years</div>
                </div>
                <div className="hp-sg-cell">
                  <div className="hp-sg-num">5</div>
                  <div className="hp-sg-lbl">Off-ramps along the way</div>
                </div>
                <div className="hp-sg-cell">
                  <div className="hp-sg-num">{moveIn}</div>
                  <div className="hp-sg-lbl">Move-in year</div>
                </div>
              </div>

              <div className="hp-friction">
                <span className="hp-glyph">⌘</span>
                <span>
                  Click any year to see what it&rsquo;s for. Click any gate to see what we&rsquo;d give up — and what stays no matter what.
                </span>
              </div>
            </header>

            {/* ERAS */}
            {eras.map((e, ei) => (
              <section key={ei} className="hp-era">
                <div className="hp-era-head">
                  <h2 className="hp-era-title">{e.era}</h2>
                  <span className="hp-era-span">{e.years[0].year}{e.years.length > 1 ? ` – ${e.years[e.years.length-1].year}` : ''}</span>
                </div>
                <ol className="hp-rows">
                  {e.years.map(y => {
                    const open = openYear === y.year;
                    const gate = y.gate ? D.GATES[y.gate] : null;
                    const fillW = (D.SAVE_BANDS[y.save.band] || 0.2) * 100;
                    return (
                      <li key={y.year} className={'hp-row ' + (open ? 'open' : '') + (gate ? ' has-gate' : '')}>
                        <button className="hp-row-head" onClick={() => setOpenYear(open ? null : y.year)}>
                          <div className="hp-year-col">
                            <div className="hp-year">{y.year}</div>
                          </div>
                          <div className="hp-mid-col">
                            <div className="hp-headline">{y.headline}</div>
                            <div className="hp-saving">
                              <div className="hp-saving-bar"><div className="hp-saving-fill" style={{width: fillW + '%'}}></div></div>
                              <div className="hp-saving-text">
                                <span className="hp-saving-amt">{y.save.monthly}</span>
                                <span className="hp-saving-purpose">— {y.save.purpose}</span>
                              </div>
                            </div>
                          </div>
                          <div className="hp-right-col">
                            {gate ? <span className="hp-gate-pill">PAUSE POINT</span> : <span className="hp-chev">{open ? '▾' : '▸'}</span>}
                          </div>
                        </button>

                        {open && (
                          <div className="hp-row-body">
                            <p className="hp-summary">{y.summary}</p>

                            <div className="hp-stat-row">
                              <div className="hp-stat">
                                <div className="hp-stat-lbl">What we&rsquo;re saving</div>
                                <div className="hp-stat-val">{y.save.annual}</div>
                                <div className="hp-stat-sub">{y.save.purpose}</div>
                              </div>
                              <div className="hp-stat">
                                <div className="hp-stat-lbl">What the year costs the project</div>
                                <div className="hp-stat-val">{y.spend.range}</div>
                                <div className="hp-stat-sub">{y.spend.range.includes('loan') ? 'The bank funds it; we service the loan' : 'Cash from savings + reserve'}</div>
                              </div>
                            </div>

                            {y.decisions && y.decisions.length > 0 && (
                              <div className="hp-decisions">
                                <div className="hp-section-eyebrow">Decisions on the table this year</div>
                                <ul>
                                  {y.decisions.map(did => {
                                    const d = D.DECISIONS.find(x => x.id === did);
                                    const m = !d && (D.MICRO_DECISIONS || []).find(x => x.id === did);
                                    if (d) return <li key={did}><button className="hp-decision-link" onClick={() => go({kind:'decisions', focus: did})}>{d.title}</button></li>;
                                    if (m) return <li key={did}><button className="hp-decision-link hp-decision-micro" onClick={() => go({kind:'decisions', focus: did})}>{m.title}</button> <span className="hp-decision-soft-tag">· {m.defer}</span></li>;
                                    return <li key={did} className="hp-decision-soft">· {did.replace(/-/g,' ')}</li>;
                                  })}
                                </ul>
                              </div>
                            )}

                            <p className="hp-detail">{y.detail}</p>

                            {gate && (
                              <div className={'hp-gate ' + (openGate === gate.id ? 'open' : '')}>
                                <div className="hp-gate-when">{gate.when} &middot; {gate.name}</div>
                                <h4 className="hp-gate-title">A genuine pause point.</h4>
                                <p className="hp-gate-frame">{gate.framing}</p>

                                <button className="hp-gate-toggle" onClick={() => setOpenGate(openGate === gate.id ? null : gate.id)}>
                                  {openGate === gate.id ? 'Close the four options' : 'See the four options · proceed · defer · reduce · kill'}
                                </button>

                                {openGate === gate.id && (
                                  <div className="hp-gate-body">
                                    <div className="hp-gate-options">
                                      {Object.entries(gate.options).map(([k,opt]) => (
                                        <div key={k} className={'hp-opt hp-opt-' + k}>
                                          <div className="hp-opt-label">{opt.label}</div>
                                          <div className="hp-opt-body">{opt.body}</div>
                                        </div>
                                      ))}
                                    </div>
                                    <p className="hp-gate-foot">
                                      No emergency. <em>Defer</em> is the default in our plan — kill is reserved for things that genuinely
                                      can&rsquo;t be revived later.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}

            <footer className="hp-foot">
              <p>
                This is the plan. It is allowed to change. The reason we name the pause points is so we get to look
                up — and decide on purpose, not by drift.
              </p>
              <button className="hp-jon-link" onClick={() => alert('Switch to Jon mode (top right) to see the full v6 financial truth — every line item, the construction-loan structure, and the trigger criteria.')}>
                Want to see the full financial truth? Jon&rsquo;s view →
              </button>
            </footer>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // <JonPlan/> — full v6 financial truth
  // ─────────────────────────────────────────────────────────────
  function JonPlan({ go, store, setStore }) {
    const [openYear, setOpenYear] = useState(null);
    const [openMoneyYear, setOpenMoneyYear] = useState(null);
    const [openGate, setOpenGate] = useState(null);

    return (
      <div className="page jp-shell fade-up">
        <div className="page-inner">
          <div className="jp-page">
            <header className="jp-proem">
              <div className="jp-eyebrow">THE PLAN · FINANCIAL PLAN v6 · RECONCILED 2026·04·24</div>
              <h1 className="jp-title">Fourteen years, every line.</h1>
              <p className="jp-lede">
                Year-by-year ledger keyed to Financial Plan v6. Phase totals reconciled from line items with 10%
                construction contingency on construction + MEP + site work only (architecture fees, landscaping, and
                furnishing excluded). Five staged decision gates with explicit triggers and recoverable amounts.
              </p>

              {/* PHASE TOTALS */}
              <div className="jp-phase-grid">
                {PHASE_TOTALS.map(p => (
                  <div key={p.id} className="jp-phase-cell">
                    <div className="jp-pc-head">
                      <span className="jp-pc-label">{p.label}</span>
                      <span className="jp-pc-years">{p.years}</span>
                    </div>
                    <div className="jp-pc-total">{fmtMoney(p.total)}</div>
                    <div className="jp-pc-desc">{p.desc}</div>
                  </div>
                ))}
                <div className="jp-phase-cell jp-phase-grand">
                  <div className="jp-pc-head">
                    <span className="jp-pc-label">GRAND TOTAL</span>
                    <span className="jp-pc-years">2026 → 2040</span>
                  </div>
                  <div className="jp-pc-total">{fmtMoney(GRAND_TOTAL)}</div>
                  <div className="jp-pc-desc">v5 → v6 net: +$287,900</div>
                </div>
              </div>

              <div className="jp-friction">
                <span className="jp-glyph">§</span>
                <span>
                  Income $377K/yr. Settlement scenario (~$300K pre-tax, ~$180K net) is <b>not</b> in baseline. Federal
                  residential clean-energy credit terminated 2025·12·31 — no credit available for the 2037–2040 PV
                  install window. Two architect-decision alternates (CNC limestone, panelized framing) not priced in
                  baseline; Imber + Dibello will return with numbers.
                </span>
              </div>
            </header>

            {/* TIMELINE */}
            <ol className="jp-timeline">
              {D.TIMELINE.map(y => {
                const expanded = openYear === y.year;
                const moneyOpen = openMoneyYear === y.year;
                const gate = y.gate ? D.GATES[y.gate] : null;
                const bandWidth = (D.SPEND_BANDS[y.spend.band] || 0.1) * 100;
                return (
                  <li key={y.year} className={'jp-row ' + (expanded ? 'open' : '') + (gate ? ' has-gate' : '')}>
                    <div className="jp-row-head" onClick={() => setOpenYear(expanded ? null : y.year)}>
                      <div className="jp-year-col">
                        <div className="jp-year">{y.year}</div>
                        <div className="jp-era">{y.era}</div>
                      </div>
                      <div className="jp-mid-col">
                        <h3 className="jp-headline">{y.headline}</h3>
                        <div className="jp-bandbar">
                          <div className="jp-bandbar-fill" style={{width: bandWidth + '%'}}></div>
                          <span className="jp-bandbar-label">{y.spend.range}</span>
                        </div>
                      </div>
                      <div className="jp-gate-col">
                        {gate ? <span className="jp-gate-pill">GATE</span> : <span className="jp-chev">{expanded ? '▾' : '▸'}</span>}
                      </div>
                    </div>

                    {expanded && (
                      <div className="jp-row-body">
                        <p className="jp-summary">{y.summary}</p>

                        <div className={'jp-money ' + (moneyOpen ? 'open' : '')}>
                          <button className="jp-money-trigger" onClick={() => setOpenMoneyYear(moneyOpen ? null : y.year)}>
                            <span className="jp-mt-amt">{y.spend.range}</span>
                            <span className="jp-mt-lbl">{moneyOpen ? '— hide line items' : '— see line items'}</span>
                          </button>
                          {moneyOpen && (
                            <ul className="jp-money-list">
                              {y.spend.items.map((it,i) => <li key={i}>{it}</li>)}
                              <li className="jp-ml-note">Bracketed range. Real estimates land at construction-document close. v6 uses 10% contingency on construction + MEP + site only.</li>
                            </ul>
                          )}
                        </div>

                        {y.decisions && y.decisions.length > 0 && (
                          <div className="jp-decisions">
                            <div className="jp-section-eyebrow">Decisions due this year</div>
                            <ul className="jp-decisions-list">
                              {y.decisions.map(did => {
                                const d = D.DECISIONS.find(x => x.id === did);
                                const m = !d && (D.MICRO_DECISIONS || []).find(x => x.id === did);
                                if (d) {
                                  return (
                                    <li key={did}>
                                      <button className="jp-decision-link" onClick={() => go({kind:'decisions', focus: did})}>{d.title}</button>
                                      <span className="jp-dl-status">· {d.status}</span>
                                    </li>
                                  );
                                }
                                if (m) {
                                  return (
                                    <li key={did}>
                                      <button className="jp-decision-link" onClick={() => go({kind:'decisions', focus: did})}>{m.title}</button>
                                      <span className="jp-dl-status">· {m.defer}</span>
                                    </li>
                                  );
                                }
                                return <li key={did} className="jp-dl-soft">· {did.replace(/-/g,' ')}</li>;
                              })}
                            </ul>
                          </div>
                        )}

                        <p className="jp-detail">{y.detail}</p>

                        {gate && (
                          <div className={'jp-gate ' + (openGate === gate.id ? 'open' : '')}>
                            <div className="jp-gate-head">
                              <div className="jp-gh-when">{gate.when} &middot; {gate.stage}</div>
                              <h4 className="jp-gh-name">{gate.name}</h4>
                              <p className="jp-gh-frame">{gate.framing}</p>
                            </div>

                            <button className="jp-gate-toggle" onClick={() => setOpenGate(openGate === gate.id ? null : gate.id)}>
                              {openGate === gate.id ? 'Hide gate detail' : 'Show triggers · recovery · the four options'}
                            </button>

                            {openGate === gate.id && (
                              <div className="jp-gate-body">
                                <div className="jp-triggers">
                                  <div className="jp-eyebrow">{gate.triggerHeadline}</div>
                                  <ul>
                                    {gate.triggers.map((t,i) => <li key={i}>{t}</li>)}
                                  </ul>
                                </div>
                                <div className="jp-recovery">
                                  <span className="jp-rec-lbl">RECOVERY ON DEFER:</span>
                                  <span className="jp-rec-amt">{gate.recovery}</span>
                                </div>
                                <div className="jp-options">
                                  <div className="jp-eyebrow">Four options. Defer is the v6 default; kill is reserved.</div>
                                  {Object.entries(gate.options).map(([k,opt]) => (
                                    <div key={k} className={'jp-opt jp-opt-' + k}>
                                      <div className="jp-opt-label">{opt.label}</div>
                                      <div className="jp-opt-body">{opt.body}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            <footer className="jp-foot">
              <p>
                Annual upkeep, post-completion: $31,500–$58,500. Includes property tax with WME on 38+ acres,
                insurance, landscape maintenance, geothermal/HVAC service, septic, and orangery planting maintenance.
                Architecture fee summary: Imber $237K (design) + Dibello $228K (AOR) + engineering/landscape $70K
                = $535K spread across 2027–2040.
              </p>
            </footer>

            <LockedSpecsSection />
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // <LockedSpecsSection/> — D1.0 register, embedded under The Plan
  // Sits at the bottom of JonPlan; auto-scrolls into view if route.kind==='specs'.
  // ─────────────────────────────────────────────────────────────
  function LockedSpecsSection() {
    const ref = useRef(null);
    const grouped = useMemo(() => {
      const g = {};
      (D.LOCKED_SPECS || []).forEach(s => {
        if (!g[s.ref]) g[s.ref] = [];
        g[s.ref].push(s);
      });
      return g;
    }, []);

    // Scroll into view if we landed via /#/specs route
    useEffect(() => {
      const h = (location.hash || '');
      if (h.includes('/specs') && ref.current) {
        const t = setTimeout(() => {
          const page = ref.current.closest('.page');
          if (page) {
            const r = ref.current.getBoundingClientRect();
            const pr = page.getBoundingClientRect();
            page.scrollTop += (r.top - pr.top) - 80;
          }
        }, 120);
        return () => clearTimeout(t);
      }
    }, []);

    return (
      <section ref={ref} className="jp-specs" id="locked-specs">
        <header className="jp-specs-head">
          <div className="jp-specs-mini">Sheet D1.0 · Project Register · {(D.LOCKED_SPECS || []).length} entries · authoritative</div>
          <h2 className="jp-specs-title">At-a-glance specs.</h2>
          <p className="jp-specs-lede">
            The locked values that don't bend. Lifted into the larger buildout for context — what each
            sheet says, who owns it, which ancestor it serves. If something here changes, every spec it
            touches changes; treat it as a flag, not a tweak.
          </p>
        </header>
        {Object.entries(grouped).map(([refLabel, specs]) => {
          const briefKey = refLabel.toLowerCase().split('/')[0];
          const brief = (D.BRIEFS || []).find(b => b.id === briefKey);
          return (
            <div key={refLabel} className="jp-specs-group">
              <h3 className="jp-specs-group-head">
                {refLabel}
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
              <table className="jp-specs-table">
                <thead>
                  <tr><th>Item</th><th>Locked Value</th><th>Ancestor</th></tr>
                </thead>
                <tbody>
                  {specs.map((s, i) => (
                    <tr key={i}>
                      <td className="item">{s.item}</td>
                      <td className="value">{s.value}</td>
                      <td className="ancestor"><span className={'anc-pill ' + s.ancestor}>{D.ANCESTORS[s.ancestor].name}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // <RoomTechReveal/> — discreet "show technical layer" on a room
  // ─────────────────────────────────────────────────────────────
  function RoomTechReveal({ roomId }) {
    const [open, setOpen] = useState(false);
    const tech = D.ROOM_TECH[roomId];
    if (!tech) return null;
    return (
      <div className={'room-tech ' + (open ? 'open' : '')}>
        <button className="room-tech-trigger" onClick={() => setOpen(!open)}>
          <span className="rtt-glyph">⊟</span>
          <span className="rtt-label">{open ? 'Hide technical layer' : 'Reveal technical layer'}</span>
          <span className="rtt-sub">{open ? '' : 'design considerations · code · MEP'}</span>
        </button>
        {open && (
          <div className="room-tech-body">
            {tech.excerpt && (
              <blockquote className="rt-excerpt">
                <p>{tech.excerpt.text}</p>
                <cite>— {tech.excerpt.from}</cite>
              </blockquote>
            )}
            <ul className="rt-layers">
              {tech.layers.map((L,i) => (
                <li key={i}>
                  <div className="rt-kind">{L.kind}</div>
                  <div className="rt-body">{L.body}</div>
                </li>
              ))}
            </ul>
            <div className="rt-foot">Bracketed for now — Dibello CDs will tighten these. The shape is right.</div>
          </div>
        )}
      </div>
    );
  }

  Object.assign(window, { ThePlan, HelenPlan, JonPlan, RoomTechReveal });
})();
