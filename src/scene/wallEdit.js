/**
 * wallEdit — the pure geometry of grabbing a wall and dragging it `delta` feet
 * outward. Framework-free so it's unit-tested without three.js.
 *
 * The wall you hold moves; the opposite wall stays anchored. E/W resize width,
 * N/S resize depth, Top resizes height. W and S also shift the SW corner (x/y) so
 * the far wall stays put. Every dimension is clamped to MIN_DIM and rounded to a
 * whole foot (matching the number-input editor). Coords per compoundModel.
 */
export const MIN_DIM = 4; // smallest a room dimension can get, feet

const clampRound = (v) => Math.max(MIN_DIM, Math.round(v));

/** kind ∈ E|W|N|S|T. s = starting {x,y,w,d,h}. Returns a sparse override patch. */
export function wallResize(kind, s, delta) {
  switch (kind) {
    case 'E': return { w: clampRound(s.w + delta) };
    case 'W': { const w = clampRound(s.w + delta); return { x: s.x + s.w - w, w }; }
    case 'N': return { d: clampRound(s.d + delta) };
    case 'S': { const d = clampRound(s.d + delta); return { y: s.y + s.d - d, d }; }
    case 'T': return { height: clampRound(s.h + delta) };
    default: return {};
  }
}
