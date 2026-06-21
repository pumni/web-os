/**
 * Shared overlay motion vocabulary & Animation Surface Architecture.
 * -----------------------------------------------------------------
 * The floating-layer open/close + directional slide-in classes are IDENTICAL
 * across Dialog, Sheet, Popover, DropdownMenu, and ContextMenu. They were
 * previously copy-pasted into every file, so a single motion change drifted
 * across five copies. This module holds the one true source so every portaled
 * overlay animates from the same vocabulary.
 *
 * Internal only: not re-exported from the package barrel. Consumers reach the
 * overlay components; they never compose these strings themselves.
 *
 * CSS-first by design (see docs/conventions/design-system.md): these are plain
 * Tailwind data-attribute utilities consumed verbatim by `twMerge`, not motion
 * library variants. React Compiler memoises the call sites.
 *
 * Pumni OS animation surfaces (mid-2026):
 *
 * - CSS micro-feedback (hover/press)  → Tailwind `motion-safe:` + tokens.
 *   Reach: card `interactive`, button press, switch thumb.
 * - Overlay enter/exit                 → tw-animate-css (this module).
 *   Reach: dialog/sheet/popover/menu/tooltip/command/select.
 * - JS orchestration                  → `motion` lib + `lib/motion.ts` recipes.
 *   Reach: window mount, shared-layoutId indicators, stagger entrances.
 * - View Transitions                  → native VT API + `view-transitions.css`.
 *   Reach: cross-route navigation (`withViewTransition(cb, { type })`).
 * - Scroll-driven                     → `scroll.css` (`animation-timeline`).
 *   Reach: marketing-page reveal-on-scroll.
 *
 * Reduced-motion contract: global CSS net (glass.css) + `motion-safe:` +
 * `MotionConfig reducedMotion="user"` (root) + explicit `useReducedMotion()`
 * on JS motion whose props must drop entirely (not just neutralize).
 *
 * Why tw-animate-css for overlays (rather than @starting-style):
 * tw-animate-css (v1.4) uses `@property` registered CSS custom properties
 * (`--tw-enter-*`, `--tw-exit-*`) + `enter`/`exit` keyframes. This mechanism
 * works reliably with Radix's open/closed lifecycle: `data-state="open"` mounts
 * the element → `animate-in` runs; `data-state="closed"` starts the exit
 * animation before Radix unmounts. The animation is fill-mode-none so the
 * element lands at its computed value after the animation ends.
 *
 * `@starting-style` solves a DIFFERENT problem: animating INTO a `display: none`
 * ↔ `display: block` transition without JavaScript. Radix controls visibility
 * via `data-state`, not `display`, so the @starting-style gain is marginal for
 * Radix overlays. The tw-animate-css approach is the industry standard for
 * Radix-powered design systems in 2026.
 */

/**
 * Open/close enter-exit: fade + zoom. Applied to every portaled overlay panel
 * (dialog content, sheet panel, popover/menu content, sub-content, tooltip).
 */
export const OVERLAY_ANIMATION =
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95';

/**
 * Directional slide-in keyed off the Radix `data-side` the floating layer
 * resolved to. Only meaningful for side-anchored layers (popovers/menus), not
 * centred dialogs or edge sheets which use their own slide utilities.
 */
export const OVERLAY_SLIDE_SIDES =
  'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2';

/**
 * Side-anchored popover/menu content: the shared animation + directional slide,
 * composed once. Pair with the component-specific surface classes
 * (glass-panel, width, padding, origin var) at the call site.
 *
 * @example
 * cn('glass-panel w-72 ...origin-(--radix-popover-content-transform-origin)...', OVERLAY_PANEL_MOTION)
 */
export const OVERLAY_PANEL_MOTION = `${OVERLAY_SLIDE_SIDES} ${OVERLAY_ANIMATION}`;
