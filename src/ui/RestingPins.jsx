import { useEffect, useRef, useState } from 'react';
import { coverPin, onFrame } from './pinGeom.js';
import { loadAspect } from './pinImage.js';
import { RestRing, DecisionRestRing, KIND_LABEL } from './pinKinds.jsx';

/**
 * RestingPins — Design's entry affordance: the pins ARE the invitation. Each pin is
 * a faint terracotta ring that breathes on the render itself (no chip, no badge).
 * They ride the frame's `background-size:cover` crop, so they sit on the right spot
 * and crop *with* the drawing; tapping one lifts the whole render into the look-closer.
 *
 * The one thing to get right (Design §5): position in COVER-space, driven by a
 * ResizeObserver — the landscape survey frame can be zero-width at first paint, so a
 * one-shot pass would place pins at NaN. Pins cropped off the frame are simply hidden;
 * the look-closer fits the whole render and brings them all back.
 */
export default function RestingPins({ render, pins, onOpen }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);   // { W, H } of the live frame
  const [ar, setAr] = useState(null);        // render's natural aspect (w/h)

  useEffect(() => {
    let on = true;
    setAr(null);
    loadAspect(render).then((a) => { if (on && a) setAr(a); });
    return () => { on = false; };
  }, [render]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); setSize({ W: r.width, H: r.height }); };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    // RO alone can miss the portrait↔landscape flip (the survey frame goes from
    // full-screen to a column); listen to resize/orientationchange too (Design §5).
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  const ready = ar != null && size != null && size.W > 0 && size.H > 0;

  return (
    <div className="wk-pinlayer" ref={ref} aria-hidden={!ready}>
      {ready && pins.map((p, i) => {
        const { left, top } = coverPin(p.x, p.y, size.W, size.H, ar);
        if (!onFrame(left, top, size.W, size.H)) return null;   // cropped off — look-closer recovers it
        return (
          <button
            key={i}
            className="wk-pinrest"
            data-kind={p.kind}
            style={{ left: `${left}px`, top: `${top}px` }}
            onClick={(e) => { e.stopPropagation(); onOpen(i); }}
            aria-label={p.kind === 'decision'
              ? `Open decision: ${p.label}. ${p.note || ''}`.trim()
              : `${KIND_LABEL[p.kind] || 'Detail'}: ${p.label}. ${p.note} — look closer.`}
          >
            {p.kind === 'decision' ? <DecisionRestRing /> : <RestRing />}
          </button>
        );
      })}
    </div>
  );
}
