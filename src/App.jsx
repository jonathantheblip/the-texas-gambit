import { lazy, Suspense, useMemo } from 'react';
import { ALL_ROOMS, applyOverrides } from './data/rooms.js';
import { neighborsOf } from './data/adjacency.js';
import { useGeometry } from './store/useGeometry.js';
import { nav } from './nav/navStore.js';
import { useNav } from './nav/useNav.js';
import Gallery from './ui/Gallery.jsx';
import RoomView from './ui/RoomView.jsx';
import MassingCurtain from './ui/MassingCurtain.jsx';

// The 3D view pulls in three.js / r3f / drei (~1 MB). Load it only when the
// user steps into the massing, so the render-forward gallery stays light on mobile.
const ModelView = lazy(() => import('./ui/ModelView.jsx'));

/**
 * Render-forward shell. Routing is driven by the single nav source (navStore),
 * so crumbs / minimap / walk all agree on the current room.
 *   gallery → room (render as "you are here") → walk to a neighbor, or step into 3D.
 */
export default function App() {
  const view = useNav();
  const { overrides } = useGeometry();
  const rooms = useMemo(() => applyOverrides(ALL_ROOMS, overrides), [overrides]);

  if (view.mode === 'model') {
    const focusRoom = rooms.find((r) => r.id === (view.focusId || view.roomId));
    return (
      <>
        <Suspense fallback={<div className="loading-3d">Loading the 3D model…</div>}>
          <ModelView
            initialSelectedId={view.focusId || view.roomId || null}
            facing={view.facing}
            arriving={view.fromWalk}
            backLabel={view.fromWalk ? '← Back to the walk' : '← Compound'}
            onExit={() => (view.fromWalk ? nav.goRoom(view.focusId || view.roomId) : nav.goGallery())}
            onOpenRender={(id) => nav.goRoom(id)}
          />
        </Suspense>
        {/* Held render that cross-fades into the 3D when you step through (kept
            OUTSIDE Suspense so it covers the lazy-load too — no "Loading" flash). */}
        {view.fromWalk && focusRoom?.renderImage && <MassingCurtain src={focusRoom.renderImage} />}
      </>
    );
  }

  if (view.mode === 'room') {
    const room = rooms.find((r) => r.id === view.roomId);
    const byId = (id) => rooms.find((r) => r.id === id);
    const neighbors = neighborsOf(view.roomId)
      .map((n) => { const r = byId(n.id); return r ? { ...r, heading: n.heading, vert: n.vert, via: n.via } : null; })
      .filter(Boolean)
      .slice(0, 6);
    return (
      <RoomView
        room={room}
        neighbors={neighbors}
        onBack={() => nav.goGallery()}
        onStepInto={(id) => nav.enterMassing(id)}
        onGoRoom={(id, heading) => nav.stepTo(id, heading)}
      />
    );
  }

  return (
    <Gallery
      rooms={rooms}
      onOpenRoom={(id) => nav.goRoom(id)}
      onOpenModel={() => nav.openModel()}
      onEnterWalk={() => nav.enterWalk()}
    />
  );
}
