import { describe, expect, it } from 'vitest';

import {
  duration,
  easing,
  hoverLiftScale,
  hoverLiftY,
  entranceY,
  entranceYLarge,
  parallaxRate,
  pressScale,
  staggerBase,
  staggerFast,
  staggerSlow,
} from '../lib/motion';
import { readDurationSeconds, readUnitless, tokenCss, themeCss } from './token-test-utils';

/**
 * Motion bridge guard. `lib/motion.ts` is a hand-kept mirror of the `--duration-*`
 * / `--ease-*` CSS primitives in `tokens.css` (JS animations and CSS transitions
 * must share one source of truth). This test fails if the two drift apart.
 */

function readCubicBezier(
  name: string,
  cssContent: string = tokenCss,
): [number, number, number, number] {
  const matchVar = cssContent.match(new RegExp(`${name}:\\s*var\\((--[^)]+)\\)`));
  if (matchVar?.[1]) {
    return readCubicBezier(matchVar[1], tokenCss);
  }
  const match = cssContent.match(new RegExp(`${name}:\\s*cubic-bezier\\(([^)]+)\\)`));
  if (!match?.[1]) {
    if (cssContent !== themeCss) {
      return readCubicBezier(name, themeCss);
    }
    throw new Error(`Missing easing token: ${name}`);
  }
  const parts = match[1].split(',').map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
    throw new Error(`Malformed cubic-bezier for ${name}: ${match[1]}`);
  }
  return parts as [number, number, number, number];
}

describe('motion token bridge stays in sync with tokens.css', () => {
  it('durations mirror --duration-* (ms → seconds)', () => {
    expect(duration.fast).toBeCloseTo(readDurationSeconds('--duration-fast'), 5);
    expect(duration.base).toBeCloseTo(readDurationSeconds('--duration-base'), 5);
    expect(duration.slow).toBeCloseTo(readDurationSeconds('--duration-slow'), 5);
    expect(duration.slower).toBeCloseTo(readDurationSeconds('--duration-slower'), 5);
  });

  it('easings mirror the brand cubic-bezier curves', () => {
    // fluid ⇄ --ease-out (emphasized decelerate), snappy ⇄ --ease-in-out (symmetric).
    expect([...easing.fluid]).toEqual(readCubicBezier('--ease-out'));
    expect([...easing.snappy]).toEqual(readCubicBezier('--ease-in-out'));
    // spring ⇄ --ease-spring (overshoot pop — modal/success/shake).
    expect([...easing.spring]).toEqual(readCubicBezier('--ease-spring'));
  });

  it('press scale mirrors --press-scale (CSS micro-feedback ⇄ JS press recipes)', () => {
    expect(pressScale).toBeCloseTo(readUnitless('--press-scale'), 5);
  });

  it('stagger cadences mirror --stagger-fast/base/slow', () => {
    expect(staggerFast).toBeCloseTo(readDurationSeconds('--stagger-fast'), 5);
    expect(staggerBase).toBeCloseTo(readDurationSeconds('--stagger-base'), 5);
    expect(staggerSlow).toBeCloseTo(readDurationSeconds('--stagger-slow'), 5);
  });

  it('hover-lift geometry mirrors --hover-lift-y (Tailwind unit → px) + --hover-lift-scale', () => {
    // CSS `--hover-lift-y` is a Tailwind translate unit at the 4px spacing scale
    // (-0.5 = -2px); the JS recipe works in px. Convert before comparing.
    const cssYUnit = readUnitless('--hover-lift-y');
    expect(hoverLiftY).toBeCloseTo(cssYUnit * 4, 5);
    expect(hoverLiftScale).toBeCloseTo(readUnitless('--hover-lift-scale'), 5);
  });

  it('parallaxRate mirrors --scroll-parallax-rate', () => {
    expect(parallaxRate).toBeCloseTo(readUnitless('--scroll-parallax-rate'), 5);
  });
});

describe('entrance geometry tokens stay in sync', () => {
  it('entranceY mirrors --entrance-y (px)', () => {
    // CSS token is in px; JS value is in motion px (1:1). No unit conversion.
    expect(entranceY).toBeCloseTo(readUnitless('--entrance-y'), 5);
    expect(entranceYLarge).toBeCloseTo(readUnitless('--entrance-y-lg'), 5);
  });

  it('entrance-zoom aliases --vt-zoom-scale (one VT zoom value)', () => {
    expect(readUnitless('--entrance-zoom')).toBeCloseTo(readUnitless('--vt-zoom-scale'), 5);
  });
});

describe('semantic easing aliases do not drift from raw tokens', () => {
  it('--ease-fluid aliases --ease-out', () => {
    expect(readCubicBezier('--ease-fluid')).toEqual(readCubicBezier('--ease-out'));
  });
  it('--ease-snappy aliases --ease-in-out', () => {
    expect(readCubicBezier('--ease-snappy')).toEqual(readCubicBezier('--ease-in-out'));
  });
});
