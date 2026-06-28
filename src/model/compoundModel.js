/**
 * compoundModel.js — framework-agnostic core for the Hill Country compound model.
 *
 * No three.js, no DOM, no framework. Pure functions: room table -> geometry params,
 * and the validation gate. Wire this into react-three-fiber (or anything) on top.
 * Behavior matches the reference viewer (compound_model.html) and the Python gate
 * (validate.py) exactly — keep all three in sync if you change the rules.
 *
 * COORDINATE CONVENTION (do not change without re-deriving everything):
 *   x = East(+), y = North(+), z = Up(+); units = feet.
 *   Origin (0,0,0) = the Main Block's SW ground-floor corner.
 *   A room is its SW corner (x,y), footprint W (east-west) x D (north-south), zFloor..zCeil.
 *   three.js / glTF are Y-up, so a room maps to:
 *       position = [East, Up, -North] = [x+W/2, zFloor+height/2, -(y+D/2)]
 *       scale    = [W, height, D]
 *
 * THE PRINCIPLE: the room table is the source of truth. Geometry is generated from it.
 * Validation gates every edit. The .gltf is a regenerated export, never the source.
 */

export const LOCKS = {
  guestSuiteTotal: 350,           // ft^2
  observatoryPoolMin: 200,        // ft setback
  observatoryMotorBarnMin: 150,   // ft setback
};

// building -> base color [r,g,b] in 0..1
export const PALETTE = {
  "Main Block":        [0.79, 0.72, 0.61],
  "Service Wing":      [0.73, 0.66, 0.55],
  "Wharf Wing":        [0.62, 0.71, 0.76],
  "Motor Barn":        [0.55, 0.48, 0.39],
  "Observatory":       [0.37, 0.42, 0.45],
  "Orangery":          [0.65, 0.76, 0.69],
  "Covered Walkway":   [0.76, 0.76, 0.74],
  "Cedar Pavilion":    [0.65, 0.46, 0.29],
  "Pool & Terrace":    [0.44, 0.66, 0.78],
  "North Alley Pergola":[0.61, 0.42, 0.31],
  "Other":             [0.70, 0.70, 0.70],
};

// render-state -> opacity. Locked bones read solid; best-guess reads translucent;
// containers (carved parents / open-to-above volumes) read as a ghost shell so the
// child inside them isn't double-rendered as solid mass.
export const ALPHA = { locked: 1.0, provisional: 0.55, container: 0.16 };

/**
 * VALIDATION ANCHORS — resolved by room NAME at validate() time (names are stable).
 * If you rename any of these rooms in the table, update the names here too.
 * `allowOverlap` is the closed list of carved-child / open-to-above pairs that ARE
 * permitted to overlap in plan. EVERY other same-building, same-floor overlap is a bug.
 */
export const ANCHORS = {
  guestSuite:  ["Guest Bedroom", "Guest Sitting", "Guest En-Suite"],
  observatory: "Observatory tower",
  pool:        "Pool",
  allowOverlap: [
    ["Powder Room", "Everyday Dining (N-ctr)"],
    ["Pink En-Suite (Aurelia)", "Aurelia's Provincetown Suite (NW, over Oval)"],
    ["Rafa En-Suite", "Rafa's Texas Room (SE, over Great)"],
    ["Podcast Studio", "Loft"],
    ["Pool", "Pool Terrace"],
  ],
};

/** room -> geometry/material params for a Y-up renderer (three.js / r3f). */
export function roomBox(room) {
  const cx = room.x + room.w / 2;
  const cyN = room.y + room.d / 2;
  const czU = room.zFloor + room.height / 2;
  return {
    position: [cx, czU, -cyN],
    scale:    [room.w, room.height, room.d],
    color:    PALETTE[room.building] || PALETTE.Other,
    opacity:  ALPHA[room.render] ?? 1.0,
    isContainer:   room.render === "container",
    isProvisional: room.render === "provisional",
    isLocked:      room.render === "locked",
  };
}

function rectOf(r) { return [r.x, r.y, r.x + r.w, r.y + r.d]; }

export function rectDist(a, b) {
  const A = rectOf(a), B = rectOf(b);
  const dx = Math.max(B[0] - A[2], A[0] - B[2], 0);
  const dy = Math.max(B[1] - A[3], A[1] - B[3], 0);
  return Math.hypot(dx, dy);
}

export function overlapArea(a, b) {
  const A = rectOf(a), B = rectOf(b);
  const ox = Math.max(0, Math.min(A[2], B[2]) - Math.max(A[0], B[0]));
  const oy = Math.max(0, Math.min(A[3], B[3]) - Math.max(A[1], B[1]));
  return ox * oy;
}

/**
 * Run the v2 locks against the current table. Returns { ok, checks }.
 * Call this on EVERY edit path (in-app drag/typing, import, etc.) and surface failures.
 * A failing check means a lock broke — block the merge, or at minimum flag it red.
 */
export function validate(rooms) {
  const byName = (n) => rooms.find((r) => r.name === n);
  const checks = [];

  // 1) Guest Suite total
  const gs = ANCHORS.guestSuite.reduce((s, n) => {
    const r = byName(n);
    return s + (r ? r.w * r.d : 0);
  }, 0);
  checks.push({
    id: "guestSuite",
    ok: Math.abs(gs - LOCKS.guestSuiteTotal) <= 5,
    msg: `Guest Suite ${Math.round(gs)} ft\u00b2 vs ${LOCKS.guestSuiteTotal} locked`,
  });

  // 2) Observatory setbacks
  const obs = byName(ANCHORS.observatory);
  const pool = byName(ANCHORS.pool);
  const dPool = obs && pool ? rectDist(obs, pool) : Infinity;
  const mb = rooms.filter((r) => r.building === "Motor Barn");
  const dMb = obs && mb.length ? Math.min(...mb.map((m) => rectDist(obs, m))) : Infinity;
  checks.push({
    id: "setbackPool",
    ok: dPool >= LOCKS.observatoryPoolMin,
    msg: `Observatory \u2192 pool ${Math.round(dPool)}\u2032 (\u2265${LOCKS.observatoryPoolMin})`,
  });
  checks.push({
    id: "setbackMotorBarn",
    ok: dMb >= LOCKS.observatoryMotorBarnMin,
    msg: `Observatory \u2192 Motor Barn ${Math.round(dMb)}\u2032 (\u2265${LOCKS.observatoryMotorBarnMin})`,
  });

  // 3) Overlaps (same building + same floor; abutting is fine; carved pairs excluded)
  const allow = new Set();
  ANCHORS.allowOverlap.forEach(([a, b]) => {
    const ra = byName(a), rb = byName(b);
    if (ra && rb) { allow.add(ra.id + "|" + rb.id); allow.add(rb.id + "|" + ra.id); }
  });
  const bad = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i], b = rooms[j];
      if (a.building !== b.building || a.zFloor !== b.zFloor) continue;
      if (allow.has(a.id + "|" + b.id)) continue;
      if (overlapArea(a, b) > 0.5) bad.push(`${a.name} \u00d7 ${b.name}`);
    }
  }
  checks.push({
    id: "overlaps",
    ok: bad.length === 0,
    msg: bad.length ? `${bad.length} overlap: ${bad[0]}` : "No accidental overlaps",
    detail: bad,
  });

  return { ok: checks.every((c) => c.ok), checks };
}
