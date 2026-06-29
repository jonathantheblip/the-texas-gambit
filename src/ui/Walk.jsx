import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { nav } from '../nav/navStore.js';
import { useNav } from '../nav/useNav.js';
import { neighborsOf } from '../data/adjacency.js';
import { lineageOf } from '../data/lineage.js';
import { FEEL } from '../data/feel.js';
import { cameraBus } from '../scene/cameraBus.js';
import { getFlyEnabled, setFlyEnabled as persistFlyEnabled, arrivalFacing } from '../scene/flyto.js';
import { pinsFor } from '../data/pins.js';
import WalkMap from './WalkMap.jsx';
import ReadingSheet from './ReadingSheet.jsx';
import RenderPins from './RenderPins.jsx';
import RestingPins from './RestingPins.jsx';

// The 3D substrate that flies you between rooms (Fly mode). Lazy so three.js
// stays out of the render-led first paint — warmed when you enter the walk.
const Flythrough = lazy(() => import('./Flythrough.jsx'));

const ORDER = { N: 0, E: 1, S: 2, W: 3 };
const ARROW = { N: '↑', S: '↓', E: '→', W: '←' };
const STAIR_ARROW = { up: '⇧', down: '⇩' };
const HEADING_WORD = { N: 'North', S: 'South', E: 'East', W: 'West' };
const WIPE_ANGLE = { N: '180deg', S: '0deg', E: '90deg', W: '270deg', up: '180deg', down: '0deg', none: '90deg' };
const FLY_LAND_MS = 520;   // the arriving render fades in over this long, after the camera lands
const FLY_MAX_MS = 2200;   // safety: settle the arriving render even if onArrival never fires
const firstSentence = (t) => { const m = t && t.match(/^[^.]+\./); return m ? m[0] : (t || '').slice(0, 90); };

/** A render frame — the "you are standing here" surface, with its caption.
 *  Render pins (Design's entry affordance) breathe on the render itself — no chip;
 *  they're passed only to the room you're standing in, never the one leaving. */
function Frame({ room, anim, onReadMore, pins = null, onOpenPin }) {
  const anc = lineageOf(room.building);
  const cues = (FEEL[room.id] || []).slice(0, 2);
  return (
    <div className={`wk-frame ${room.renderImage ? 'has-render' : 'no-render'} ${anim}`}
      style={room.renderImage ? { backgroundImage: `url("${room.renderImage}")` } : undefined}>
      {!room.renderImage && <div className="wk-massing-mark"><div className="box" /></div>}
      {room.renderImage && pins && pins.length > 0 && (
        <RestingPins render={room.renderImage} pins={pins} onOpen={onOpenPin} />
      )}
      <div className="wk-cap">
        <div className="wk-cap-meta">
          <span className="fam" style={{ background: anc.hex }} />
          <span>{room.building} · {room.floorLabel} · {room.area} ft²</span>
        </div>
        <h1 className="wk-cap-name">{room.displayName}</h1>
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
  const names = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, r.displayName])), [rooms]);
  const roomId = view.roomId;
  const room = byId[roomId];
  const pins = useMemo(() => pinsFor(roomId), [roomId]);

  const [reading, setReading] = useState(false);
  const [lcPin, setLcPin] = useState(null);   // look-closer: null = closed, else the tapped pin index
  const [mapScope, setMapScope] = useState(null);   // null = closed, else 'building' | 'compound'
  const [hint, setHint] = useState('');
  const [exiting, setExiting] = useState(null);     // { room, dir, key, kind:'wipe'|'fly' }
  const [current, setCurrent] = useState(() => ({ room, dir: 'none', key: 'k0' }));
  // Fly mode: the camera flies through the 3D massing between rooms instead of the
  // flat render wipe. flyReady flips once the substrate's first frame has painted.
  const [flyEnabled, setFlyEnabled] = useState(getFlyEnabled);
  const [flyReady, setFlyReady] = useState(false);
  const [flyActive, setFlyActive] = useState(false);   // a flight is in progress (drives the substrate frameloop)
  const [flyPhase, setFlyPhase] = useState('idle');    // 'idle' | 'lift' | 'land'
  const [reduceMotion] = useState(() => {
    try { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false; }
    catch { return false; }
  });
  const seq = useRef(0);
  const prevId = useRef(roomId);
  const history = useRef([]);
  const rootRef = useRef(null);
  const dockRef = useRef(null);
  const hintT = useRef(null);

  // The substrate emits onReady when its first frame paints (camera seated in the
  // current room). Until then we fall back to the wipe so a flight never starts cold.
  useEffect(() => cameraBus.onReady(() => setFlyReady(true)), []);

  function toggleFly() {
    setFlyEnabled((on) => {
      const next = !on;
      persistFlyEnabled(next);
      if (!next) { setFlyReady(false); setFlyActive(false); setFlyPhase('idle'); }
      return next;
    });
  }

  // arrival: when the current room changes, animate the new render in from the
  // travel heading and the old one out the opposite way (direction from the graph).
  useEffect(() => {
    if (roomId === prevId.current) return;
    const from = byId[prevId.current];
    const rel = neighborsOf(prevId.current).find((n) => n.id === roomId);
    const dir = rel ? (rel.vert || rel.heading || 'none') : 'none';
    seq.current += 1;

    // arrival hint (both paths)
    if (rel?.vert) showHint(`${rel.vert === 'up' ? 'Up the stair to ' : 'Down to '}${byId[roomId]?.displayName}`);
    else if (rel?.heading) showHint(`${HEADING_WORD[rel.heading]} into ${byId[roomId]?.displayName}`);

    // FLY — dissolve the leaving render to reveal the massing, fly the camera to
    // the next room, then settle its render in on arrival. Only once the substrate
    // is warm (flyReady); otherwise fall through to the wipe so a hop never starts cold.
    const flyNow = flyEnabled && !reduceMotion && flyReady && cameraBus.isReady();
    if (flyNow) {
      setExiting(from ? { room: from, dir, key: `x${seq.current}`, kind: 'fly' } : null);
      setCurrent({ room: byId[roomId], dir, key: `e${seq.current}`, kind: 'fly' });
      setFlyPhase('lift');
      setFlyActive(true);
      cameraBus.driftTo(roomId, arrivalFacing(rel, roomId));
      prevId.current = roomId;

      let landed = false, landT;
      const land = () => {
        if (landed) return; landed = true;
        setFlyPhase('land');                                     // arriving render fades in over the 3D
        landT = setTimeout(() => { setExiting(null); setFlyActive(false); }, FLY_LAND_MS);
      };
      const offArr = cameraBus.onArrival((id) => { if (id === roomId) { offArr(); land(); } });
      const safety = setTimeout(() => { offArr(); land(); }, FLY_MAX_MS);
      return () => { offArr(); clearTimeout(safety); clearTimeout(landT); };
    }

    // WIPE — the directional render cross-fade (the original behaviour).
    if (from) setExiting({ room: from, dir, key: `x${seq.current}`, kind: 'wipe' });
    setCurrent({ room: byId[roomId], dir, key: `e${seq.current}`, kind: 'wipe' });
    prevId.current = roomId;
    const ms = (dir === 'up' || dir === 'down') ? 720 : (dir === 'none' ? 560 : 640);
    const t = setTimeout(() => setExiting(null), ms + 60);
    return () => clearTimeout(t);
  }, [roomId, byId]); // eslint-disable-line react-hooks/exhaustive-deps

  // welcome hint on first mount
  useEffect(() => {
    const t = setTimeout(() => showHint(roomId === 'front_porch' ? "You're on the Front Porch — walk inside" : `You're in ${room?.displayName}`), 450);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // close the look-closer whenever you move to another room
  useEffect(() => { setLcPin(null); }, [roomId]);

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
        {flyEnabled && (
          <Suspense fallback={null}>
            <Flythrough rooms={rooms} currentId={roomId} active={flyActive} />
          </Suspense>
        )}
        {exiting && <Frame key={exiting.key} room={exiting.room}
          anim={exiting.kind === 'fly' ? 'fly-veil' : `leave-${exiting.dir}`} onReadMore={() => setReading(true)} />}
        <Frame key={current.key} room={current.room || room}
          anim={current.kind === 'fly' ? (flyPhase === 'land' ? 'fly-land' : 'fly-hold') : `enter-${current.dir}`}
          onReadMore={() => setReading(true)}
          pins={pins} onOpenPin={(i) => setLcPin(i)} />
      </div>

      {exiting && <div className="wk-wipe" key={`w${exiting.key}`} style={{ '--wk-wipe-angle': WIPE_ANGLE[exiting.dir] || '90deg' }} />}

      {/* top bar: crumbs + map */}
      <div className="wk-topbar">
        <div className="wk-crumbs">
          <button className="wk-crumb link" onClick={() => openMap('compound')}>Compound</button>
          <span className="wk-crumb-sep">›</span>
          <button className="wk-crumb link" onClick={() => openMap('building')}>{room.building}</button>
          <span className="wk-crumb-sep">›</span>
          <span className="wk-crumb here">{room.displayName}</span>
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
                <span className="nm">{r.displayName}</span>
                <span className="via">{n.vert ? `${n.vert} · stair` : n.via}</span>
              </button>
            );
          })}
        </div>
        <div className="wk-dock-row">
          <button className="wk-iconbtn" onClick={goBack}>← Back</button>
          <button className={`wk-flybtn${flyEnabled ? ' on' : ''}`} onClick={toggleFly}
            aria-pressed={flyEnabled} disabled={reduceMotion}
            title={reduceMotion ? 'Off while your device is set to reduced motion' : 'Fly through the 3D model when you move between rooms'}>
            <span className="g" aria-hidden="true">✈</span> Fly
          </button>
          <span className="spacer" />
          <span className="wk-north-hint">N<b>↑</b></span>
        </div>
      </div>

      {/* landscape survey: always-on map + reading line + exits */}
      <div className="wk-survey">
        <div className="sv-map"><WalkMap scope="building" currentId={roomId} names={names} onPick={travel} /></div>
        <div className="sv-read">
          <div className="nm" style={{ color: anc.hex }}>{room.displayName}</div>
          <div className="ln">{room.intent ? firstSentence(room.intent) : 'Step into the massing to read this volume.'}</div>
        </div>
        <div className="sv-exits">
          {exits.map((n) => {
            const r = byId[n.id]; if (!r) return null;
            const arw = n.vert ? STAIR_ARROW[n.vert] : ARROW[n.heading];
            return (
              <button key={n.id} className={`wk-exit${n.via === 'opening' ? ' opening' : ''}${n.vert ? ' stair' : ''}`}
                data-fam={lineageOf(r.building).fam} onClick={() => travel(n.id)}>
                <span className="arw">{arw}</span><span className="nm">{r.displayName}</span>
                <span className="via">{n.vert ? `${n.vert} · stair` : n.via}</span>
              </button>
            );
          })}
          <button className="wk-iconbtn" onClick={() => setReading(true)}>Reading the room ↗</button>
          <button className={`wk-flybtn${flyEnabled ? ' on' : ''}`} onClick={toggleFly}
            aria-pressed={flyEnabled} disabled={reduceMotion}
            title="Fly through the 3D model when you move between rooms">
            <span className="g" aria-hidden="true">✈</span> Fly between rooms
          </button>
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

      {lcPin != null && room.renderImage && pins.length > 0 &&
        <RenderPins room={room} pins={pins} initial={lcPin} onClose={() => setLcPin(null)} />}
    </div>
  );
}
