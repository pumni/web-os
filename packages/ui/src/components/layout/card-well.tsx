import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/**
 * CardWell — the canonical recessed nested surface (an "inset well"). This is
 * the small-scale counterpart to `<Card variant="inset">`: the same opaque
 * `border-border` + `bg-muted` treatment, but a lightweight container without
 * Card's block padding/gap so it can host a media row, a stat, or a sub-panel
 * inside another surface.
 *
 * It exists because the inset well had been re-invented ~10 times across the
 * app as `rounded-{md,lg,xl} border bg-muted p-{3,4,6}` with inconsistent
 * radius and padding. Use this instead of hand-rolling the classes.
 *
 * Layout-agnostic: it sets the surface + radius + padding only; the consumer
 * supplies the inner flex/grid/spacing. Server-safe; `asChild` is supported so
 * the well can adopt a semantic element (`<ul>`, `<form>`, …).
 *
 * Radius participates in concentric rounding via `--parent-radius`, matching
 * the Card convention, so a nested `rounded-nested` child stays visually
 * concentric.
 */
const cardWellVariants = cva('border border-border bg-muted', {
  variants: {
    radius: {
      md: 'rounded-md [--parent-radius:var(--radius-md)]',
      lg: 'rounded-lg [--parent-radius:var(--radius-lg)]',
      xl: 'rounded-xl [--parent-radius:var(--radius-xl)]',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    radius: 'lg',
    padding: 'md',
  },
});

/**
 * CardWell Component - Khung chứa chìm nằm lõm bên trong một bề mặt khác (inset well).
 * Thường được sử dụng để làm nổi bật danh sách, vùng dữ liệu con hoặc nhóm nội dung phụ.
 * Giúp tránh việc lặp lại mã nguồn CSS thô của các ô phụ trong ứng dụng.
 */
function CardWell({
  ref,
  className,
  radius,
  padding,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof cardWellVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      ref={ref}
      data-slot="card-well"
      className={cn(cardWellVariants({ radius, padding, className }))}
      {...props}
    />
  );
}

export { CardWell, cardWellVariants };
