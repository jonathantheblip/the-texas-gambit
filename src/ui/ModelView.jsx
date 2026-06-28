import { useMemo, useRef, useState } from 'react';
import { validate, PALETTE } from '../model/compoundModel.js';
import {
  ALL_ROOMS, BUILDINGS, FLOORS, ANCESTORS,
  applyOverrides, toGeometryTable, tableToOverrides,
} from '../data/rooms.js';
import { useGeometry } from '../store/useGeometry.js';
import { setOverride, resetOverride, getIdentity, setIdentity } from '../store/geometryStore.js';
import CompoundScene from '../scene/CompoundScene.jsx';

const TAG_LABEL = { L: 'Locked', D: 'Derived', A: 'Area locked · shape guessed', '~': 'Best-guess' };
const SYNC_LABEL = { local: 'Local only', idle: 'Synced', syncing: 'Syncing…', offline: 'Offline', error: 'Sync error' };
const rgbCss = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function EditRow({ label, value, onChange }) {
  return (
    <label className="edit-row">
      <span>{label}</span>
      <input type="number" step="1" value={value}
        onChange={(e) => e.target.value !== '' && onChange(Number(e.target.value))} />
    </label>
  );
}

/** The "stepped-into" 3D massing view: scene + locks/layers/edit panel. */
export default function ModelView({ onExit, initialSelectedId = null, onOpenRender }) {
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [hiddenBuildings, setHiddenBuildings] = useState(() => new Set());
  const [hiddenFloors, setHiddenFloors] = useState(() => new Set());
  const [showProvisional, setShowProvisional] = useState(true);
  const [xray, setXray] = useState(false);
  const [viewMode, setViewMode] = useState('both');
  const [identity, setIdent] = useState(getIdentity);
  const fileRef = useRef();

  const { overrides, status } = useGeometry();
  const rooms = useMemo(() => applyOverrides(ALL_ROOMS, overrides), [overrides]);
  const result = useMemo(() => validate(rooms), [rooms]);

  const visibleRooms = useMemo(
    () => rooms.filter((r) =>
      !hiddenBuildings.has(r.building) &&
      !hiddenFloors.has(r.floor) &&
      (showProvisional || r.render !== 'provisional')
    ),
    [rooms, hiddenBuildings, hiddenFloors, showProvisional]
  );

  const selected = selectedId ? rooms.find((r) => r.id === selectedId) : null;

  const toggle = (set, key) => (prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  };
  const countBy = (pred) => ALL_ROOMS.filter(pred).length;
  const chooseIdentity = (id) => { setIdentity(id); setIdent(id); };
  const edit = (field, value) => setOverride(selectedId, { [field]: value }, identity);

  const exportTable = () => {
    const blob = new Blob([JSON.stringify(toGeometryTable(rooms), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'compound_rooms.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const importTable = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const ov = tableToOverrides(data.rooms || data);
        const n = Object.keys(ov).length;
        Object.entries(ov).forEach(([id, patch]) => setOverride(id, patch, identity));
        alert(n ? `Imported ${n} edited space${n === 1 ? '' : 's'}.` : 'No differences from the base table.');
      } catch {
        alert('Could not read that file as a room table.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="layout">
      <div className="stage">
        <div className="stage-hud">
          <button className="back-btn" onClick={onExit}>← Compound</button>
          <div className="title">3D Massing</div>
          <div className="meta">{visibleRooms.length} of {ALL_ROOMS.length} spaces · generated from the room table</div>
        </div>
        <div className="stage-tip">drag to orbit · scroll to zoom · right-drag to pan · click a space</div>
        <div className="viewmode">
          {[['both', 'Both'], ['diorama', 'Renders'], ['massing', 'Massing']].map(([m, label]) => (
            <button key={m} className={viewMode === m ? 'on' : ''} onClick={() => setViewMode(m)}>{label}</button>
          ))}
        </div>
        <CompoundScene
          rooms={visibleRooms}
          framingRooms={ALL_ROOMS}
          selectedId={selectedId}
          onSelect={setSelectedId}
          xray={xray}
          mode={viewMode}
        />
      </div>

      <aside className="panel">
        <div className="panel-head">
          <div className="identity">
            <span className="lbl">You:</span>
            <button className={identity === 'helen' ? 'on' : ''} onClick={() => chooseIdentity('helen')}>Helen</button>
            <button className={identity === 'jon' ? 'on' : ''} onClick={() => chooseIdentity('jon')}>Jon</button>
          </div>
          <span className={`sync ${status}`}><span className="dot" />{SYNC_LABEL[status] || status}</span>
        </div>

        <section>
          <div className="eyebrow">Locks</div>
          <div className="checks">
            {result.checks.map((c) => (
              <div key={c.id} className={`check ${c.ok ? 'ok' : 'bad'}`}>
                <span className="dot" /><span>{c.msg}</span>
              </div>
            ))}
          </div>
          <div className={`banner ${result.ok ? 'ok' : 'bad'}`}>
            {result.ok ? 'ALL LOCKS HOLD' : 'A LOCK BROKE'}
          </div>
        </section>

        <section>
          <div className="eyebrow">Layers</div>
          <div className="subhead">Buildings</div>
          {BUILDINGS.map((b) => (
            <label key={b} className="toggle">
              <input type="checkbox" checked={!hiddenBuildings.has(b)} onChange={() => setHiddenBuildings(toggle(hiddenBuildings, b))} />
              <span className="swatch" style={{ background: rgbCss(PALETTE[b]) }} />
              {b}
              <span className="count">{countBy((r) => r.building === b)}</span>
            </label>
          ))}
          <div className="subhead">Floors</div>
          {FLOORS.map((f) => (
            <label key={f} className="toggle">
              <input type="checkbox" checked={!hiddenFloors.has(f)} onChange={() => setHiddenFloors(toggle(hiddenFloors, f))} />
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

        <section>
          <div className="eyebrow">Selected space</div>
          {!selected && <div className="sel-empty">Click a space in the model.</div>}
          {selected && (
            <div className="sel">
              {selected.renderImage
                ? <img className="sel-hero" src={selected.renderImage} alt={selected.name} loading="lazy" />
                : <div className="sel-hero placeholder">render not yet made</div>}
              <h3>{selected.name}</h3>
              <div className="sub">
                {selected.building} · {selected.floor}{selected.phase ? ` · Phase ${selected.phase}` : ''}
              </div>
              {selected.renderImage && (
                <button className="render-link" onClick={() => onOpenRender(selected.id)}>See the render ↗</button>
              )}
              {selected.ancestors?.length > 0 && (
                <div className="chips">
                  {selected.ancestors.map((a) => (
                    <span key={a} className="chip" style={{ '--chip': ANCESTORS[a]?.color || '#999' }}>
                      {ANCESTORS[a]?.name || a}
                    </span>
                  ))}
                </div>
              )}
              {selected.intent && <p className="intent">{selected.intent}</p>}

              <div className="edit">
                <div className="subhead">Edit dimensions <span className="as">as {cap(identity)}</span></div>
                <div className="edit-grid">
                  <EditRow label="Width (E–W)" value={selected.w} onChange={(v) => edit('w', v)} />
                  <EditRow label="Depth (N–S)" value={selected.d} onChange={(v) => edit('d', v)} />
                  <EditRow label="X (East)" value={selected.x} onChange={(v) => edit('x', v)} />
                  <EditRow label="Y (North)" value={selected.y} onChange={(v) => edit('y', v)} />
                  <EditRow label="Height" value={selected.height} onChange={(v) => edit('height', v)} />
                </div>
                <div className="edit-foot">
                  <span>{selected.w}′ × {selected.d}′ · {selected.area} ft²</span>
                  {selected.edited && (
                    <span className="edited">
                      edited{selected.editedBy ? ` · ${cap(selected.editedBy)}` : ''}
                      <button className="link" onClick={() => resetOverride(selected.id)}>reset</button>
                    </span>
                  )}
                </div>
              </div>

              <dl>
                <dt>SW corner</dt><dd>({selected.x}, {selected.y})</dd>
                <dt>State</dt><dd>{selected.render}</dd>
                <dt>Provenance</dt><dd><span className="tagpill">{selected.tag}</span> {TAG_LABEL[selected.tag] || ''}</dd>
              </dl>
              {selected.specs?.length > 0 && (
                <div className="specs">
                  {selected.specs.map((s, i) => (
                    <div className="spec-row" key={i}><span className="k">{s.k}</span><span className="v">{s.v}</span></div>
                  ))}
                </div>
              )}
              {selected.helenNote && <div className="notes">— Helen: {selected.helenNote}</div>}
              {selected.notes && <div className="notes geom-note">{selected.notes}</div>}
            </div>
          )}
        </section>

        <section>
          <div className="eyebrow">Room table</div>
          <div className="row-btns">
            <button onClick={exportTable}>Export JSON</button>
            <button onClick={() => fileRef.current.click()}>Import JSON</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={importTable} />
          </div>
        </section>
      </aside>
    </div>
  );
}
