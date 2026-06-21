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

/**
 * Hover-lift geometry — mirrors `--hover-lift-y` / `--hover-lift-scale` so a
 * `recipes.hoverLift` card rises to the same depth as a CSS `interactive` card.
 * `y` is in MOTION px (the CSS token is a Tailwind translate unit; the test
 * converts). Kept in sync by `motion-tokens.test.ts`.
 */
export const hoverLiftY = -2;
export const hoverLiftScale = 1.01;

/**
 * Entrance geometry — mirrors `--entrance-y` / `--entrance-y-lg` so JS recipes
 * rise to the same depth as CSS entrances. Kept in sync by `motion-tokens.test.ts`.
 */
export const entranceY = 8;
export const entranceYLarge = 16;

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
 * Stagger cadence in seconds — mirrors `--stagger-fast` / `--stagger-base` /
 * `--stagger-slow` (30 / 50 / 80 ms) in tokens.css. Kept in sync by
 * `motion-tokens.test.ts`.
 */
export const staggerFast = 0.03;
export const staggerBase = 0.05;
export const staggerSlow = 0.08;

export const recipes = {
  /** Card / tile hover — subtle rise + tap press. Snappy (a move, not an entrance).
   *  Geometry mirrors the CSS `interactive` card variant (`--hover-lift-y` /
   *  `--hover-lift-scale`) so JS- and CSS-driven cards rise to the same depth. */
  hoverLift: {
    whileHover: { y: hoverLiftY, scale: hoverLiftScale },
    whileTap: { scale: pressScale },
    transition: transition.snappy,
  },
  /** Button / icon press feedback — tactile depress on tap (mirrors CSS `--press-scale`). */
  pressScale: {
    whileTap: { scale: pressScale },
    transition: transition.snappy,
  },
  /** List/grid entrance — parent orchestrates children. Pair with `staggerItem`.
   *  Default cadence mirrors `--stagger-base` (50ms). */
  staggerContainer: {
    initial: 'hidden',
    animate: 'visible',
    variants: {
      hidden: {},
      visible: { transition: { staggerChildren: staggerBase, delayChildren: 0.02 } },
    },
  },
  /** Fast cascade — dropdown menus, command palette rows. Mirrors `--stagger-fast`. */
  staggerContainerFast: {
    initial: 'hidden',
    animate: 'visible',
    variants: {
      hidden: {},
      visible: { transition: { staggerChildren: staggerFast, delayChildren: 0.01 } },
    },
  },
  /** Languid cascade — hero sections, onboarding. Mirrors `--stagger-slow`. */
  staggerContainerSlow: {
    initial: 'hidden',
    animate: 'visible',
    variants: {
      hidden: {},
      visible: { transition: { staggerChildren: staggerSlow, delayChildren: 0.04 } },
    },
  },
  /** Child of `staggerContainer` — fade + rise into place. */
  staggerItem: {
    variants: {
      hidden: { opacity: 0, y: entranceY },
      visible: { opacity: 1, y: 0, transition: transition.fluid },
    },
  },
  /** Content enter/exit — wrap in `AnimatePresence` for the exit. Entrance curve. */
  fadeRise: {
    initial: { opacity: 0, y: entranceY },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: entranceY },
    transition: transition.fluid,
  },
  /**
   * Draggable surface — for OS-style windows and panels that follow the cursor
   * with momentum. Spread onto a `motion.*` element paired with `useDragControls`
   * (the caller holds the controls; `dragListener={false}` keeps the element
   * inert until a drag handle calls `controls.start(e)`). `dragMomentum` lets the
   * surface coast to a stop after release; `dragElastic` softens the edge
   * constraint. Reduced-motion callers should pass `dragEnabled={false}`.
   */
  draggableSurface: {
    drag: true,
    dragMomentum: true,
    dragElastic: 0.12,
    dragTransition: { power: 0.28, timeConstant: 220, modifyEdge: (edge: number) => edge },
  },
  /**
   * Layout-aware surface — adds `layout` so motion smoothly animates size /
   * position changes (resize, reorder, mount/unmount). Pair with `motion.*` for
   * elements whose layout shifts in response to state (e.g. an expanding panel
   * or a grid that reflows). Reduced-motion callers should drop `layout`.
   */
  layoutAware: {
    layout: true,
    transition: transition.snappy,
  },
} as const;

/**
 * Spring presets — motion's `type: 'spring'` transition presets for tactile,
 * physics-based motion that CSS easing cannot express (inertia, settle, bounce).
 * Each preset is `{ type, stiffness, damping, mass }` ready to spread into a
 * `transition` prop. The names mirror the curve INTENT of the CSS easings
 * (`fluid` = gentle settle, `snappy` = quick lock, `spring` = playful overshoot),
 * not their exact cubic-bezier math — springs cannot be cubic-beziers.
 *
 * Pair with `useReducedMotion()` (CSS easings under reduced-motion neutralise
 * via the `duration: 0` transition; springs need the same explicit gate).
 */
export const springs = {
  /** Gentle settle — large UI shifts where a hard lock feels mechanical. */
  fluid: { type: 'spring' as const, stiffness: 120, damping: 18, mass: 1 },
  /** Quick lock — the spring analogue of `ease-snappy`. Default for most UI. */
  snappy: { type: 'spring' as const, stiffness: 320, damping: 30, mass: 1 },
  /** Playful overshoot — the spring analogue of `ease-spring`. Toasts, success. */
  bouncy: { type: 'spring' as const, stiffness: 280, damping: 14, mass: 1 },
} as const;

/**
 * Parallax depth factor — the multiplier applied to scroll progress for the
 * "far" layer in a scroll-linked parallax pair. Picked (0.3) so the back layer
 * drifts ~30% of the front layer's scroll displacement — a subtle depth cue that
 * doesn't read as a gimmick. Mirrors `--scroll-parallax-rate` in tokens.css.
 * Kept in sync by `motion-tokens.test.ts`.
 */
export const parallaxRate = 0.3;

export const motionTokens = {
  duration,
  easing,
  pressScale,
  hoverLiftY,
  hoverLiftScale,
  entranceY,
  entranceYLarge,
  transition,
  recipes,
  springs,
  parallaxRate,
  staggerFast,
  staggerBase,
  staggerSlow,
} as const;
