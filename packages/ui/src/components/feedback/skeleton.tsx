import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/**
 * Skeleton loader — purely visual placeholder for content that has not yet
 * loaded. It is intentionally hidden from assistive technology (`aria-hidden`,
 * `role="presentation"`) because it carries no meaningful information.
 *
 * ### Variants
 * - `pulse` (default) — gentle opacity breathing, `prefers-reduced-motion`-safe
 *   via the global CSS safety net in `glass.css`.
 * - `shimmer` — sheen sweep using the `@utility animate-shimmer` defined in
 *   `glass.css`, also gated behind `prefers-reduced-motion`.
 *
 * ### Accessibility
 * The skeleton is `aria-hidden="true"` by default. In the rare case where you
 * need a live-region announcement (e.g. "Content is loading"), add an
 * `aria-live="polite"` sibling element **outside** the skeleton instead —
 * the skeleton element itself should never be announced.
 */
const skeletonVariants = cva('rounded-md bg-muted', {
  variants: {
    variant: {
      /** Opacity breathing pulse — default, lowest GPU cost. */
      pulse: 'animate-pulse',
      /**
       * Shimmer sweep — defined in `@utility animate-shimmer` (glass.css).
       * Uses `::after` pseudo-element; requires `overflow-hidden` (already
       * applied by the utility itself).
       */
      shimmer: 'animate-shimmer',
    },
  },
  defaultVariants: {
    variant: 'pulse',
  },
});

function Skeleton({
  className,
  variant = 'pulse',
  role = 'presentation',
  'aria-hidden': ariaHidden = true,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof skeletonVariants> & {
    /**
     * Defaults to `true` — skeleton is a visual placeholder and should not be
     * announced by screen readers. Override only when you have a specific
     * accessibility reason to expose the element.
     */
    'aria-hidden'?: boolean;
  }) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      role={role}
      aria-hidden={ariaHidden}
      className={cn(skeletonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Skeleton, skeletonVariants };
