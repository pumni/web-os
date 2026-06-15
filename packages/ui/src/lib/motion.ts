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
  slower: 0.48 /* page / view-transition (~500ms) */,
} as const;

/**
 * Tactile press depress — the unitless scale shared by CSS micro-feedback
 * (`--press-scale` in tokens.css, used via `active:scale-(--press-scale)`) and
 * the JS press recipes below, so a button/card depresses to the same depth
 * whether it is CSS- or motion-driven. Kept in sync by `motion-tokens.test.ts`.
 */
export const pressScale = 0.97;

/** cubic-bezier control points, typed as motion's BezierDefinition tuple. */
export const easing = {
  /** Emphasized decelerate — entrances. Mirrors `--ease-out`. */
  fluid: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Symmetric — moves / reorders. Mirrors `--ease-in-out`. */
  snappy: [0.65, 0, 0.35, 1] as [number, number, number, number],
  /** Overshoot pop — modal/success/shake. Mirrors `--ease-spring`. */
  spring: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number],
} as const;

/** Ready-made `transition` props for motion components. */
export const transition = {
  fluid: { duration: duration.base, ease: easing.fluid },
  snappy: { duration: duration.base, ease: easing.snappy },
} as const;

/**
 * Named interaction recipes — the brand's "house" gestures, composed from the
 * tokens above so every animated surface reads from one vocabulary instead of
 * hand-rolling magic numbers (the JS analogue of the radius/glass utilities).
 *
 * Each recipe is plain data meant to be spread onto a `motion.*` element, e.g.
 * `<motion.button {...recipes.pressScale}>`. They describe the FULL-energy path
 * only: motion's JS animations are not silenced by the CSS reduced-motion media
 * query, so a component that uses a recipe MUST still call `useReducedMotion()`
 * and skip/neutralise it when reduced (see `Window`). Stagger cadence is
 * token-hoá via `staggerBase` (mirrors `--stagger-base` in tokens.css).
 */
/**
 * Stagger cadence in seconds — mirrors `--stagger-base` (50ms = 0.05s) in
 * tokens.css. Kept in sync by `motion-tokens.test.ts`.
 */
export const staggerBase = 0.05;

export const recipes = {
  /** Card / tile hover — subtle rise + tap press. Snappy (a move, not an entrance). */
  hoverLift: {
    whileHover: { y: -2, scale: 1.01 },
    whileTap: { scale: pressScale },
    transition: transition.snappy,
  },
  /** Button / icon press feedback — tactile depress on tap (mirrors CSS `--press-scale`). */
  pressScale: {
    whileTap: { scale: pressScale },
    transition: transition.snappy,
  },
  /** List/grid entrance — parent orchestrates children. Pair with `staggerItem`. */
  staggerContainer: {
    initial: 'hidden',
    animate: 'visible',
    variants: {
      hidden: {},
      visible: { transition: { staggerChildren: staggerBase, delayChildren: 0.02 } },
    },
  },
  /** Child of `staggerContainer` — fade + rise into place. */
  staggerItem: {
    variants: {
      hidden: { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0, transition: transition.fluid },
    },
  },
  /** Content enter/exit — wrap in `AnimatePresence` for the exit. Entrance curve. */
  fadeRise: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: transition.fluid,
  },
} as const;

export const motionTokens = {
  duration,
  easing,
  pressScale,
  transition,
  recipes,
  staggerBase,
} as const;
