import { useEffect, useState } from 'react';
import { cameraBus } from '../scene/cameraBus.js';

/**
 * The render-held cross-fade. Stepping through a render into the massing holds the
 * render full-frame over the (lazy-loading) 3D, then fades it out once the scene's
 * first frame has painted — no flash of empty canvas.
 *
 * Opacity is driven inline (not a CSS class) so the transition fires reliably, and
 * removal is timer-based so the curtain can never get stuck covering the 3D.
 * Design tunes the feel; duration is the `transition` on `.massing-curtain` (550ms).
 */
export default function MassingCurtain({ src }) {
  const [opacity, setOpacity] = useState(1);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let toFade, toGone;
    const start = () => {
      setOpacity(0);
      toGone = setTimeout(() => setGone(true), 650); // ≥ the 550ms fade
    };
    const off = cameraBus.onReady(() => { toFade = setTimeout(start, 80); });
    const safety = setTimeout(start, 2500); // never trap the user behind the render
    return () => { off(); clearTimeout(toFade); clearTimeout(toGone); clearTimeout(safety); };
  }, []);

  if (gone || !src) return null;
  return <img className="massing-curtain" src={src} alt="" style={{ opacity }} />;
}
