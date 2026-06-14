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
    document.startViewTransition(callback);
  } else {
    callback();
  }
}
