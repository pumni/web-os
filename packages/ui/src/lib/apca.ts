/* ✦ APCA - Advanced Perceptual Contrast Algorithm ✦ */
/* Reference implementation: https://github.com/Myndex/apca-w3            */
/* Algorithm spec (0.0.98G-4g, Feb 15 2021):                              */
/*   https://github.com/Myndex/SAPC-APCA/blob/master/documentation/APCA-W3-LaTeX.md */
/* Living guideline (use-case Lc floors live here, not in the algorithm   */
/* repo, which has been superseded — see SAPC-APCA README):               */
/*   APCA Readability Criterion — Bronze Simple Mode                      */
/*   https://readtech.org/ARC/tests/bronze-simple-mode/                    */
/* Version: 0.0.98G-4g (Feb 15, 2021) — matches apca-w3@0.1.9 base alg.   */
/* Drift guard: see `apca-canonical-drift.test.ts` (diffs against npm).   */
/* WCAG 2.x compliance bridge (non-gating): see `glass-wcag2-bridge.test.ts`. */

import { formatOklch, oklchToSrgb } from './oklch';

// ——— SAPC/APCA 0.0.98G-4g constants (W3 license) ———
const mainTRC = 2.4; // 2.4 exponent emulates actual monitor perception

const sRco = 0.2126729;
const sGco = 0.7151522;
const sBco = 0.072175; // matches official 0.072175 (not 0.0721750 which is same value)

// G-4g exponents
const normBG = 0.56;
const normTXT = 0.57;
const revTXT = 0.62; // reverse polarity: text exponent
const revBG = 0.65; // reverse polarity: bg exponent

// G-4g clamps & scalers
const blkThrs = 0.022;
const blkClmp = 1.414;
const scaleBoW = 1.14;
const scaleWoB = 1.14;
const loBoWoffset = 0.027;
const loWoBoffset = 0.027;
const deltaYmin = 0.0005;
const loClip = 0.1;

/**
 * sRGB → relative luminance Y (APCA method: simple 2.4 exponent).
 * Takes channel values in 0.0–1.0 range.
 * Per APCA spec, uses simple exponent (not IEC piecewise) to emulate
 * actual monitor perception.
 */
export function apcaLuminance(r: number, g: number, b: number): number {
  return sRco * r ** mainTRC + sGco * g ** mainTRC + sBco * b ** mainTRC;
}

/**
 * APCA contrast value (Lc). Returns signed float.
 *
 * Positive = dark text on light background (BoW).
 * Negative = light text on dark background (WoB).
 *
 * Perceptual scale: Lc 60 ≈ body text minimum, Lc 25 ≈ UI element minimum.
 * Range approximately −110 to +110.
 */
export function apcaContrast(fg: [number, number, number], bg: [number, number, number]): number {
  let txtY = apcaLuminance(...fg);
  let bgY = apcaLuminance(...bg);

  // Input range clamp
  if (
    Number.isNaN(txtY) ||
    Number.isNaN(bgY) ||
    Math.min(txtY, bgY) < 0 ||
    Math.max(txtY, bgY) > 1.1
  ) {
    return 0;
  }

  // Soft clamp near-black: prevents divide-by-zero & flare compensation
  txtY = txtY > blkThrs ? txtY : txtY + (blkThrs - txtY) ** blkClmp;
  bgY = bgY > blkThrs ? bgY : bgY + (blkThrs - bgY) ** blkClmp;

  // Return 0 for extremely low ∆Y
  if (Math.abs(bgY - txtY) < deltaYmin) return 0;

  let sapc: number;
  let output: number;

  if (bgY > txtY) {
    // Normal polarity: dark text on light background (BoW)
    sapc = (bgY ** normBG - txtY ** normTXT) * scaleBoW;
    output = sapc < loClip ? 0 : sapc - loBoWoffset;
  } else {
    // Reverse polarity: light text on dark background (WoB)
    sapc = (bgY ** revBG - txtY ** revTXT) * scaleWoB;
    output = sapc > -loClip ? 0 : sapc + loWoBoffset;
  }

  return output * 100;
}

/* ───────────────────────── Inverse APCA ─────────────────────────
 * Given a background, derive a foreground that hits a target Lc — so brand
 * colours produce accessible text/UI *by construction* instead of by hand-tuning
 * (ADR-0010). Works on the OKLCH lightness axis via the same `oklchToSrgb` +
 * `apcaContrast` pair the contrast gate uses, so generated colours satisfy the
 * gate up front. |Lc| is monotonic in foreground lightness for a fixed
 * background, which makes the bisection below well-defined.
 */

export type Polarity = 'auto' | 'lighter' | 'darker';

export interface ContrastColorOptions {
  /** Hue (deg) of the derived colour. Default 0 (neutral). */
  hue?: number;
  /** Chroma of the derived colour. Default 0 (neutral → always in sRGB gamut). */
  chroma?: number;
  /** Search direction. `auto` picks the readable side from the anchor lightness. */
  polarity?: Polarity;
  /** Bisection iterations (lightness precision). Default 48. */
  iterations?: number;
}

export interface ContrastColorResult {
  /** OKLCH lightness of the derived colour (0–1). */
  l: number;
  /** OKLCH chroma. */
  c: number;
  /** OKLCH hue (deg). */
  h: number;
  /** Achieved |Lc| against the anchor. */
  lc: number;
  /** CSS `oklch(...)` string, ready to drop into a token. */
  oklch: string;
  /** False when even the extreme (pure black/white) cannot reach `targetLc`. */
  reachedTarget: boolean;
}

/**
 * Bisect the lightness axis for the colour *closest to the anchor lightness*
 * that still meets `targetLc`. `lcAt(L)` is monotonic: ≈0 at the anchor, growing
 * toward the extreme. Returns the extreme (with `reachedTarget: false`) when even
 * pure black/white cannot reach the target.
 */
function searchLightness(
  anchorL: number,
  direction: 'lighter' | 'darker',
  targetLc: number,
  lcAt: (l: number) => number,
  iterations: number,
): { l: number; lc: number; reachedTarget: boolean } {
  const extreme = direction === 'lighter' ? 1 : 0;
  const maxLc = lcAt(extreme);

  if (maxLc < targetLc) {
    return { l: extreme, lc: maxLc, reachedTarget: false };
  }

  // `near` fails the target (close to anchor), `far` meets it (the extreme).
  let near = anchorL;
  let far = extreme;
  for (let i = 0; i < iterations; i++) {
    const mid = (near + far) / 2;
    if (lcAt(mid) >= targetLc) far = mid;
    else near = mid;
  }

  return { l: far, lc: lcAt(far), reachedTarget: true };
}

/**
 * Resolve the search direction. For `auto`, pick the side with the greater
 * contrast *capacity* (the extreme that achieves the higher |Lc|) — this is the
 * genuinely readable side, and is correct even for mid-lightness anchors where a
 * simple `L ≥ 0.5` rule would guess wrong.
 */
function resolveDirection(
  polarity: Polarity,
  anchorL: number,
  lcAt: (l: number) => number,
): 'lighter' | 'darker' {
  if (polarity !== 'auto') return polarity;
  // Tie favours `darker`, matching dark-text-on-light convention.
  return lcAt(1) > lcAt(0) ? 'lighter' : 'darker';
}

function deriveContrastColor(
  anchorL: number,
  targetLc: number,
  options: ContrastColorOptions,
  lcAt: (l: number) => number,
): ContrastColorResult {
  const { hue = 0, chroma = 0, polarity = 'auto', iterations = 48 } = options;
  const direction = resolveDirection(polarity, anchorL, lcAt);
  const { l, lc, reachedTarget } = searchLightness(anchorL, direction, targetLc, lcAt, iterations);
  return { l, c: chroma, h: hue, lc, oklch: formatOklch({ l, c: chroma, h: hue }), reachedTarget };
}

/**
 * Derive a foreground colour over `bg` that meets `targetLc` (e.g. 60 for body
 * text, 25 for UI edges). Returns the least-extreme colour that satisfies the
 * target — avoiding the eye strain of pure white/black.
 */
export function foregroundFor(
  bg: { l: number; c: number; h: number },
  targetLc: number,
  options: ContrastColorOptions = {},
): ContrastColorResult {
  const { hue = 0, chroma = 0 } = options;
  const bgRgb = oklchToSrgb(bg);
  const lcAt = (l: number) => Math.abs(apcaContrast(oklchToSrgb({ l, c: chroma, h: hue }), bgRgb));
  return deriveContrastColor(bg.l, targetLc, options, lcAt);
}

/**
 * Dual of `foregroundFor`: derive a background colour under a fixed `fg` that
 * meets `targetLc` (e.g. the least-tinted surface that keeps text readable).
 */
export function backgroundFor(
  fg: { l: number; c: number; h: number },
  targetLc: number,
  options: ContrastColorOptions = {},
): ContrastColorResult {
  const { hue = 0, chroma = 0 } = options;
  const fgRgb = oklchToSrgb(fg);
  const lcAt = (l: number) => Math.abs(apcaContrast(fgRgb, oklchToSrgb({ l, c: chroma, h: hue })));
  return deriveContrastColor(fg.l, targetLc, options, lcAt);
}
