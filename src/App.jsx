import { lazy, Suspense, useMemo, useState } from 'react';
import { ALL_ROOMS, applyOverrides } from './data/rooms.js';
import { useGeometry } from './store/useGeometry.js';
import Gallery from './ui/Gallery.jsx';
import RoomView from './ui/RoomView.jsx';

// The 3D view pulls in three.js / r3f / drei (~1 MB). Load it only when the
// user steps into the massing, so the render-forward gallery stays light on mobile.
const ModelView = lazy(() => import('./ui/ModelView.jsx'));

/**
 * Render-forward shell. The colored-pencil renders are the front door:
 *   gallery → room (render as hero) → step into the 3D massing.
 * Geometry edits flow through the shared store, so dimensions stay in sync
 * across every view.
 */
export default function App() {
  const [view, setView] = useState({ mode: 'gallery' });
  const { overrides } = useGeometry();
  const rooms = useMemo(() => applyOverrides(ALL_ROOMS, overrides), [overrides]);

  if (view.mode === 'model') {
    return (
      <Suspense fallback={<div className="loading-3d">Loading the 3D model…</div>}>
        <ModelView
          initialSelectedId={view.focusId || null}
          onExit={() => setView({ mode: 'gallery' })}
          onOpenRender={(id) => setView({ mode: 'room', id })}
        />
      </Suspense>
    );
  }

  if (view.mode === 'room') {
    const room = rooms.find((r) => r.id === view.id);
    return (
      <RoomView
        room={room}
        onBack={() => setView({ mode: 'gallery' })}
        onStepInto={(id) => setView({ mode: 'model', focusId: id })}
      />
    );
  }

  return (
    <Gallery
      rooms={rooms}
      onOpenRoom={(id) => setView({ mode: 'room', id })}
      onOpenModel={() => setView({ mode: 'model' })}
    />
  );
}
