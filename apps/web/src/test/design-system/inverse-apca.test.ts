import { describe, expect, it } from 'vitest';
import { apcaContrast, backgroundFor, foregroundFor } from '@pumni/ui/lib/apca';
import { oklchToSrgb } from '@pumni/ui/lib/oklch';

/*
 * Inverse-APCA generator (ADR-0010, pillar #2).
 * Proves that `foregroundFor` / `backgroundFor` derive colours that actually
 * satisfy the requested Lc, using the same oklchToSrgb + apcaContrast pair the
 * contrast gate uses — so generated brand colours pass the gate by construction.
 */

// Backgrounds with enough contrast capacity to host Lc 60 body text. A
// mid-tone (~0.7) deliberately is NOT here — the APCA dead zone where neither
// black nor white text reaches Lc 60 (see the dedicated unreachable test below).
const HIGH_CAPACITY_BACKGROUNDS = [
  { name: 'near-white', l: 0.98, c: 0.003, h: 248 },
  { name: 'cyan-600 primary', l: 0.495, c: 0.105, h: 203 },
  { name: 'dark-surface', l: 0.24, c: 0.04, h: 207 },
  { name: 'near-black', l: 0.05, c: 0, h: 0 },
] as const;

// Reachable for the Lc 25 UI target (lower bar) including the mid-light tint.
const UI_BACKGROUNDS = [
  ...HIGH_CAPACITY_BACKGROUNDS,
  { name: 'light-tint', l: 0.85, c: 0.05, h: 200 },
] as const;

describe('foregroundFor', () => {
  it.each(HIGH_CAPACITY_BACKGROUNDS)('hits Lc 60 body target over $name', (bg) => {
    const result = foregroundFor(bg, 60);

    expect(result.reachedTarget).toBe(true);
    // Achieved contrast meets the target...
    expect(result.lc).toBeGreaterThanOrEqual(60);
    // ...and is the *least-extreme* colour that does so (boundary, not overshoot).
    expect(result.lc).toBeLessThan(62);

    // The derived colour genuinely passes APCA against the background.
    const measured = Math.abs(apcaContrast(oklchToSrgb(result), oklchToSrgb(bg)));
    expect(measured).toBeGreaterThanOrEqual(60);
  });

  it.each(UI_BACKGROUNDS)('hits Lc 25 UI target over $name', (bg) => {
    const result = foregroundFor(bg, 25);
    expect(result.reachedTarget).toBe(true);
    expect(result.lc).toBeGreaterThanOrEqual(25);
  });

  it('reports unreachable for Lc 60 over a mid-tone (APCA dead zone ~L0.7, ceiling ~56)', () => {
    const result = foregroundFor({ l: 0.7, c: 0.05, h: 200 }, 60);
    expect(result.reachedTarget).toBe(false);
    // The returned colour is the maximum-capacity side, ~Lc 56, not a false pass.
    expect(result.lc).toBeGreaterThan(50);
    expect(result.lc).toBeLessThan(60);
  });

  it('auto-picks dark text on a light background and light text on a dark one', () => {
    const onLight = foregroundFor({ l: 0.95, c: 0, h: 0 }, 60);
    const onDark = foregroundFor({ l: 0.1, c: 0, h: 0 }, 60);

    expect(onLight.l).toBeLessThan(0.95); // darker than the light bg
    expect(onDark.l).toBeGreaterThan(0.1); // lighter than the dark bg
  });

  it('produces an in-gamut neutral colour by default', () => {
    const result = foregroundFor({ l: 0.5, c: 0.1, h: 203 }, 60);
    expect(result.c).toBe(0);
    expect(result.l).toBeGreaterThanOrEqual(0);
    expect(result.l).toBeLessThanOrEqual(1);
    expect(result.oklch).toMatch(/^oklch\([\d.]+ 0 0\)$/);
  });

  it('reports reachedTarget=false and returns the extreme when the target is impossible', () => {
    // No colour reaches Lc 200 against a mid-grey.
    const result = foregroundFor({ l: 0.5, c: 0, h: 0 }, 200);
    expect(result.reachedTarget).toBe(false);
    // Falls back to the most-extreme readable side (pure black or white).
    expect(result.l === 0 || result.l === 1).toBe(true);
  });

  it('respects an explicit polarity override', () => {
    // Force lighter text even over a light background.
    const lighter = foregroundFor({ l: 0.6, c: 0, h: 0 }, 10, { polarity: 'lighter' });
    expect(lighter.l).toBeGreaterThanOrEqual(0.6);
  });

  it('accepts a tinted foreground via hue/chroma', () => {
    const tinted = foregroundFor({ l: 0.2, c: 0.02, h: 200 }, 45, { hue: 200, chroma: 0.05 });
    expect(tinted.h).toBe(200);
    expect(tinted.c).toBe(0.05);
    expect(tinted.lc).toBeGreaterThanOrEqual(45);
  });
});

describe('backgroundFor', () => {
  it('derives a background that keeps a fixed foreground readable', () => {
    const whiteText = { l: 0.985, c: 0, h: 0 };
    const result = backgroundFor(whiteText, 60);

    expect(result.reachedTarget).toBe(true);
    const measured = Math.abs(apcaContrast(oklchToSrgb(whiteText), oklchToSrgb(result)));
    expect(measured).toBeGreaterThanOrEqual(60);
  });
});
