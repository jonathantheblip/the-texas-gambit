import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { containBox } from './pinGeom.js';
import { loadAspect } from './pinImage.js';
import { KIND_LABEL, KindIcon, KindRing } from './pinKinds.jsx';

/**
 * Note — the slim strip that unfurls beside the active pin. It flips to whichever
 * side of the pin has room and is clamped to stay on screen (Design); on a phone a
 * 240px note beside a centre pin would otherwise run off the edge. It measures
 * itself, then positions in stage pixels with a stem (--stemY) pointing at the pin.
 */
function Note({ pin, box, stage }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nW = el.offsetWidth, nH = el.offsetHeight;
    const pinX = box.left + (pin.x / 100) * box.width;
    const pinY = box.top + (pin.y / 100) * box.height;
    const gap = 14, pad = 10, topSafe = 60;
    const fitsRight = pinX + gap + nW + pad <= stage.W;
    const fitsLeft = pinX - gap - nW - pad >= 0;
    const side = fitsRight ? 'right' : fitsLeft ? 'left' : (stage.W - pinX >= pinX ? 'right' : 'left');
    let left = side === 'right' ? pinX + gap : pinX - gap - nW;
    left = Math.max(pad, Math.min(left, stage.W - nW - pad));
    let top = Math.max(topSafe, Math.min(pinY - nH / 2, stage.H - nH - pad));
    const stemY = Math.max(12, Math.min(pinY - top, nH - 12));
    setPos({ left, top, side, stemY });
  }, [pin, box.left, box.top, box.width, box.height, stage.W, stage.H]);

  return (
    <div className={`wk-lc-note${pos ? ' ready' : ''}`} data-kind={pin.kind} data-side={pos?.side || 'right'}
      ref={ref} onClick={(e) => e.stopPropagation()}
      style={pos ? { left: `${pos.left}px`, top: `${pos.top}px`, '--stemY': `${pos.stemY}px` } : { left: 0, top: 0 }}>
      <div className="kind"><KindIcon kind={pin.kind} /><span>{KIND_LABEL[pin.kind] || ''}</span></div>
      <div className="l">{pin.label}</div>
      <div className="n">{pin.note}</div>
    </div>
  );
}

/**
 * RenderPins — the "look closer" overlay (Design's hybrid framing). The immersive
 * walk crops the render's sides, so tapping a resting pin LIFTS the whole render
 * (cover→contain) into a dimmed full-stage layer — nothing is ever lost to the edge.
 * The render stays the brightest thing on screen; only the surrounding letterbox dims.
 *
 * Here each ring takes its kind colour and sketches itself in; the active pin's note
 * unfurls beside it. The render is sized to CONTAIN in JS so the pins are plain
 * left:x% top:y% children of the picture. Close on Esc, dim-tap, or Close.
 */
export default function RenderPins({ room, pins, initial = null, onClose }) {
  const [active, setActive] = useState(initial);
  const [ar, setAr] = useState(null);
  const [stage, setStage] = useState(null);   // { W, H } of the full overlay stage
  const stageRef = useRef(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    let on = true;
    loadAspect(room.renderImage).then((a) => { if (on && a) setAr(a); });
    return () => { on = false; };
  }, [room.renderImage]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); setStage({ W: r.width, H: r.height }); };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  // Keyboard: Esc closes; Tab is trapped inside the dialog. Restore focus on close.
  useLayoutEffect(() => {
    const prevFocus = document.activeElement;
    (closeRef.current || dialogRef.current)?.focus?.();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const f = dialogRef.current?.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
      if (!f || !f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  const box = ar != null && stage != null ? containBox(stage.W, stage.H, ar) : null;
  const p = active != null ? pins[active] : null;

  return (
    <div className="wk-lc" role="dialog" aria-modal="true"
      aria-label={`Look closer at ${room.displayName}`} ref={dialogRef} onClick={onClose}>
      <div className="wk-lc-dim" />

      <div className="wk-lc-stage" ref={stageRef}>
        {box && (
          <>
            <div className="wk-lc-render" onClick={(e) => e.stopPropagation()}
              style={{ left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }}>
              <img src={room.renderImage} alt={room.displayName} draggable="false" />
              {pins.map((pin, i) => (
                <button
                  key={i}
                  className={`wk-lc-pin${active === i ? ' on' : ''}`}
                  data-kind={pin.kind}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%`, '--i': i }}
                  onClick={() => setActive(active === i ? null : i)}
                  aria-label={`${KIND_LABEL[pin.kind] || 'Detail'}: ${pin.label}`}
                  aria-pressed={active === i}
                >
                  <KindRing />
                </button>
              ))}
            </div>
            {p && stage && <Note key={active} pin={p} box={box} stage={stage} />}
          </>
        )}
      </div>

      <div className="wk-lc-top">
        <span className="where">{room.displayName} <i>· look closer</i></span>
        <button className="wk-lc-close" ref={closeRef} onClick={onClose} aria-label="Close look closer">
          Close <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
}
