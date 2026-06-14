"use client";

import * as React from "react";
import { Card } from "./card";
import type { VariantProps } from "class-variance-authority";
import type { cardVariants } from "./card";
import { cn } from "../lib/cn";

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
type CardSpotlightProps = Omit<React.ComponentProps<"div">, "style"> &
  Omit<VariantProps<typeof cardVariants>, "variant"> & {
    asChild?: boolean;
    style?: React.CSSProperties;
  };

function CardSpotlight({
  className,
  onPointerMove,
  style,
  ...props
}: CardSpotlightProps) {
  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      // Update CSS vars inline; the CSS utility reads them for gradient position.
      e.currentTarget.style.setProperty("--spot-x", `${x}%`);
      e.currentTarget.style.setProperty("--spot-y", `${y}%`);
      // Forward to any consumer-provided handler.
      onPointerMove?.(e);
    },
    [onPointerMove],
  );

  return (
    <Card
      variant="spotlight"
      onPointerMove={handlePointerMove}
      style={style}
      className={cn(className)}
      {...props}
    />
  );
}

export { CardSpotlight };
