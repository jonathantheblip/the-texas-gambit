/**
 * Open Decisions — content (static, hand-authored, like pins.json / compound_rooms.json).
 * The live state (status / choice / notes) lives in store/decisionsStore.js and is
 * joined onto this content by store/useDecisions.js; this file never changes at runtime.
 */
import raw from './decisions.json';
import { buildingRender } from './rooms.js';

// public/ assets resolve under Vite's base ('/' in dev, '/the-texas-gambit/' in build) —
// same convention rooms.js uses for lookbook_images.
const asset = (file) => (file ? `${import.meta.env.BASE_URL}decisions/${file}` : null);

// contextAsset can point at a hand-authored decisions/ file, or borrow an existing
// building-level exterior render (rooms.js) rather than duplicating the image.
const resolveContextAsset = (ref) => {
  if (!ref) return null;
  if (ref.startsWith('buildingRender:')) return buildingRender(ref.slice('buildingRender:'.length));
  return asset(ref);
};

export const STATUS_LABEL = {
  open: 'Open decision',
  decided: 'Decided',
  'flagged-for-conversation': 'Flagged for a conversation',
  'deferred-to-site': 'Waiting on physical samples',
};

export const DECISIONS = raw.decisions.map((d) => ({
  ...d,
  contextAsset: resolveContextAsset(d.contextAsset),
  options: d.options.map((o) => ({ ...o, asset: asset(o.asset) })),
}));

export const decisionById = (id) => DECISIONS.find((d) => d.id === id) || null;

/**
 * Decision pins for a room — the render layer's deep link into Open Decisions.
 * One pin per decision whose `pin.roomId` matches this room; kind:'decision' marks
 * it for RestingPins/pinKinds so it renders (and behaves) distinctly from the four
 * content pin kinds — tapping one deep-links straight to the decision card instead
 * of opening the look-closer note.
 */
export function decisionPinsFor(roomId) {
  return DECISIONS.filter((d) => d.pin && d.pin.roomId === roomId).map((d) => ({
    x: d.pin.x,
    y: d.pin.y,
    label: d.element,
    note: 'Tap to compare options.',
    kind: 'decision',
    decisionId: d.id,
  }));
}
