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
    transition.ready.catch((error) => {
      console.info("View transition ready promise rejected:", error);
    });
    transition.finished.catch((error) => {
      console.info("View transition finished promise rejected:", error);
    });
  } else {
    callback();
  }
}
