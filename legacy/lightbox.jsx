/* Hill Country Estate — Lightbox with pinch-to-zoom (React + JSX) */

window.HCELightbox = (function(){
  const { useState, useEffect, useRef } = React;

  function Lightbox({ image, caption, onClose }) {
    const [scale, setScale] = useState(1);
    const [tx, setTx] = useState(0);
    const [ty, setTy] = useState(0);
    const ref = useRef(null);
    const start = useRef(null);

    useEffect(() => {
      const onKey = (e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === '+' || e.key === '=') setScale(s => Math.min(4, s + 0.25));
        if (e.key === '-' || e.key === '_') setScale(s => Math.max(1, s - 0.25));
        if (e.key === '0') { setScale(1); setTx(0); setTy(0); }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Pointer-based pinch + drag (works with touch + trackpad gesture)
    const pointers = useRef(new Map());
    const baseDist = useRef(0);
    const baseScale = useRef(1);

    const onPointerDown = (e) => {
      e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()];
        baseDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        baseScale.current = scale;
      } else if (pointers.current.size === 1) {
        start.current = { x: e.clientX - tx, y: e.clientY - ty, swipeStartY: e.clientY };
      }
    };
    const onPointerMove = (e) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const next = Math.min(4, Math.max(1, baseScale.current * (d / (baseDist.current || 1))));
        setScale(next);
      } else if (pointers.current.size === 1 && scale > 1 && start.current) {
        setTx(e.clientX - start.current.x);
        setTy(e.clientY - start.current.y);
      }
    };
    const onPointerUp = (e) => {
      if (pointers.current.size === 1 && start.current && scale === 1) {
        // Swipe down to dismiss
        const dy = e.clientY - start.current.swipeStartY;
        if (dy > 80) onClose();
      }
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) baseDist.current = 0;
    };
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setScale(s => Math.min(4, Math.max(1, s - e.deltaY * 0.01)));
      }
    };
    const onDoubleClick = () => {
      if (scale > 1) { setScale(1); setTx(0); setTy(0); } else setScale(2);
    };

    return (
      <div className="lightbox"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
      >
        <button className="close" onClick={onClose}>×</button>
        <span className="hint">Pinch · scroll · double-tap · esc</span>
        <img ref={ref} className="lightbox-img" src={image.src} alt={image.alt}
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }} />
        {caption && <div className="caption">{caption}</div>}
      </div>
    );
  }

  return { Lightbox };
})();
