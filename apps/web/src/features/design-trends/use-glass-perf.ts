'use client';

import * as React from 'react';

/**
 * Sample FPS via requestAnimationFrame delta time, EMA-smoothed.
 *
 * Used only by the design-trends playground to *teach* the perf discipline
 * (ADR-0014 cap of 2 stacked glass layers). Not a production hook.
 */
export function useFps(): number {
  const [fps, setFps] = React.useState(60);
  const rafRef = React.useRef<number | null>(null);
  const lastRef = React.useRef<number | null>(null);
  const smoothRef = React.useRef<number>(60);

  React.useEffect(() => {
    const tick = (t: number) => {
      const last = lastRef.current;
      lastRef.current = t;
      if (last != null) {
        const delta = t - last;
        if (delta > 0) {
          const instant = 1000 / delta;
          // EMA smoothing — reduces per-frame jitter without lagging.
          smoothRef.current = smoothRef.current * 0.9 + instant * 0.1;
          setFps(Math.round(smoothRef.current));
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return fps;
}

/**
 * Count mounted glass surfaces inside `scope` (defaults to document).
 *
 * The playground renders glass layers via `<GlassSurface>` which set
 * `data-slot="glass-surface"`. Counting them gives a live readout for the
 * perf-discipline teaching panel — the spec caps stacked glass at 2 layers
 * (each glass layer forces a separate backdrop render pass; ADR-0014/0016).
 *
 * `stacked` counts the maximum nested depth (a glass inside a glass) so the
 * dashboard can warn when a third layer would push past the cap. The DOM
 * query is cheap (a single `querySelectorAll`) and only re-runs on `tick`.
 */
export function useGlassLayerCount(tick: unknown): { total: number; stacked: number } {
  const [counts, setCounts] = React.useState<{ total: number; stacked: number }>({
    total: 0,
    stacked: 0,
  });

  React.useEffect(() => {
    const measure = () => {
      const nodes = document.querySelectorAll('[data-slot="glass-surface"]');
      let maxStack = 0;
      nodes.forEach((node) => {
        let depth = 0;
        let parent = node.parentElement;
        while (parent) {
          if (parent.getAttribute?.('data-slot') === 'glass-surface') depth++;
          parent = parent.parentElement;
        }
        if (depth > maxStack) maxStack = depth;
      });
      setCounts({ total: nodes.length, stacked: maxStack + (nodes.length ? 1 : 0) });
    };
    // Defer to next frame so layout settles after the tick.
    const handle = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(handle);
  }, [tick]);

  return counts;
}
