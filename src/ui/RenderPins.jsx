import { useState } from 'react';

/**
 * RenderPins — the "look closer" overlay. Shows a room's render WHOLE (the walk's
 * full-bleed view crops the sides on a phone, which would lose edge pins), with the
 * authored pins (pins.js) overlaid at their x/y %. Tap a pin → its note. The frame
 * is a fixed 3:2 box so pin coordinates map straight onto the picture.
 *
 * First pass — the entry affordance + treatment are Code's placeholder for Design.
 */
const KIND_LABEL = { material: 'Material', view: 'View', feature: 'Feature', heritage: 'Heritage' };

export default function RenderPins({ room, pins, onClose }) {
  const [active, setActive] = useState(null);
  const p = active != null ? pins[active] : null;

  return (
    <div className="wk-pins" onClick={onClose}>
      <div className="wk-pins-head">
        <div className="ttl">{room.displayName}<small>Tap a pin to read it</small></div>
        <button className="wk-pins-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="wk-pins-stage" onClick={(e) => e.stopPropagation()}>
        <div className="wk-pins-frame">
          <img src={room.renderImage} alt={room.displayName} draggable="false" />
          {pins.map((pin, i) => (
            <button
              key={i}
              className={`wk-pin${active === i ? ' on' : ''}`}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              onClick={() => setActive(active === i ? null : i)}
              aria-label={pin.label}
            >
              <span className="dot" />
            </button>
          ))}
          {p && (
            <div className="wk-pin-card">
              {p.kind && <span className="k">{KIND_LABEL[p.kind] || p.kind}</span>}
              <div className="l">{p.label}</div>
              <div className="n">{p.note}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
