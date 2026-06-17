import { describe, expect, it } from 'vitest';

import { duration, easing, pressScale, staggerBase } from '@pumni/ui';
import { readDurationSeconds, readUnitless, tokenCss } from './token-test-utils';

/**
 * Motion bridge guard. `lib/motion.ts` is a hand-kept mirror of the `--duration-*`
 * / `--ease-*` CSS primitives in `tokens.css` (JS animations and CSS transitions
 * must share one source of truth). This test fails if the two drift apart.
 */

function readCubicBezier(name: string): [number, number, number, number] {
  const match = tokenCss.match(new RegExp(`${name}:\\s*cubic-bezier\\(([^)]+)\\)`));
  if (!match?.[1]) throw new Error(`Missing easing token: ${name}`);
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

  it('staggerBase mirrors --stagger-base (50ms → 0.05s)', () => {
    expect(staggerBase).toBeCloseTo(readDurationSeconds('--stagger-base'), 5);
  });
});
