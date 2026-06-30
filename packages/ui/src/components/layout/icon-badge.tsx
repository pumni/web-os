import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/**
 * IconBadge — the rounded square icon container that recurred across cards
 * (`inline-flex size-N items-center justify-center rounded-lg bg-primary/10
 * text-primary`). One primitive replaces the hand-rolled copies in the
 * dashboard bento, room cards, and empty states.
 *
 * ### Tones
 * - `primary-soft` (default) — the status-tint icon chip (`bg-primary/10`).
 * - `raised` — an opaque lifted chip using the owned `surface-raised` utility
 *   (the `border bg-card shadow-card` empty-state icon, now token-driven).
 * - `muted` — a neutral recessed chip.
 *
 * The svg inside is sized per `size` via `[&_svg:not([class*='size-'])]`, so a
 * caller can still override by putting an explicit `size-*` on the icon.
 * Decorative by default — pass `aria-hidden` at the call site when the icon
 * carries no standalone meaning (most do not).
 *
 * Server-safe; `asChild` is supported for the rare case the chip is itself the
 * interactive element.
 */
const iconBadgeVariants = cva('inline-flex shrink-0 items-center justify-center', {
  variants: {
    tone: {
      'primary-soft': 'bg-primary/10 text-primary',
      raised: 'border bg-card text-primary surface-raised',
      muted: 'border border-border bg-muted text-muted-foreground',
    },
    size: {
      sm: "size-8 [&_svg:not([class*='size-'])]:size-4",
      md: "size-9 [&_svg:not([class*='size-'])]:size-5",
      lg: "size-12 [&_svg:not([class*='size-'])]:size-6",
      xl: "size-14 [&_svg:not([class*='size-'])]:size-7",
    },
    radius: {
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
    },
  },
  defaultVariants: {
    tone: 'primary-soft',
    size: 'md',
    radius: 'lg',
  },
});

/**
 * IconBadge Component - Khung chứa biểu tượng (icon) dạng hình vuông bo góc trong Pumni OS.
 * Đồng bộ các kiểu dáng icon xuất hiện lặp lại trong các ô bento dashboard, room cards, v.v.
 *
 * @example
 * ```tsx
 * <IconBadge tone="primary-soft" size="md">
 *   <SearchIcon />
 * </IconBadge>
 * ```
 */
function IconBadge({
  ref,
  className,
  tone,
  size,
  radius,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof iconBadgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      ref={ref}
      data-slot="icon-badge"
      data-tone={tone ?? 'primary-soft'}
      className={cn(iconBadgeVariants({ tone, size, radius, className }))}
      {...props}
    />
  );
}

export { IconBadge, iconBadgeVariants };
