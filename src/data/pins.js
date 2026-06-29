/**
 * Render pins — tappable hotspots on a room's render that reveal a short note
 * about that feature. Authored by Claude Chat against the Master Plan / specs;
 * Code owns this format + the display. Data lives in pins.json (one JSON object
 * keyed by canonical room id) so each authored batch merges in with no rewriting.
 *
 * Each pin: x = % across the render (0 left → 100 right), y = % down (0 top →
 * 100 bottom), a short label, a one-line note, and kind ∈
 * material | view | feature | heritage (drives the dot/category).
 */
import ROOM_PINS from './pins.json';
import { canonicalId } from './aliases.js';

export { ROOM_PINS };

/** Pins for a room (canonicalized so aliased spaces resolve); [] if none yet. */
export const pinsFor = (id) => ROOM_PINS[canonicalId(id)] || [];
