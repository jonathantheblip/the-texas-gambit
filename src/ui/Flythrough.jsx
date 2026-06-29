import { useEffect, useState } from 'react';
import CompoundScene from '../scene/CompoundScene.jsx';
import { cameraBus } from '../scene/cameraBus.js';
import { facingOf } from '../data/facings.js';

/**
 * Flythrough — the 3D substrate that lives UNDER the walk's render "veil" while
 * Fly is on. Code owns the camera: the Walk lifts the leaving render to reveal
 * this, calls cameraBus.driftTo(neighbour), and settles the next render over it
 * on arrival — so you feel how one room connects to the next.
 *
 * - Massing only (solid volumes, no render billboards), dark so it sits under the
 *   night-walk, non-interactive (this is a transition, not the inspector you step
 *   into from the reading sheet).
 * - Frameloop is 'always' while warming up (until the first frame paints) and
 *   during a flight (`active`), then 'demand' — an idle substrate costs ~no GPU
 *   on Helen's phone even though it stays mounted (and warm) for the next hop.
 * - Lazy-loaded by the Walk, so three.js stays out of the first paint.
 */
export default function Flythrough({ rooms, currentId, active }) {
  const [ready, setReady] = useState(false);
  useEffect(() => cameraBus.onReady(() => setReady(true)), []);
  const frameloop = active || !ready ? 'always' : 'demand';

  return (
    <div className="wk-fly" aria-hidden="true">
      <CompoundScene
        rooms={rooms}
        framingRooms={rooms}
        selectedId={currentId}
        onSelect={() => {}}
        mode="massing"
        entryFacing={facingOf(currentId)}
        instantArrival
        enableControls={false}
        background="#0e0c08"
        frameloop={frameloop}
      />
    </div>
  );
}
