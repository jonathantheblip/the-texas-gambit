/**
 * buildingMasses — collapse the room table into one mass per building for the
 * whole-compound bird's-eye. Pure (no three.js) so it's unit-tested.
 *
 * Each mass = the building's bounding volume (world coords per compoundModel:
 * x=East(+x), North=−z, Up=+y), its palette colour, its build phase, and the
 * room to fly into when you click it (its biggest space that has a render, else
 * just its biggest).
 */
import { PALETTE } from '../model/compoundModel.js';
import { phaseOf, phaseRankOf } from '../data/phases.js';

export function buildingsOf(rooms) {
  const groups = {};
  for (const r of rooms) (groups[r.building] ||= []).push(r);
  return Object.entries(groups).map(([building, rs]) => {
    const minX = Math.min(...rs.map((r) => r.x));
    const maxX = Math.max(...rs.map((r) => r.x + r.w));
    const minY = Math.min(...rs.map((r) => r.y));
    const maxY = Math.max(...rs.map((r) => r.y + r.d));
    const minF = Math.min(...rs.map((r) => r.zFloor));
    const maxC = Math.max(...rs.map((r) => r.zCeil ?? r.zFloor + r.height));
    const withRender = rs.filter((r) => r.renderImage);
    const flyTo = (withRender.length ? withRender : rs).reduce((a, b) => (b.w * b.d > a.w * a.d ? b : a));
    return {
      building,
      phase: phaseOf(building),         // '2A' | '2B' | '2C' label
      phaseRank: phaseRankOf(building), // 1..n, for the opacity fade
      color: PALETTE[building] || PALETTE.Other,
      center: [(minX + maxX) / 2, (minF + maxC) / 2, -((minY + maxY) / 2)],
      size: [Math.max(maxX - minX, 1), Math.max(maxC - minF, 1), Math.max(maxY - minY, 1)],
      top: maxC,
      count: rs.length,
      flyToId: flyTo.id,
    };
  });
}

/** Phase → fill opacity: phase 1 reads solid (.8), the last phase faint (.3). */
export function phaseOpacity(phase, maxPhase) {
  if (!phase || !maxPhase || maxPhase <= 1) return 0.5;
  const t = (phase - 1) / (maxPhase - 1);
  return +(0.8 - t * 0.5).toFixed(2);
}
