/**
 * Render pins — tappable hotspots on a room's render that reveal a short note
 * about that feature. Authored by Claude Chat against the Master Plan / specs;
 * Code owns this format + the display. Keyed by canonical room id.
 *
 * Each pin: x = % across the render (0 left → 100 right), y = % down (0 top →
 * 100 bottom), a short label, a one-line note, and kind ∈
 * material | view | feature | heritage.
 */
import { canonicalId } from './aliases.js';

export const ROOM_PINS = {
  // Drawing Room (Claude Chat, first pass — Master Plan §4.2 + Conservation Plan).
  drawing_room_sw: [
    { x: 35, y: 22, label: 'Salon Art Hang', kind: 'heritage',
      note: "Helen's private gallery — a restrained hang where quality outranks quantity, with a Freddy Hemley B&W architectural print in the formal register the Glebe demands." },
    { x: 33, y: 50, label: 'Limestone Fireplace', kind: 'material',
      note: 'West-wall fireplace with herringbone firebox, sharing a chimney stack with the Oval Dining Room next door — the natural Georgian flue line rising through the center of the house.' },
    { x: 82, y: 30, label: 'Conservation Sash', kind: 'feature',
      note: 'West sash with conservation IGU (UV-filtering interlayer, low-solar-gain low-E) and motorized louvered shutters on a sun-angle automation circuit — defense in depth so Helen keeps the afternoon light and the collection stays safe.' },
    { x: 13, y: 35, label: 'South Garden View', kind: 'view',
      note: 'Twelve-over-twelve south sash framing the rear garden and canyon edge beyond, porch-shaded in summer — Glebe fenestration with Hill Country light.' },
    { x: 57, y: 47, label: 'Mustard Bookshelf', kind: 'heritage',
      note: "Captain Jack's one deliberate eccentricity within Glebe formality — a painted bookshelf providing the room's primary color note against white plaster walls." },
  ],
};

/** Pins for a room (canonicalized so aliased spaces resolve); [] if none yet. */
export const pinsFor = (id) => ROOM_PINS[canonicalId(id)] || [];
