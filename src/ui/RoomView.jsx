import { ANCESTORS } from '../data/rooms.js';

const DIR = {
  north: { label: 'North', arrow: '↑' }, south: { label: 'South', arrow: '↓' },
  east: { label: 'East', arrow: '→' }, west: { label: 'West', arrow: '←' },
  up: { label: 'Upstairs', arrow: '↑' }, down: { label: 'Downstairs', arrow: '↓' },
};

/**
 * A single space, render-forward: the colored-pencil illustration is the primary
 * surface. From here you can WALK to an adjoining space (geometry-derived
 * neighbors) or step into the 3D massing.
 */
export default function RoomView({ room, neighbors = [], onBack, onStepInto, onGoRoom }) {
  if (!room) return null;
  return (
    <div className="roomview">
      <button className="rv-back" onClick={onBack}>← Compound</button>

      <div className="rv-stage">
        {room.renderImage
          ? <img className="rv-hero" src={room.renderImage} alt={room.name} />
          : <div className="rv-hero placeholder">render not yet made</div>}
      </div>

      <div className="rv-body">
        <h1>{room.name}</h1>
        <div className="rv-sub">
          {room.building} · {room.floor}{room.phase ? ` · Phase ${room.phase}` : ''}
        </div>

        {room.ancestors?.length > 0 && (
          <div className="chips">
            {room.ancestors.map((a) => (
              <span key={a} className="chip" style={{ '--chip': ANCESTORS[a]?.color || '#999' }}>
                {ANCESTORS[a]?.name || a}
              </span>
            ))}
          </div>
        )}

        {room.intent && <p className="rv-intent">{room.intent}</p>}

        {/* Walk from here to an adjoining space */}
        {neighbors.length > 0 && (
          <div className="walk">
            <div className="walk-label">Walk to an adjoining space</div>
            <div className="walk-row">
              {neighbors.map((n) => (
                <button className="walk-card" key={n.id} onClick={() => onGoRoom(n.id)}>
                  <span className="walk-thumb">
                    {n.renderImage ? <img src={n.renderImage} alt="" loading="lazy" /> : <span className="walk-noimg" />}
                  </span>
                  <span className="walk-dir">{DIR[n.dir]?.arrow} {DIR[n.dir]?.label || n.dir}</span>
                  <span className="walk-name">{n.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {room.specs?.length > 0 && (
          <div className="specs">
            {room.specs.map((s, i) => (
              <div className="spec-row" key={i}><span className="k">{s.k}</span><span className="v">{s.v}</span></div>
            ))}
          </div>
        )}

        {room.helenNote && <div className="notes">— Helen: {room.helenNote}</div>}

        <div className="rv-dims">
          {room.w}′ × {room.d}′ · {room.area} ft² · {room.height}′ ceiling
        </div>

        <button className="rv-step" onClick={() => onStepInto(room.id)}>Step into the 3D massing →</button>
      </div>
    </div>
  );
}
