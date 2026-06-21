'use client';

import * as React from 'react';
import { Card } from './card';
import type { VariantProps } from 'class-variance-authority';
import type { cardVariants } from './card';

/**
 * CardSpotlight — opt-in client wrapper that adds a pointer-tracked radial
 * highlight to a Card with `variant="spotlight"`.
 *
 * **Why a separate file?** The spotlight effect requires `onPointerMove` to
 * track the cursor position and update `--spot-x`/`--spot-y` CSS variables.
 * Keeping `Card` server-safe required isolating this handler here so the main
 * `card.tsx` stays importable in Server Components without marking it
 * `"use client"`.
 *
 * **How it works:**
 * 1. `onPointerMove` computes the cursor position relative to the card's
 *    bounding rect, expressed as a percentage.
 * 2. The CSS var pair `--spot-x`/`--spot-y` is injected via inline `style`.
 * 3. `glass.css` `@utility card-spotlight` reads those vars to position a
 *    `::before` radial-gradient overlay (compositor-friendly — only `opacity`
 *    and CSS vars animate; no `box-shadow` or layout properties).
 *
 * **Performance:** Only `opacity` transitions + CSS variable updates —
 * compositor-safe, no layout/paint. Reduced-motion: gradient hidden via CSS
 * media query in glass.css.
 *
 * **A11y:** `pointer-events: none` on the `::before` layer ensures clicks pass
 * through. Forced-colors: radial gradient is naturally ignored by the UA.
 *
 * @example
 * ```tsx
 * <CardSpotlight interactive className="p-6">
 *   <h3>Spotlight Card</h3>
 *   <p>Hover to see the pointer-tracked highlight.</p>
 * </CardSpotlight>
 * ```
 */
type CardSpotlightProps = Omit<React.ComponentProps<'div'>, 'style'> &
  Omit<VariantProps<typeof cardVariants>, 'variant'> & {
    asChild?: boolean;
    /** Inline styles are spread onto the Card (spotlight vars are set imperatively). */
    style?: React.CSSProperties;
  };

function CardSpotlight({
  ref,
  className,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  style,
  ...props
}: CardSpotlightProps) {
  const rectRef = React.useRef<DOMRect | null>(null);
  const scrollRef = React.useRef({ x: 0, y: 0 });
  const coordsRef = React.useRef<{ x?: string; y?: string }>({});
  const frameIdRef = React.useRef<number | null>(null);
  const pendingCoordsRef = React.useRef<{ clientX: number; clientY: number } | null>(null);

  React.useEffect(() => {
    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, []);

  const handlePointerEnter = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      rectRef.current = e.currentTarget.getBoundingClientRect();
      scrollRef.current = { x: window.scrollX, y: window.scrollY };
      onPointerEnter?.(e);
    },
    [onPointerEnter],
  );

  const handlePointerLeave = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      rectRef.current = null;
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      pendingCoordsRef.current = null;
      onPointerLeave?.(e);
    },
    [onPointerLeave],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const clientX = e.clientX;
      const clientY = e.clientY;

      pendingCoordsRef.current = { clientX, clientY };

      // Forward to any consumer-provided handler.
      onPointerMove?.(e);

      if (frameIdRef.current !== null) {
        return;
      }

      frameIdRef.current = requestAnimationFrame(() => {
        frameIdRef.current = null;
        if (!pendingCoordsRef.current) return;

        const { clientX: cX, clientY: cY } = pendingCoordsRef.current;
        pendingCoordsRef.current = null;

        if (!rectRef.current) {
          rectRef.current = element.getBoundingClientRect();
          scrollRef.current = { x: window.scrollX, y: window.scrollY };
        }
        const rect = rectRef.current;
        const scrollDiffX = window.scrollX - scrollRef.current.x;
        const scrollDiffY = window.scrollY - scrollRef.current.y;
        
        const x = ((cX - (rect.left - scrollDiffX)) / rect.width) * 100;
        const y = ((cY - (rect.top - scrollDiffY)) / rect.height) * 100;

        const xStr = `${x}%`;
        const yStr = `${y}%`;

        coordsRef.current = { x: xStr, y: yStr };

        // Update CSS vars inline; the CSS utility reads them for gradient position.
        element.style.setProperty('--spot-x', xStr);
        element.style.setProperty('--spot-y', yStr);
      });
    },
    [onPointerMove],
  );

  const mergedStyle = {
    ...style,
    ...(coordsRef.current.x ? { '--spot-x': coordsRef.current.x } : {}),
    ...(coordsRef.current.y ? { '--spot-y': coordsRef.current.y } : {}),
  } as React.CSSProperties;

  return (
    <Card
      ref={ref}
      variant="spotlight"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={mergedStyle}
      className={className}
      {...props}
    />
  );
}

export { CardSpotlight };
