/**
 * Pumni OS - View Transition helper
 * Progressive enhancement wrapper around View Transitions API.
 */
export function withViewTransition(callback: () => void): void {
  if (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const transition = document.startViewTransition(callback);
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
  } else {
    callback();
  }
}
