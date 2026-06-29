/**
 * Room aliases — spaces the architect's table splits into separate volumes but
 * that read as ONE space to a person in the house.
 *
 * The geometry stays two boxes (compound_rooms.json is the source of truth — they
 * ARE two structural volumes, and the locks/validation key on them). But the
 * EXPERIENCE — the walk, the lookbook, the massing selection, the map — presents
 * them as a single space, so nothing implies they're separate.
 *
 * Entry Hall + Octagonal Stair Hall are one arrival space: you step in the front
 * door and the grand stair is right there. (Per Jon: "the entry hall and staircase
 * aren't meant to be separate spaces.") The stair's render lives on the Entry Hall,
 * and the stair's connections (e.g. up to the Upper Gallery) fold into it too.
 */
export const ROOM_ALIAS = {
  octagonal_stair_hall: 'entry_hall_front_s_ctr',
};

/** The id this room presents as (itself, unless it folds into another space). */
export const canonicalId = (id) => ROOM_ALIAS[id] || id;

/** True if this room folds into another (so it's never a destination of its own). */
export const isAlias = (id) => id in ROOM_ALIAS;

/** The absorbed ids that fold into a canonical id (entry_hall → [octagonal_stair_hall]). */
export const aliasesOf = (id) => Object.keys(ROOM_ALIAS).filter((a) => ROOM_ALIAS[a] === id);

/** Every room id sharing one presented space: the canonical id + its absorbed ids. */
export const spaceGroup = (id) => { const c = canonicalId(id); return [c, ...aliasesOf(c)]; };

/** Do two ids belong to the same presented space? */
export const sameSpace = (a, b) => canonicalId(a) === canonicalId(b);
