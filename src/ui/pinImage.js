/**
 * loadAspect — the natural aspect ratio (w/h) of a render, cached per URL. The
 * cover/contain math (pinGeom) needs it, and the walk paints renders as CSS
 * background-images (no <img> to read naturalWidth from), so we probe once with a
 * detached Image. Resolves null on error so callers can fall back gracefully.
 */
const cache = new Map();

export function loadAspect(src) {
  if (!src) return Promise.resolve(null);
  if (cache.has(src)) return Promise.resolve(cache.get(src));
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ar = img.naturalHeight ? img.naturalWidth / img.naturalHeight : null;
      cache.set(src, ar);
      resolve(ar);
    };
    img.onerror = () => { cache.set(src, null); resolve(null); };
    img.src = src;
  });
}
