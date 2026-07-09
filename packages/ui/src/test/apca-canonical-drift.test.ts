import { describe, expect, it } from 'vitest';
import { APCAcontrast, sRGBtoY, fontLookupAPCA } from 'apca-w3';

import { apcaContrast } from '../lib/apca';
import { oklchToSrgb } from '../lib/oklch';

/**
 * Drift guard for the hand-rolled APCA 0.0.98G-4g implementation in
 * `lib/apca.ts` against the canonical `apca-w3` npm package (Myndex
 * reference, W3 license — the only code the SAPC-APCA repo endorses "for
 * any development purpose"). If Myndex ever publishes a bug fix to the
 * 0.0.98G-4g base algorithm on the `apca-w3` package, this test fails
 * loudly; the hand-roll must then be rebased against the canonical source.
 *
 * Inputs are 0..1 gamma-encoded sRGB floats (the encoding the browser
 * resolves tokens to, see `lib/oklch.ts`). `sRGBtoY` in apca-w3 expects
 * 0..255 channels and divides internally; multiplying by 255 makes the
 * two code paths operate on the same input space.
 *
 * TOLERANCE: 0.5 Lc. The two code paths share the same constants
 * (mainTRC 2.4, sRco/sGco/sBco, G-4g exponents/clamps/scalers) but
 * diverge in quantization order: our `apcaContrast` linearizes the 0..1
 * float channels directly, while canonical `sRGBtoY` rounds to 8bpc
 * (0..255 ints) *before* linearizing, which moves the gamma exponent's
 * input by up to ~0.5/255 per channel. Under APCA's时光网 scaling that
 * propagates to up to ~0.3 Lc on saturated mid-tone pairs (empirically
 * measured — see the diag run that motivated this threshold). A 0.5 Lc
 * budget keeps the guard sensitive to algorithm drift (constant
 * changes, clamp moves) without flagging the unavoidable 8bpc
 * quantization gap. If Myndex releases a 0.0.98G-4g fix that shifts
 * outputs by less than 0.5 Lc this guard will not fire — that is
 * acceptable; the canonical code can be re-copied at the next manual
 * rebase without a test forcing it.
 */

const TOLERANCE = 0.5;

type Rgb01 = [number, number, number];
type Oklch = { l: number; c: number; h: number; alpha: number };

function nativeLc(fg: Rgb01, bg: Rgb01): number {
  const s = (c: number) => Math.round(c * 255);
  return APCAcontrast(
    sRGBtoY([s(fg[0]), s(fg[1]), s(fg[2])]),
    sRGBtoY([s(bg[0]), s(bg[1]), s(bg[2])]),
  );
}

const samples: Array<{ label: string; fg: Oklch; bg: Oklch }> = [
  {
    label: 'dark text on cream (typical BoW chrome)',
    fg: { l: 0.2, c: 0.01, h: 250, alpha: 1 },
    bg: { l: 0.96, c: 0.01, h: 250, alpha: 1 },
  },
  {
    label: 'white text on coral brand (typical WoB button)',
    fg: { l: 0.98, c: 0, h: 0, alpha: 1 },
    bg: { l: 0.545, c: 0.14, h: 38, alpha: 1 },
  },
  {
    label: 'white on indigo-600 (WoB brand)',
    fg: { l: 0.985, c: 0, h: 0, alpha: 1 },
    bg: { l: 0.511, c: 0.16, h: 276.966, alpha: 1 },
  },
  {
    label: 'muted text on muted bg (low-contrast chrome)',
    fg: { l: 0.5, c: 0.005, h: 70, alpha: 1 },
    bg: { l: 0.92, c: 0.006, h: 73, alpha: 1 },
  },
  {
    label: 'primary-text on card (Step-11 text role)',
    fg: { l: 0.45, c: 0.13, h: 38, alpha: 1 },
    bg: { l: 0.985, c: 0.005, h: 75, alpha: 1 },
  },
  {
    label: 'white on dark neutral (dark-mode surface)',
    fg: { l: 0.985, c: 0, h: 0, alpha: 1 },
    bg: { l: 0.19, c: 0.0035, h: 70, alpha: 1 },
  },
  {
    label: 'near-black on near-white (extreme polarity)',
    fg: { l: 0.05, c: 0, h: 0, alpha: 1 },
    bg: { l: 0.99, c: 0, h: 0, alpha: 1 },
  },
  {
    label: 'mid-tone dead zone (APCA dead L≈0.7)',
    fg: { l: 0.36, c: 0, h: 0, alpha: 1 },
    bg: { l: 0.7, c: 0, h: 0, alpha: 1 },
  },
];

describe('apca.ts hand-roll matches the canonical apca-w3 npm', () => {
  it.each(samples)(
    'matches APCAcontrast(sRGBtoY, sRGBtoY) for "$label"',
    ({ fg, bg }) => {
      const ourRgb = oklchToSrgb(fg);
      const bgRgb = oklchToSrgb(bg);
      const ours = apcaContrast(ourRgb, bgRgb);
      const canonical = nativeLc(ourRgb, bgRgb);
      expect(
        Math.abs(ours - canonical),
        `our Lc=${ours} vs canonical Lc=${canonical}`,
      ).toBeLessThanOrEqual(TOLERANCE);
    },
  );

  it('fontLookupAPCA is callable (used by the accent font-floor test)', () => {
    // Sanity check: the npm font-lookup helper is reachable from this package.
    const arr = fontLookupAPCA(60);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBe(10);
  });
});
