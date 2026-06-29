import { useEffect, useRef, useState } from 'react';
import { cameraBus } from '../scene/cameraBus.js';

/**
 * The render-held cross-fade. Stepping through a render into the massing holds the
 * render full-frame over the (lazy-loading) 3D, then — once the scene's first frame
 * has painted (cameraBus.onReady) — the render PASSES THROUGH: it scales up and
 * softens as it dissolves, while the volume eases in behind it.
 *
 * The four knobs (duration / easing / scale / blur) live in styles.css as CSS
 * variables on `.massing-curtain` (Design's spec, currently 780ms). Here we just
 * flip the `.go` class after a forced reflow so the transition fires reliably, and
 * remove the node on a timer so the curtain can never get stuck over the 3D.
 */
export default function MassingCurtain({ src }) {
  const ref = useRef(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let toGone;
    const start = () => {
      const el = ref.current;
      if (!el) return;
      void el.offsetWidth;          // force reflow so the base state is committed first
      el.classList.add('go');       // → CSS transitions opacity/scale/blur (the push-through)
      const ms = parseFloat(getComputedStyle(el).getPropertyValue('--xfade-dur')) || 780;
      toGone = setTimeout(() => setGone(true), ms + 120);
    };
    let toFade;
    const off = cameraBus.onReady(() => { toFade = setTimeout(start, 60); });
    const safety = setTimeout(start, 2500); // never trap the user behind the render
    return () => { off(); clearTimeout(toFade); clearTimeout(toGone); clearTimeout(safety); };
  }, []);

  if (gone || !src) return null;
  return <img ref={ref} className="massing-curtain" src={src} alt="" />;
}
