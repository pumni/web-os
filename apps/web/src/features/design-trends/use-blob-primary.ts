'use client';

import * as React from 'react';

import { parseOklch } from '@pumni/ui/lib/oklch';

/**
 * Read the resolved CSS value of `--desktop-blob-primary` from the live
 * document cascade. The playground uses this to drive the *background-reactive
 * tint* technique (Glassmorphism 2.0 / 2026): a glass surface should tint
 * itself toward the dominant hue of the colourful backdrop it refracts, so
 * a coral blob produces a warm tint and a cyan blob a cool tint — without
 * changing the APCA-gated semantic token in the design system.
 *
 * Returns `null` until mounted (SSR-safe) or when the variable resolves to
 * an empty string. Polls on `tick` so the caller can re-sample after the
 * backdrop type changes.
 */
export function useBlobPrimary(tick: unknown): string | null {
  const [value, setValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sample = () => {
      const resolved = getComputedStyle(document.documentElement)
        .getPropertyValue('--desktop-blob-primary')
        .trim();
      setValue(resolved.length > 0 ? resolved : null);
    };
    const handle = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(handle);
  }, [tick]);

  return value;
}

/**
 * Parse a colour literal (e.g. the value returned by `useBlobPrimary`) into
 * OKLCH channels. Delegates to the exempt colour-math file so this feature
 * module never hand-writes a colour-parser regex the design-token boundary
 * guard would flag. Returns `null` when the input is missing or malformed —
 * the reactive-tint path tolerates that by falling back to the static tint.
 */
export function parseOklchLiteral(value: string | null): {
  l: number;
  c: number;
  h: number;
} | null {
  if (!value) return null;
  try {
    const parsed = parseOklch(value);
    return { l: parsed.l, c: parsed.c, h: parsed.h };
  } catch {
    return null;
  }
}
