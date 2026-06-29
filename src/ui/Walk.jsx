import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { nav } from '../nav/navStore.js';
import { useNav } from '../nav/useNav.js';
import { neighborsOf } from '../data/adjacency.js';
import { lineageOf } from '../data/lineage.js';
import { FEEL } from '../data/feel.js';
import WalkMap from './WalkMap.jsx';
import ReadingSheet from './ReadingSheet.jsx';

const ORDER = { N: 0, E: 1, S: 2, W: 3 };
const ARROW = { N: '↑', S: '↓', E: '→', W: '←' };
const STAIR_ARROW = { up: '⇧', down: '⇩' };
const HEADING_WORD = { N: 'North', S: 'South', E: 'East', W: 'West' };
const WIPE_ANGLE = { N: '180deg', S: '0deg', E: '90deg', W: '270deg', up: '180deg', down: '0deg', none: '90deg' };
const shortName = (s) => (s || '').replace(/\s*\(.*\)$/, '');
const firstSentence = (t) => { const m = t && t.match(/^[^.]+\./); return m ? m[0] : (t || '').slice(0, 90); };

/** A render frame — the "you are standing here" surface, with its caption. */
function Frame({ room, anim, onReadMore }) {
  const anc = lineageOf(room.building);
  const cues = (FEEL[room.id] || []).slice(0, 2);
  return (
    <div className={`wk-frame ${room.renderImage ? 'has-render' : 'no-render'} ${anim}`}
      style={room.renderImage ? { backgroundImage: `url("${room.renderImage}")` } : undefined}>
      {!room.renderImage && <div className="wk-massing-mark"><div className="box" /></div>}
      <div className="wk-cap">
        <div className="wk-cap-meta">
          <span className="fam" style={{ background: anc.hex }} />
          <span>{room.building} · {room.floor} · {room.area} ft²</span>
        </div>
        <h1 className="wk-cap-name">{room.name}</h1>
        {room.intent && <div className="wk-cap-read">{firstSentence(room.intent)}</div>}
        <div className="wk-cap-foot">
          {cues.map((t) => <span className="wk-feel" key={t}>{t}</span>)}
          <button className="wk-readmore" onClick={(e) => { e.stopPropagation(); onReadMore(); }}>
            Reading the room <span>↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * THE WALK — render-led wayfinding. Each room's render fills the screen; you move
 * by tapping a heading and the next render arrives FROM that heading. One current
 * room (navStore) drives the breadcrumb, the shared map, the exit list, and the
 * reading sheet, so they can never disagree.
 */
export default function Walk({ rooms }) {
  const view = useNav();
  const byId = useMemo(() => { const m = {}; for (const r of rooms) m[r.id] = r; return m; }, [rooms]);
  const names = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, r.name])), [rooms]);
  const roomId = view.roomId;
  const room = byId[roomId];

  const [reading, setReading] = useState(false);
  const [mapScope, setMapScope] = useState(null);   // null = closed, else 'building' | 'compound'
  const [hint, setHint] = useState('');
  const [exiting, setExiting] = useState(null);     // { room, dir, key }
  const [current, setCurrent] = useState(() => ({ room, dir: 'none', key: 'k0' }));
  const seq = useRef(0);
  const prevId = useRef(roomId);
  const history = useRef([]);
  const rootRef = useRef(null);
  const dockRef = useRef(null);
  const hintT = useRef(null);

  // arrival: when the current room changes, animate the new render in from the
  // travel heading and the old one out the opposite way (direction from the graph).
  useEffect(() => {
    if (roomId === prevId.current) return;
    const from = byId[prevId.current];
    const rel = neighborsOf(prevId.current).find((n) => n.id === roomId);
    const dir = rel ? (rel.vert || rel.heading || 'none') : 'none';
    seq.current += 1;
    if (from) setExiting({ room: from, dir, key: `x${seq.current}` });
    setCurrent({ room: byId[roomId], dir, key: `e${seq.current}` });
    prevId.current = roomId;
    const ms = (dir === 'up' || dir === 'down') ? 720 : (dir === 'none' ? 560 : 640);
    const t = setTimeout(() => setExiting(null), ms + 60);
    // arrival hint
    if (rel?.vert) showHint(`${rel.vert === 'up' ? 'Up the stair to ' : 'Down to '}${shortName(byId[roomId]?.name)}`);
    else if (rel?.heading) showHint(`${HEADING_WORD[rel.heading]} into ${shortName(byId[roomId]?.name)}`);
    return () => clearTimeout(t);
  }, [roomId, byId]);

  // welcome hint on first mount
  useEffect(() => {
    const t = setTimeout(() => showHint(roomId === 'front_porch' ? "You're on the Front Porch — walk inside" : `You're in ${shortName(room?.name)}`), 450);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the caption clear of the (variable-height) dock
  useLayoutEffect(() => {
    const setH = () => {
      const d = dockRef.current;
      const h = d && getComputedStyle(d).display !== 'none' ? d.offsetHeight : 0;
      rootRef.current?.style.setProperty('--wk-dock-h', `${h}px`);
    };
    setH();
    window.addEventListener('resize', setH);
    const onOrient = () => setTimeout(setH, 60);
    window.addEventListener('orientationchange', onOrient);
    return () => { window.removeEventListener('resize', setH); window.removeEventListener('orientationchange', onOrient); };
  });

  function showHint(text) {
    setHint(text);
    clearTimeout(hintT.current);
    hintT.current = setTimeout(() => setHint(''), 1800);
  }

  const exits = useMemo(() => {
    const ns = neighborsOf(roomId);
    const flat = ns.filter((n) => !n.vert).sort((a, b) => (ORDER[a.heading] ?? 9) - (ORDER[b.heading] ?? 9));
    const stairs = ns.filter((n) => n.vert);
    return [...flat, ...stairs];
  }, [roomId]);

  function travel(id) {
    if (id === roomId) { setReading(true); return; }
    const rel = neighborsOf(roomId).find((n) => n.id === id);
    history.current.push(roomId);
    if (rel) nav.stepTo(id, rel.heading); else nav.goRoom(id);
  }
  function goBack() {
    if (history.current.length) { const prev = history.current.pop(); nav.stepTo(prev, null); }
    else nav.goGallery();
  }
  function openMap(scope) { setMapScope(scope); }
  function pickFromMap(id) { setMapScope(null); travel(id); }

  if (!room) return null;
  const anc = lineageOf(room.building);

  return (
    <div className="walk-root" ref={rootRef}>
      <div className="wk-frames">
        {exiting && <Frame key={exiting.key} room={exiting.room} anim={`leave-${exiting.dir}`} onReadMore={() => setReading(true)} />}
        <Frame key={current.key} room={current.room || room} anim={`enter-${current.dir}`} onReadMore={() => setReading(true)} />
      </div>

      {exiting && <div className="wk-wipe" key={`w${exiting.key}`} style={{ '--wk-wipe-angle': WIPE_ANGLE[exiting.dir] || '90deg' }} />}

      {/* top bar: crumbs + map */}
      <div className="wk-topbar">
        <div className="wk-crumbs">
          <button className="wk-crumb link" onClick={() => openMap('compound')}>Compound</button>
          <span className="wk-crumb-sep">›</span>
          <button className="wk-crumb link" onClick={() => openMap('building')}>{room.building}</button>
          <span className="wk-crumb-sep">›</span>
          <span className="wk-crumb here">{shortName(room.name)}</span>
        </div>
        <button className="wk-mapbtn" onClick={() => openMap('building')} aria-label="Open the map">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>
          Map
        </button>
      </div>

      {hint && <div className="wk-hint on">{hint}</div>}

      {/* bottom dock: exits + back (thumb zone) */}
      <div className="wk-dock" ref={dockRef}>
        <div className="wk-compass">
          {exits.map((n) => {
            const r = byId[n.id]; if (!r) return null;
            const f = lineageOf(r.building).fam;
            const arw = n.vert ? STAIR_ARROW[n.vert] : ARROW[n.heading];
            return (
              <button key={n.id} className={`wk-exit${n.via === 'opening' ? ' opening' : ''}${n.vert ? ' stair' : ''}`}
                data-fam={f} onClick={() => travel(n.id)}>
                <span className="arw">{arw}</span>
                <span className="nm">{shortName(r.name)}</span>
                <span className="via">{n.vert ? `${n.vert} · stair` : n.via}</span>
              </button>
            );
          })}
        </div>
        <div className="wk-dock-row">
          <button className="wk-iconbtn" onClick={goBack}>← Back</button>
          <span className="spacer" />
          <span className="wk-north-hint">N<b>↑</b></span>
        </div>
      </div>

      {/* landscape survey: always-on map + reading line + exits */}
      <div className="wk-survey">
        <div className="sv-map"><WalkMap scope="building" currentId={roomId} names={names} onPick={travel} /></div>
        <div className="sv-read">
          <div className="nm" style={{ color: anc.hex }}>{room.name}</div>
          <div className="ln">{room.intent ? firstSentence(room.intent) : 'Step into the massing to read this volume.'}</div>
        </div>
        <div className="sv-exits">
          {exits.map((n) => {
            const r = byId[n.id]; if (!r) return null;
            const arw = n.vert ? STAIR_ARROW[n.vert] : ARROW[n.heading];
            return (
              <button key={n.id} className={`wk-exit${n.via === 'opening' ? ' opening' : ''}${n.vert ? ' stair' : ''}`}
                data-fam={lineageOf(r.building).fam} onClick={() => travel(n.id)}>
                <span className="arw">{arw}</span><span className="nm">{shortName(r.name)}</span>
                <span className="via">{n.vert ? `${n.vert} · stair` : n.via}</span>
              </button>
            );
          })}
          <button className="wk-iconbtn" onClick={() => setReading(true)}>Reading the room ↗</button>
        </div>
      </div>

      {/* map overlay (portrait) */}
      <div className={`wk-mapoverlay${mapScope ? ' on' : ''}`}>
        <div className="wk-map-head">
          <div className="ttl">{mapScope === 'compound' ? 'The Compound' : room.building}
            <small>{mapScope === 'compound' ? 'Tap a space to walk there' : 'Walkable from here'}</small>
          </div>
          <div className="wk-scope">
            <button className={`wk-scopebtn${mapScope === 'building' ? ' on' : ''}`} onClick={() => setMapScope('building')}>Building</button>
            <button className={`wk-scopebtn${mapScope === 'compound' ? ' on' : ''}`} onClick={() => setMapScope('compound')}>Compound</button>
            <button className="wk-scopebtn" onClick={() => { setMapScope(null); nav.goGallery(); }}>⌂ Lookbook</button>
          </div>
          <button className="wk-mapclose" onClick={() => setMapScope(null)} aria-label="Close map">✕</button>
        </div>
        <div className="wk-map">
          {mapScope && <WalkMap scope={mapScope} currentId={roomId} names={names} onPick={pickFromMap} />}
        </div>
        <div className="wk-map-legend">
          <span className="lg"><i style={{ background: '#7BA177' }} />The Glebe</span>
          <span className="lg"><i style={{ background: '#6189BE' }} />Capt. Jack's</span>
          <span className="lg"><i style={{ background: '#C79E58' }} />Hill Country</span>
        </div>
      </div>

      <ReadingSheet room={room} open={reading} onClose={() => setReading(false)} onStepInto={(id) => nav.enterMassing(id)} />
    </div>
  );
}
