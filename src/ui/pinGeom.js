/**
 * Pin geometry — the pure math that lets render pins ride a render no matter how
 * the picture is fitted into its frame. Kept dependency-free so it can be unit
 * tested directly (the preview's isolated world can't drive these on a real frame).
 *
 * A render has natural aspect `ar = naturalW / naturalH`. We treat its natural size
 * as (ar, 1) so one scale factor `s` maps the drawing into a frame of W×H.
 */

/**
 * COVER space — the immersive walk paints the render with `background-size:cover`
 * (`background-position:center`), which crops in portrait. A pin authored at
 * (px,py) as a percentage of the *whole* render lands here, in frame pixels.
 * Pins whose result falls outside [0,W]×[0,H] are cropped off the frame — correct;
 * the look-closer (which fits the whole render) brings them all back.
 */
export function coverPin(px, py, W, H, ar) {
  const s = Math.max(W / ar, H);          // cover: fill both axes → max
  const dW = ar * s, dH = s;              // drawn render size
  const left = (W - dW) / 2 + (px / 100) * dW;   // background-position:center
  const top = (H - dH) / 2 + (py / 100) * dH;
  return { left, top };
}

/**
 * CONTAIN box — the look-closer fits the *whole* render inside the stage
 * (`object-fit:contain`). This returns the largest box of aspect `ar` that fits
 * centered in W×H; the render fills it exactly, so look-closer pins are then plain
 * `left:px% top:py%` children of the box.
 */
export function containBox(W, H, ar) {
  const s = Math.min(W / ar, H);          // contain: fit inside → min
  const dW = ar * s, dH = s;
  return { width: dW, height: dH, left: (W - dW) / 2, top: (H - dH) / 2 };
}

/** Is a cover-space point on the visible frame (with a small margin for the ring)? */
export function onFrame(left, top, W, H, margin = 24) {
  return left >= -margin && left <= W + margin && top >= -margin && top <= H + margin;
}
