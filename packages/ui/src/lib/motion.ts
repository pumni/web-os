/**
 * Motion token bridge.
 * ---------------------
 * Mirrors the CSS motion primitives in `styles/tokens.css` so that JS-driven
 * animations (the `motion` library) and CSS transitions share ONE source of
 * truth. Keep these values in sync with `--duration-*` / `--ease-*` in
 * tokens.css — if the curve changes there, change it here too.
 *
 * Pure data: this module imports nothing from `motion`, so it stays free to be
 * consumed by server or client code.
 */

/** Seconds (motion expects seconds; CSS tokens are the ms equivalents). */
export const duration = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
} as const;

/** cubic-bezier control points, typed as motion's BezierDefinition tuple. */
export const easing = {
  /** Emphasized decelerate — entrances. Mirrors `--ease-out`. */
  fluid: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Symmetric — moves / reorders. Mirrors `--ease-in-out`. */
  snappy: [0.65, 0, 0.35, 1] as [number, number, number, number],
} as const;

/** Ready-made `transition` props for motion components. */
export const transition = {
  fluid: { duration: duration.base, ease: easing.fluid },
  snappy: { duration: duration.base, ease: easing.snappy },
} as const;

export const motionTokens = { duration, easing, transition } as const;
