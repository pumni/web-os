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
 *
 * Usage:
 *   withViewTransition(() => router.push("/new-page"));
 *   withViewTransition(() => setActiveTab("chat"));
 */
export function withViewTransition(callback: () => void): void {
  if (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const transition = document.startViewTransition(callback);
    transition.ready.catch((error) => {
      console.info('View transition ready promise rejected:', error);
    });
    transition.finished.catch((error) => {
      console.info('View transition finished promise rejected:', error);
    });
  } else {
    callback();
  }
}
