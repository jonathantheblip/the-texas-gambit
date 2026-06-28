import { ANCESTORS } from '../data/rooms.js';

/**
 * A single space, render-forward: the colored-pencil illustration is the primary
 * surface (the "arrival"); the writing sits beside it; "step into" reveals the
 * 3D massing for the same space.
 */
export default function RoomView({ room, onBack, onStepInto }) {
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
