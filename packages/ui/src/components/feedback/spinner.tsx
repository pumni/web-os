import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '../../lib/cn';

/**
 * Spinner — the owned loading indicator primitive.
 *
 * Replaces the hand-rolled `border-2 border-primary border-t-transparent
 * motion-safe:animate-spin` ring (a `border-2` violation of the
 * border-consumption contract, ADR-0019) and the inline `Loader2` icons that
 * were duplicated across `Button` and `Sonner`. One vocabulary, one a11y
 * contract, one reduced-motion gate.
 *
 * ### Accessibility
 * The spinner is decorative by default (`aria-hidden="true"`,
 * `role="presentation"`) because it is almost always paired with a visible
 * text label ("Loading…", "Đang đồng bộ…"). When it stands alone and must
 * announce itself, pass `aria-label` — the role stays `status` so screen
 * readers can pick it up as a live region.
 *
 * ### Reduced motion
 * `animate-spin` is gated behind `motion-safe:` so users with
 * `prefers-reduced-motion: reduce` see a static icon instead of a spinning
 * one (the global CSS safety net in `glass.css` would also flatten it, but
 * the utility keeps intent explicit at the call site).
 */
const spinnerVariants = cva(
  'motion-safe:animate-spin shrink-0 [&_svg]:size-full',
  {
    variants: {
      size: {
        /** 16px — inline inside buttons, toasts, and dense rows. */
        sm: 'size-4',
        /** 24px — the default, balanced for most content areas. */
        md: 'size-6',
        /** 40px — the original watch-room loading ring size. */
        lg: 'size-10',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

function Spinner({
  className,
  size = 'md',
  role = 'status',
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof spinnerVariants> & {
    /**
     * Defaults to `status`. The spinner is a live-region candidate; keep it as
     * `status` (or `presentation`) — do not promote to `alert`.
     */
    role?: React.AriaRole;
    /**
     * Defaults to `true` — the spinner is decorative when paired with a text
     * label. Pass an `aria-label` (and leave this unset) when the spinner is
     * the sole indicator of a loading state.
     */
    'aria-hidden'?: boolean | 'true' | 'false';
  }) {
  return (
    <span
      data-slot="spinner"
      data-size={size}
      role={role}
      aria-hidden={ariaLabel ? undefined : ariaHidden}
      aria-label={ariaLabel}
      className={cn(spinnerVariants({ size }), 'text-muted-foreground', className)}
      {...props}
    >
      <Loader2 />
    </span>
  );
}

export { Spinner, spinnerVariants };
