import { useMemo } from 'react';
import { BUILDINGS, ANCESTORS, compoundRender } from '../data/rooms.js';

/**
 * Render-forward home: the compound's colored-pencil illustrations ARE the
 * surface. Each room is its render; clicking one steps you toward its 3D massing.
 */
export default function Gallery({ rooms, onOpenRoom, onOpenModel, onEnterWalk }) {
  // Only rooms that have a render belong on the lookbook wall; the back-of-house
  // spaces (compute room, sauna, airlock…) live in the 3D model.
  const rendered = useMemo(() => rooms.filter((r) => r.renderImage), [rooms]);
  const groups = useMemo(
    () => BUILDINGS.map((b) => [b, rendered.filter((r) => r.building === b)]).filter(([, rs]) => rs.length),
    [rendered]
  );

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

      {groups.map(([b, rs]) => (
        <section className="g-building" key={b}>
          <h2>{b}</h2>
          <div className="g-grid">
            {rs.map((r) => (
              <button className="g-card" key={r.id} onClick={() => onOpenRoom(r.id)}>
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
        </section>
      ))}

      <footer className="g-foot">
        Provisional feel-model · room dimensions re-derive at the architect's Design Development (~2031)
      </footer>
    </div>
  );
}
