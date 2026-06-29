import { describe, it, expect } from 'vitest';
import { coverPin, containBox, onFrame } from './pinGeom.js';

describe('coverPin', () => {
  it('puts the render centre at the frame centre for any aspect', () => {
    for (const ar of [0.75, 1, 1.5, 1.784, 2.333]) {
      const { left, top } = coverPin(50, 50, 375, 812, ar);
      expect(left).toBeCloseTo(375 / 2);
      expect(top).toBeCloseTo(812 / 2);
    }
  });

  it('crops the sides of a wide render in a portrait frame (cover)', () => {
    // ar=2 render, 375×812 frame → height-driven, render 1624px wide, overhangs both sides
    const l0 = coverPin(0, 50, 375, 812, 2).left;
    const l100 = coverPin(100, 50, 375, 812, 2).left;
    expect(l0).toBeLessThan(0);            // left edge pushed off-frame
    expect(l100).toBeGreaterThan(375);     // right edge pushed off-frame
    expect(onFrame(l0, 406, 375, 812)).toBe(false);
    expect(onFrame(l100, 406, 375, 812)).toBe(false);
  });

  it('keeps an interior pin on-frame', () => {
    const { left, top } = coverPin(45, 40, 375, 812, 1.784);
    expect(onFrame(left, top, 375, 812)).toBe(true);
  });
});

describe('containBox', () => {
  it('fits a wide render to width and letterboxes top/bottom', () => {
    const b = containBox(375, 812, 2);
    expect(b.width).toBeCloseTo(375);
    expect(b.height).toBeCloseTo(187.5);
    expect(b.left).toBeCloseTo(0);
    expect(b.top).toBeCloseTo((812 - 187.5) / 2);
  });

  it('fits a tall render to height and pillarboxes left/right', () => {
    const b = containBox(812, 375, 0.75);   // landscape stage, portrait render
    expect(b.height).toBeCloseTo(375);
    expect(b.width).toBeCloseTo(281.25);
    expect(b.top).toBeCloseTo(0);
    expect(b.left).toBeCloseTo((812 - 281.25) / 2);
  });

  it('never exceeds the stage on either axis', () => {
    for (const ar of [0.6, 1, 1.78, 2.5]) {
      const b = containBox(390, 700, ar);
      expect(b.width).toBeLessThanOrEqual(390 + 0.01);
      expect(b.height).toBeLessThanOrEqual(700 + 0.01);
    }
  });
});
