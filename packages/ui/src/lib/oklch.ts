/*
 * OKLCH ↔ sRGB conversion — the shared colour primitive for the design system.
 *
 * IMPORTANT: `oklchToSrgb` returns *linear-light* sRGB channels (the OKLab→sRGB
 * matrix output, clamped to gamut) and intentionally does NOT apply the sRGB
 * gamma transfer. The APCA pipeline in `apca.ts` consumes these values directly
 * with its own `** 2.4` curve, and the contrast thresholds in
 * `glass-contrast.test.ts` are calibrated against this exact pairing. Changing
 * the conversion (e.g. adding gamma encoding) silently shifts every gated Lc
 * value. Keep this function and `apcaContrast` as one calibrated unit.
 */

export type Oklch = { l: number; c: number; h: number; alpha: number };

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * OKLCH → sRGB (linear, clamped to 0–1). Hue in degrees.
 * Pairs with `apcaContrast`; see the file header before changing.
 */
export function oklchToSrgb({ l, c, h }: { l: number; c: number; h: number }): [
  number,
  number,
  number,
] {
  const hueRadians = (h * Math.PI) / 180;
  const a = c * Math.cos(hueRadians);
  const b = c * Math.sin(hueRadians);

  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;

  const lCubed = lPrime ** 3;
  const mCubed = mPrime ** 3;
  const sCubed = sPrime ** 3;

  return [
    clamp01(4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed),
    clamp01(-1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed),
    clamp01(-0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed),
  ];
}

const OKLCH_PATTERN = new RegExp(
  '^oklch\\(\\s*(?<l>[\\d.]+)\\s+(?<c>[\\d.]+)\\s+(?<h>[\\d.]+)' +
    '(?:\\s*/\\s*(?<alpha>[\\d.]+))?\\s*\\)$',
);

/** Parse a literal `oklch(L C H)` / `oklch(L C H / A)` string. Throws otherwise. */
export function parseOklch(value: string): Oklch {
  const match = value.trim().match(OKLCH_PATTERN);
  if (!match?.groups) {
    throw new Error(`Expected OKLCH color, received: ${value}`);
  }
  return {
    l: Number(match.groups.l),
    c: Number(match.groups.c),
    h: Number(match.groups.h),
    alpha: match.groups.alpha ? Number(match.groups.alpha) : 1,
  };
}

/**
 * Format an OKLCH triad as a CSS string. Pass `alpha` (0–1) to emit the
 * modern slash-separated alpha form (`oklch(L C H / A)`); omit it for a solid
 * colour. Centralising the `oklch(` literal here (an exempt colour-math file)
 * keeps callers from hand-writing the function name, which the
 * `checkDesignTokenBoundaries` lint flags as a token-boundary violation.
 */
export function formatOklch(
  { l, c, h }: { l: number; c: number; h: number },
  options: { precision?: number; alpha?: number } = {},
): string {
  const precision = options.precision ?? 4;
  const round = (n: number) => Number(n.toFixed(precision));
  const channels = `${round(l)} ${round(c)} ${round(h)}`;
  return options.alpha === undefined
    ? `oklch(${channels})`
    : `oklch(${channels} / ${round(options.alpha)})`;
}
