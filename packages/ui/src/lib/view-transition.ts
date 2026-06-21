/**
 * withViewTransition — Pumni OS progressive-enhancement wrapper.
 *
 * Wraps a synchronous state update or navigation callback in the native
 * View Transitions API when available and when the user hasn't opted out
 * of animations via `prefers-reduced-motion`. Falls back to a plain call.
 *
 * Architecture notes:
 * - Zero runtime cost on unsupported browsers (feature-gated).
 * - GPU-composited: the animation runs off the main thread.
 * - Respects OS / browser reduced-motion preference.
 * - Optional `type` tags the transition so the named CSS keyframe groups in
 *   `view-transitions.css` (slide-forward / slide-back / morph-zoom /
 *   card-crossfade) can be selected declaratively. Uses the native
 *   `ViewTransition.types` set (Chrome 125+) when present; falls back to a
 *   `data-vt-type` attribute on <html> so older engines can target it via
 *   an attribute selector in CSS.
 *
 * Usage:
 *   withViewTransition(() => router.push("/new-page"));
 *   withViewTransition(() => setActiveTab("chat"), { type: "slide-forward" });
 */

/**
 * Named transition groups. Each maps 1:1 to a `::view-transition-group(*)`
 * rule set in `view-transitions.css` (slide-forward / slide-back / morph-zoom
 * / card-crossfade). The string form is the value set on
 * `ViewTransition.types` (or the `data-vt-type` fallback attribute).
 *
 * Types usage:
 * - slide-forward  — navigate deeper (dashboard → sub-page, dock item click)
 * - slide-back     — navigate shallower (back button, browser back)
 * - morph-zoom     — shared-element morph (same element on both pages)
 * - card-crossfade — same-route content swap (tabs, filters — already used by Tabs)
 */
export type ViewTransitionType =
  | 'slide-forward'
  | 'slide-back'
  | 'morph-zoom'
  | 'card-crossfade';

type WithViewTransitionOptions = {
  /** Tag the transition so CSS can pick a named keyframe group. */
  type?: ViewTransitionType;
};

export function withViewTransition(
  callback: () => void,
  options: WithViewTransitionOptions = {},
): void {
  if (
    typeof document === 'undefined' ||
    !('startViewTransition' in document) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    callback();
    return;
  }

  const { type } = options;
  // `data-vt-type` is the cross-engine fallback: set before the snapshot so
  // CSS attribute selectors (`::view-transition-group(*)[data-vt-type=…]`) and
  // descendant rules can branch on it even where `ViewTransition.types` is
  // unavailable. Cleared on `finished` so it never leaks past the transition.
  if (type) document.documentElement.dataset.vtType = type;

  const transition = document.startViewTransition(callback);

  // Native per-transition typing (Chrome 125+): set on `types` so
  // `:active-view-transition-type(<type>)` and pseudo selectors work without
  // a DOM attribute. Wrapped — older engines lack the `types` set accessor.
  if (type && transition.types) {
    transition.types.add(type);
  }

  const cleanup = () => {
    if (type) delete document.documentElement.dataset.vtType;
  };
  transition.ready.catch((error) => {
    cleanup();
    console.info('View transition ready promise rejected:', error);
  });
  transition.finished.then(cleanup, (error) => {
    cleanup();
    console.info('View transition finished promise rejected:', error);
  });
}
