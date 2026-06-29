import { useMemo } from 'react';
import { compoundPlan } from '../data/plan.js';
import { neighborsOf } from '../data/adjacency.js';
import { lineageOf } from '../data/lineage.js';

/**
 * The ONE shared map. Crumbs, this map, and the compass all read the single
 * current room (navStore), so wayfinding can never disagree with itself.
 *
 * Two scopes of the same plan (footprints straight from compoundPlan — we never
 * author geometry here):
 *   • building — the current room's building + floor, room names shown
 *   • compound — the whole estate, color = building lineage, buildings labeled
 * Current room = bright fill + ring. Walkable neighbors = dashed outline. Tap any
 * room to walk there (Walk animates a heading-aware arrival).
 */
const PLAN = compoundPlan.rooms;
const BY = Object.fromEntries(PLAN.map((p) => [p.id, p]));
const B = compoundPlan.bounds;
const ASPECT = B.height / B.width;
const short = (name, id) => (name || id).replace(/\s*\(.*\)$/, '');
const ROOM_NAME = {};

function fitTo(ids, pad) {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  ids.forEach((id) => {
    const p = BY[id]; if (!p) return;
    x0 = Math.min(x0, p.nx); y0 = Math.min(y0, p.ny);
    x1 = Math.max(x1, p.nx + p.nw); y1 = Math.max(y1, p.ny + p.nh);
  });
  if (x1 <= x0) return { x: 0, y: 0, w: 100, h: 100 * ASPECT };
  const X0 = x0 * 100, X1 = x1 * 100, Y0 = y0 * 100 * ASPECT, Y1 = y1 * 100 * ASPECT;
  const px = (X1 - X0) * pad, py = (Y1 - Y0) * pad;
  return { x: X0 - px, y: Y0 - py, w: (X1 - X0) + px * 2, h: (Y1 - Y0) + py * 2 };
}

export default function WalkMap({ scope = 'building', currentId, names = {}, onPick }) {
  Object.assign(ROOM_NAME, names);
  const cur = BY[currentId];
  const nb = useMemo(() => new Set(neighborsOf(currentId).map((n) => n.id)), [currentId]);

  const { ids, vb, showLabels } = useMemo(() => {
    if (scope === 'building' && cur) {
      const fam = PLAN.filter((p) => p.building === cur.building && p.floor === cur.floor).map((p) => p.id);
      const ctx = new Set(fam); nb.forEach((id) => { if (BY[id]?.floor === cur.floor) ctx.add(id); });
      ctx.add(currentId);
      const list = [...ctx];
      return { ids: list, vb: fitTo(list, 0.16), showLabels: list.length <= 16 };
    }
    return { ids: PLAN.map((p) => p.id), vb: { x: -2, y: -2, w: 104, h: 100 * ASPECT + 4 }, showLabels: false };
  }, [scope, currentId, cur, nb]);

  const unit = vb.w / 100;
  const sw = unit * 0.6;

  // building lineage tint blobs (compound scope)
  const blobs = useMemo(() => {
    if (scope === 'building') return [];
    const groups = {};
    PLAN.forEach((p) => { (groups[p.building] ||= []).push(p.id); });
    return Object.entries(groups).map(([b, list]) => ({ b, f: fitTo(list, 0.06), anc: lineageOf(b) }));
  }, [scope]);

  return (
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Compound plan — you are here">
      {blobs.map(({ b, f, anc }) => (
        <rect key={`blob-${b}`} x={f.x} y={f.y} width={f.w} height={f.h} rx={unit * 1.2} fill={anc.soft} />
      ))}

      {ids.map((id) => {
        const p = BY[id]; if (!p) return null;
        const anc = lineageOf(p.building);
        const isCur = id === currentId;
        const isNb = nb.has(id);
        const x = p.nx * 100, y = p.ny * 100 * ASPECT, w = Math.max(p.nw * 100, unit * 0.8), h = Math.max(p.nh * 100 * ASPECT, unit * 0.8);
        const fill = isCur ? anc.hex : isNb ? anc.soft : (scope === 'building' ? anc.soft : 'rgba(236,228,212,.07)');
        const stroke = isCur ? '#fff' : isNb ? anc.edge : 'rgba(236,228,212,.18)';
        return (
          <g key={id}>
            {isCur && (
              <rect x={x - unit * 0.8} y={y - unit * 0.8} width={w + unit * 1.6} height={h + unit * 1.6} rx={unit}
                fill="none" stroke="#fff" strokeWidth={sw * 0.7} opacity=".55" />
            )}
            <rect className="wk-rrect" x={x} y={y} width={w} height={h} rx={unit * 0.4}
              fill={fill} stroke={stroke}
              strokeWidth={isCur ? sw * 1.6 : isNb ? sw : sw * 0.7}
              strokeDasharray={isNb && !isCur ? `${unit * 1.4} ${unit * 1.0}` : undefined}
              opacity={isCur || isNb ? 1 : (scope === 'building' ? 0.9 : 0.62)}
              onClick={(e) => { e.stopPropagation(); onPick && onPick(id); }} />
            {/* touch halo for tiny rects */}
            {(w < unit * 3 || h < unit * 3) && (
              <rect x={x - unit} y={y - unit} width={w + unit * 2} height={h + unit * 2} fill="transparent"
                style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onPick && onPick(id); }} />
            )}
            {showLabels && (
              <text className="wk-rlabel" x={x + w / 2} y={y + h / 2 + unit * 0.9} textAnchor="middle"
                style={{ fontSize: `${unit * 2.4}px` }} fill={isCur ? '#0e0c08' : 'rgba(236,228,212,.85)'}>
                {(() => { const s = short(ROOM_NAME[id], id); return s.length > 16 ? s.slice(0, 15) + '…' : s; })()}
              </text>
            )}
          </g>
        );
      })}

      {scope !== 'building' && blobs.map(({ b, f, anc }) => {
        const hasCur = cur && cur.building === b;
        return (
          <text key={`lbl-${b}`} className="wk-blabel" x={f.x + f.w / 2} y={f.y + f.h / 2} textAnchor="middle"
            style={{ fontSize: `${unit * 2.5}px`, fontWeight: hasCur ? 600 : 400 }}
            fill={hasCur ? '#fff' : 'rgba(236,228,212,.5)'}>{b}</text>
        );
      })}

      <text className="wk-northn" x={vb.x + vb.w - unit * 5} y={vb.y + unit * 6.5} style={{ fontSize: `${unit * 3.4}px` }}>N ↑</text>
    </svg>
  );
}
