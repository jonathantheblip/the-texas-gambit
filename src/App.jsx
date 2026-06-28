import { useMemo, useState } from 'react';
import roomsData from './data/compound_rooms.json';
import { validate, PALETTE } from './model/compoundModel.js';
import CompoundScene from './scene/CompoundScene.jsx';

const ALL_ROOMS = roomsData.rooms;

const FLOOR_ORDER = ['ground', 'upper', 'loft', 'crown', 'site'];
const TAG_LABEL = { L: 'Locked', D: 'Derived', A: 'Area locked · shape guessed', '~': 'Best-guess' };

// Buildings in PALETTE order, restricted to those actually present.
const BUILDINGS = Object.keys(PALETTE).filter((b) => ALL_ROOMS.some((r) => r.building === b));
const FLOORS = FLOOR_ORDER.filter((f) => ALL_ROOMS.some((r) => r.floor === f));

const rgbCss = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [hiddenBuildings, setHiddenBuildings] = useState(() => new Set());
  const [hiddenFloors, setHiddenFloors] = useState(() => new Set());
  const [showProvisional, setShowProvisional] = useState(true);
  const [xray, setXray] = useState(false);

  // Validation runs on the FULL table (lock integrity), not just what's visible.
  const result = useMemo(() => validate(ALL_ROOMS), []);

  const visibleRooms = useMemo(
    () => ALL_ROOMS.filter((r) =>
      !hiddenBuildings.has(r.building) &&
      !hiddenFloors.has(r.floor) &&
      (showProvisional || r.render !== 'provisional')
    ),
    [hiddenBuildings, hiddenFloors, showProvisional]
  );

  const selected = selectedId ? ALL_ROOMS.find((r) => r.id === selectedId) : null;

  const toggle = (set, key) => (prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  };

  const countBy = (pred) => ALL_ROOMS.filter(pred).length;

  return (
    <div className="layout">
      <div className="stage">
        <div className="stage-hud">
          <div className="title">Hill Country Estate</div>
          <div className="meta">{visibleRooms.length} of {ALL_ROOMS.length} spaces · generated from the room table</div>
        </div>
        <div className="stage-tip">drag to orbit · scroll to zoom · right-drag to pan · click a space</div>
        <CompoundScene
          rooms={visibleRooms}
          framingRooms={ALL_ROOMS}
          selectedId={selectedId}
          onSelect={setSelectedId}
          xray={xray}
        />
      </div>

      <aside className="panel">
        {/* Validation */}
        <section>
          <div className="eyebrow">Locks</div>
          <div className="checks">
            {result.checks.map((c) => (
              <div key={c.id} className={`check ${c.ok ? 'ok' : 'bad'}`}>
                <span className="dot" />
                <span>{c.msg}</span>
              </div>
            ))}
          </div>
          <div className={`banner ${result.ok ? 'ok' : 'bad'}`}>
            {result.ok ? 'ALL LOCKS HOLD' : 'A LOCK BROKE'}
          </div>
        </section>

        {/* Layers */}
        <section>
          <div className="eyebrow">Layers</div>

          <div className="subhead">Buildings</div>
          {BUILDINGS.map((b) => (
            <label key={b} className="toggle">
              <input
                type="checkbox"
                checked={!hiddenBuildings.has(b)}
                onChange={() => setHiddenBuildings(toggle(hiddenBuildings, b))}
              />
              <span className="swatch" style={{ background: rgbCss(PALETTE[b]) }} />
              {b}
              <span className="count">{countBy((r) => r.building === b)}</span>
            </label>
          ))}

          <div className="subhead">Floors</div>
          {FLOORS.map((f) => (
            <label key={f} className="toggle">
              <input
                type="checkbox"
                checked={!hiddenFloors.has(f)}
                onChange={() => setHiddenFloors(toggle(hiddenFloors, f))}
              />
              {f}
              <span className="count">{countBy((r) => r.floor === f)}</span>
            </label>
          ))}

          <div className="subhead">Render state</div>
          <label className="toggle">
            <input type="checkbox" checked={showProvisional} onChange={(e) => setShowProvisional(e.target.checked)} />
            Show best-guess (provisional)
          </label>
          <label className="toggle">
            <input type="checkbox" checked={xray} onChange={(e) => setXray(e.target.checked)} />
            X-ray (all translucent)
          </label>
        </section>

        {/* Selection */}
        <section>
          <div className="eyebrow">Selected space</div>
          {!selected && <div className="sel-empty">Click a space in the model.</div>}
          {selected && (
            <div className="sel">
              <h3>{selected.name}</h3>
              <div className="sub">{selected.building} · {selected.floor}</div>
              <dl>
                <dt>Footprint</dt><dd>{selected.w}′ × {selected.d}′</dd>
                <dt>Area</dt><dd>{selected.w * selected.d} ft²</dd>
                <dt>Height</dt><dd>{selected.height}′</dd>
                <dt>SW corner</dt><dd>({selected.x}, {selected.y})</dd>
                <dt>Render</dt><dd>{selected.render}</dd>
                <dt>Provenance</dt><dd><span className="tagpill">{selected.tag}</span> {TAG_LABEL[selected.tag] || ''}</dd>
              </dl>
              {selected.notes && <div className="notes">{selected.notes}</div>}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
