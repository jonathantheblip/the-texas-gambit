/**
 * "You are here" — a plan of the whole compound drawn from the room footprints,
 * with the current room marked. Helps Helen hold the whole house in her head as
 * she walks it. North is up. Read-only for now (Design can make it tappable).
 */
import { ALL_ROOMS } from '../data/rooms.js';
import { PALETTE } from '../model/compoundModel.js';

const rgb = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
const PAD = 14;
// The Observatory is an isolated folly 270' out — including it squashes the
// house cluster, so leave it off the plan (its dot clamps to the edge if current).
const EXCLUDE = new Set(['observatory_tower']);
const MAPPED = ALL_ROOMS.filter((r) => !EXCLUDE.has(r.id));

// Plan bounds (computed once, over the mapped rooms).
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const r of MAPPED) {
  minX = Math.min(minX, r.x); maxX = Math.max(maxX, r.x + r.w);
  minY = Math.min(minY, r.y); maxY = Math.max(maxY, r.y + r.d);
}
const W = maxX - minX, H = maxY - minY;
// SVG y is flipped so North (greater y) is up.
const sx = (x) => (x - minX) + PAD;
const sy = (y) => (maxY - y) + PAD;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function Minimap({ currentId }) {
  const cur = ALL_ROOMS.find((r) => r.id === currentId);
  return (
    <svg className="minimap" viewBox={`0 0 ${W + PAD * 2} ${H + PAD * 2}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="You are here on the compound plan">
      {MAPPED.map((r) => (
        <rect
          key={r.id}
          x={sx(r.x)} y={sy(r.y + r.d)} width={r.w} height={r.d}
          fill={rgb(PALETTE[r.building] || PALETTE.Other)}
          opacity={r.id === currentId ? 0.9 : 0.3}
          stroke="#00000022" strokeWidth={0.5}
        />
      ))}
      {cur && (
        <circle
          cx={clamp(sx(cur.x + cur.w / 2), PAD, W + PAD)}
          cy={clamp(sy(cur.y + cur.d / 2), PAD, H + PAD)}
          r={Math.max(7, W * 0.022)}
          fill="#b5462f" stroke="#fff" strokeWidth={2}
        />
      )}
      <text x={W / 2 + PAD} y={PAD - 3} fontSize="10" textAnchor="middle" fill="#9a3b2a" fontFamily="monospace">N</text>
    </svg>
  );
}
