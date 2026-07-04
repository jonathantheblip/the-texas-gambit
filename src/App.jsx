import { lazy, Suspense, useMemo } from 'react';
import { ALL_ROOMS, applyOverrides } from './data/rooms.js';
import { useGeometry } from './store/useGeometry.js';
import { useDecisions } from './store/useDecisions.js';
import { nav } from './nav/navStore.js';
import { useNav } from './nav/useNav.js';
import Gallery from './ui/Gallery.jsx';
import Walk from './ui/Walk.jsx';
import OpenDecisions from './ui/OpenDecisions.jsx';
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
  const decisions = useDecisions();

  if (view.mode === 'decisions') {
    return (
      <OpenDecisions
        decisions={decisions.decisions}
        initialDecisionId={view.decisionId}
        onBack={() => (view.roomId ? nav.goRoom(view.roomId) : nav.goGallery())}
        chooseOption={decisions.chooseOption}
        flagForConversation={decisions.flagForConversation}
        undoDecision={decisions.undoDecision}
        addNote={decisions.addNote}
      />
    );
  }

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
    return <Walk rooms={rooms} />;
  }

  return (
    <Gallery
      rooms={rooms}
      onOpenRoom={(id) => nav.goRoom(id)}
      onOpenModel={() => nav.openModel()}
      onEnterWalk={() => nav.enterWalk()}
      onOpenDecisions={() => nav.goDecisions()}
    />
  );
}
