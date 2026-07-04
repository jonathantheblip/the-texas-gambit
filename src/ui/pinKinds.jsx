/**
 * Pin kinds — the four families a render pin can belong to, per Design's handoff.
 * Colour is earned (only in the look-closer) and is ALWAYS paired with an icon and
 * the kind word, so the kind survives colour-blindness, greyscale, and reduced
 * vision. Colours/sizes themselves live as tokens in walk.css; this is the shared
 * vocabulary (labels, hints, icons) + the two ring SVGs the pins draw with.
 */
export const KIND_LABEL = { material: 'Material', view: 'View', feature: 'Feature', heritage: 'Heritage', decision: 'Open decision' };
export const KIND_HINT = {
  material: 'stone · wood · cloth',
  view: 'what the room looks onto',
  feature: 'a designed move',
  heritage: 'a family thread',
  decision: 'tap to compare options',
};

/** The non-colour channel for the kind: a small line icon in the note's tick. */
export function KindIcon({ kind }) {
  const paths = {
    material: <path d="M2 3.6h8M2 6h8M2 8.4h8" />,        // strata: stone · wood · cloth
    view: <path d="M1.5 9 4.5 4.5 7 7.6 8.6 5.8 10.5 9" />, // a horizon of hills
    feature: <circle cx="6" cy="6" r="4" />,               // an open ring: a designed move
    heritage: <path d="M6 1.4 10.6 6 6 10.6 1.4 6Z" />,    // a diamond: a family thread
  };
  return (
    <svg className="wk-kind-ico" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {paths[kind] || paths.feature}
    </svg>
  );
}

/** Resting ring on the walk — uniform terracotta, breathing (kind-agnostic).
 *  The breathing halo is a CSS ::after on the button (.wk-pinrest), not in the svg. */
export function RestRing() {
  return (
    <svg className="wk-pin-svg" viewBox="0 0 44 44" aria-hidden="true">
      <circle className="ring" cx="22" cy="22" r="10" />
      <circle className="dot" cx="22" cy="22" r="2" />
    </svg>
  );
}

/** Decision pin — the resting ring's distinct sibling, marking an open decision on
 *  the render. Same breathing/hit-target mechanics as RestRing (driven by the
 *  shared .wk-pinrest button + its ::after halo), but it takes the amber
 *  --pin-decision colour (walk.css) and its glyph is a small fork — two paths
 *  diverging — instead of a dot, so it reads as "tap to decide," not "tap to read." */
export function DecisionRestRing() {
  return (
    <svg className="wk-pin-svg wk-pin-decision" viewBox="0 0 44 44" aria-hidden="true">
      <circle className="ring" cx="22" cy="22" r="10" />
      <path className="fork" d="M22 17v3M22 20l-3.2 3.6M22 20l3.2 3.6" />
    </svg>
  );
}

/** Look-closer ring — takes its kind colour and sketches itself in (stroke draw-on). */
export function KindRing() {
  return (
    <svg className="wk-lc-pin-svg" viewBox="0 0 44 44" aria-hidden="true">
      <circle className="ring" cx="22" cy="22" r="10" pathLength="100" />
      <circle className="dot" cx="22" cy="22" r="2" />
    </svg>
  );
}
