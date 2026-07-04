import { useLayoutEffect, useRef, useState } from 'react';

const STEPS = [1, 1.5, 2, 3];

/**
 * ImageZoom — a focused, full-screen view of one decision-option image. Native
 * pinch-zoom already works here on touch (the app's viewport meta allows page
 * scaling); the Zoom in / out / reset controls give mouse, keyboard, and
 * screen-reader users the same access. Same dialog focus-trap pattern as
 * RenderPins' look-closer.
 */
export default function ImageZoom({ src, alt, onClose }) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useLayoutEffect(() => {
    const prevFocus = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setStep((s) => Math.min(s + 1, STEPS.length - 1)); return; }
      if (e.key === '-') { e.preventDefault(); setStep((s) => Math.max(s - 1, 0)); return; }
      if (e.key !== 'Tab') return;
      const f = dialogRef.current?.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
      if (!f || !f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); prevFocus?.focus?.(); };
  }, [onClose]);

  const scale = STEPS[step];

  return (
    <div className="dz-zoom" role="dialog" aria-modal="true" aria-label={`Zoomed view: ${alt}`} ref={dialogRef}
      onClick={onClose}>
      <div className="dz-zoom-frame" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} draggable="false" style={{ transform: `scale(${scale})` }} />
      </div>
      <div className="dz-zoom-bar" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0} aria-label="Zoom out">−</button>
        <span className="dz-zoom-pct">{Math.round(scale * 100)}%</span>
        <button type="button" onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))} disabled={step === STEPS.length - 1} aria-label="Zoom in">+</button>
        <button type="button" className="dz-zoom-close" ref={closeRef} onClick={onClose} aria-label="Close zoomed view">
          Close <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
}
