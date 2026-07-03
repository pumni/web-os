import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { PingDot } from './ping-dot';

/**
 * Badge — the canonical status pill. Replaces the hand-rolled
 * `rounded-full border border-{tone}/20 bg-{tone}/10 text-{tone}` chips that
 * had drifted across the dashboard and watch features.
 *
 * The tone classes use the **status-tint pattern** (a `/20` border + `/10`
 * fill + a semantic text colour) which is explicitly allowed by
 * `docs/conventions/design-system.md` (status indicators are the one place a
 * tinted border survives the "one `border-border`" rule).
 *
 * ### Pulse dot
 * `pulse` renders a leading ping indicator that inherits the badge's text
 * colour via `bg-current`, so it always matches the tone without a per-tone
 * branch. The animation is gated by the global `prefers-reduced-motion` safety
 * net in `glass.css`.
 *
 * Server-safe (no `"use client"`); render it in Server Components freely.
 */
const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-muted text-muted-foreground',
        primary: 'border-primary/20 bg-primary/10 text-primary',
        success: 'border-success/20 bg-success/10 text-success',
        warning: 'border-warning/20 bg-warning/10 text-warning',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
        info: 'border-info/20 bg-info/10 text-info',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'md',
    },
  },
);

function Badge({
  ref,
  className,
  tone,
  size,
  pulse = false,
  children,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    /** Render a leading pulsing dot (tone-coloured) before the children. */
    pulse?: boolean;
  }) {
  return (
    <span
      ref={ref}
      data-slot="badge"
      data-tone={tone ?? 'neutral'}
      className={cn(badgeVariants({ tone, size, className }))}
      {...props}
    >
      {pulse ? <PingDot size="sm" className="size-1.5" /> : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
