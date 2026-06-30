import { useMemo, useState } from 'react';
import { BUILDINGS, ANCESTORS, compoundRender } from '../data/rooms.js';

const OPEN_KEY = 'tg.gallery.open';
// Which building sections are expanded — collapsed by default, remembered for the
// session so opening a room and coming back doesn't re-collapse what you were in.
function loadOpen() {
  try { const v = sessionStorage.getItem(OPEN_KEY); return new Set(v ? JSON.parse(v) : []); }
  catch { return new Set(); }
}

/**
 * Render-forward home: the compound's colored-pencil illustrations ARE the
 * surface. Each room is its render; clicking one steps you toward its 3D massing.
 * Buildings are collapsible sections (collapsed by default) so the non-Main-Block
 * wings are one tap away instead of a long scroll.
 */
export default function Gallery({ rooms, onOpenRoom, onOpenModel, onEnterWalk }) {
  // Only rooms that have a render belong on the lookbook wall; the back-of-house
  // spaces (compute room, sauna, airlock…) live in the 3D model.
  const rendered = useMemo(() => rooms.filter((r) => r.renderImage), [rooms]);
  const groups = useMemo(
    () => BUILDINGS.map((b) => [b, rendered.filter((r) => r.building === b)]).filter(([, rs]) => rs.length),
    [rendered]
  );

  const [open, setOpen] = useState(loadOpen);
  const toggle = (b) => setOpen((prev) => {
    const next = new Set(prev);
    next.has(b) ? next.delete(b) : next.add(b);
    try { sessionStorage.setItem(OPEN_KEY, JSON.stringify([...next])); } catch { /* private mode */ }
    return next;
  });

  return (
    <div className="gallery">
      <header className="g-hero" style={compoundRender ? { backgroundImage: `linear-gradient(180deg, rgba(20,18,14,.05), rgba(20,18,14,.55)), url(${compoundRender})` } : undefined}>
        <div className="g-hero-inner">
          <div className="g-eyebrow">A living model of the compound</div>
          <h1>Hill Country Estate</h1>
          <p>DiBello · Imber · Sundt · 2026 → 2038</p>
          <div className="g-cta-row">
            <button className="g-cta" onClick={onEnterWalk}>Walk from the front door →</button>
            <button className="g-cta ghost" onClick={onOpenModel}>Explore the 3D massing</button>
          </div>
        </div>
      </header>

      {groups.map(([b, rs]) => {
        const isOpen = open.has(b);
        const bodyId = `g-body-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        return (
          <section className={`g-building${isOpen ? ' open' : ''}`} key={b}>
            <button type="button" className="g-building-head" onClick={() => toggle(b)}
              aria-expanded={isOpen} aria-controls={bodyId}>
              <span className="g-building-name">{b}</span>
              <span className="g-building-count">{rs.length}</span>
              <span className="g-rule" aria-hidden="true" />
              <svg className="g-chevron" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="g-building-body" id={bodyId} role="region" aria-label={b}>
              <div className="g-building-inner">
                <div className="g-grid">
                  {rs.map((r) => (
                    <button className="g-card" key={r.id} onClick={() => onOpenRoom(r.id)} tabIndex={isOpen ? 0 : -1}>
                      <div className="g-card-img"><img src={r.renderImage} alt={r.displayName} loading="lazy" /></div>
                      <div className="g-card-cap">
                        <span className="g-card-name">{r.displayName}</span>
                        {r.ancestors?.[0] && (
                          <span className="g-card-anc" style={{ '--chip': ANCESTORS[r.ancestors[0]]?.color || '#999' }}>
                            {ANCESTORS[r.ancestors[0]]?.name || r.ancestors[0]}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <footer className="g-foot">
        Provisional feel-model · room dimensions re-derive at the architect's Design Development (~2031)
      </footer>
    </div>
  );
}
