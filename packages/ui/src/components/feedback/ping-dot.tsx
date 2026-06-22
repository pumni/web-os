import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

const SIZE_TO_SQUARE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3.5',
};

/**
 * PingDot — the owned "live" / pulsing dot indicator.
 *
 * Replaces the hand-rolled `motion-safe:animate-ping` overlay that was
 * duplicated in `playlist-panel.tsx` (Now-Playing bar and SortableItem
 * current-row indicator). One vocabulary, one reduced-motion gate.
 *
 * ### Accessibility
 * Decorative by default — `aria-hidden="true"`. Pair with an adjacent
 * text label (which already carries the semantic meaning) or with
 * `<Badge tone pulse>` for a labelled status pill. Pass
 * `aria-label="..."` and `aria-hidden={false}` if used standalone.
 *
 * ### Reduced motion
 * The outer ping ring uses `motion-safe:animate-ping`. Users with
 * `prefers-reduced-motion: reduce` see only the static core dot, which
 * still reads as "this thing is on" without the strobe animation. The
 * component also exposes a `pulse={false}` switch for callers that want
 * a static ring-less dot regardless of motion preference.
 *
 * ### Tone
 * The ring + core use `bg-current`, so a single component adapts to
 * any tone applied by the parent (`text-primary`, `text-success`,
 * etc.) — no per-tone branch here.
 */
const pingDotVariants = cva('relative flex shrink-0', {
  variants: {
    size: {
      /** 8px — compact row indicators (material lists, status dots). */
      sm: SIZE_TO_SQUARE.sm,
      /** 10px — primary "now playing" indicator in watch/playlist UI. */
      md: SIZE_TO_SQUARE.md,
      /** 14px — larger status indicators, scenario headers. */
      lg: SIZE_TO_SQUARE.lg,
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

function PingDot({
  className,
  size = 'md',
  pulse = true,
  'aria-hidden': ariaHidden = true,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof pingDotVariants> & {
    /** Render the animated outer ring. Disable for the reduced-motion
     *  contract or for a static "live" dot. */
    pulse?: boolean;
  }) {
  const square = SIZE_TO_SQUARE[size ?? 'md'];

  return (
    <span
      data-slot="ping-dot"
      data-size={size}
      aria-hidden={ariaHidden}
      className={cn(pingDotVariants({ size }), className)}
      {...props}
    >
      {pulse ? (
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
      ) : null}
      <span className={cn('relative inline-flex rounded-full bg-current', square)} />
</span>
  );
}

export { PingDot, pingDotVariants };
