import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/**
 * Translucent glass surface primitive. Use for floating layers only; the global
 * glass utilities provide reduced-transparency and reduced-motion fallbacks.
 */
const glassSurfaceVariants = cva('', {
  variants: {
    variant: {
      panel: 'glass-panel',
      bar: 'glass-bar',
      'bar-bordered': 'glass-bar-bordered',
      'bar-edge-r': 'glass-bar-edge-r',
      'bar-edge-b': 'glass-bar-edge-b',
      window: 'glass-window',
      titlebar: 'glass-titlebar',
    },
    radius: {
      none: '',
      xs: 'rounded-xs',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    variant: 'panel',
    radius: 'xl',
  },
});

/**
 * GlassSurface Component - Bề mặt kính mờ (Glassmorphic surface) trong Pumni OS.
 * Chỉ áp dụng cho các lớp giao diện nổi (floating layers - dialogs, popovers, docks, windows) 
 * ngồi trên nền có màu sắc rực rỡ để tối ưu hiệu quả hiển thị và chi phí phần cứng.
 * Tự động kích hoạt cơ chế giảm độ trong suốt (fallbacks) khi người dùng bật chế độ giảm hiệu ứng.
 *
 * @example
 * ```tsx
 * <GlassSurface variant="panel" radius="xl">
 *   <div>Floating Panel Content</div>
 * </GlassSurface>
 * ```
 */
function GlassSurface({
  className,
  variant,
  radius,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof glassSurfaceVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="glass-surface"
      data-variant={variant}
      className={cn(glassSurfaceVariants({ variant, radius }), className)}
      {...props}
    />
  );
}

export { GlassSurface, glassSurfaceVariants };
