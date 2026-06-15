'use client';

import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/cn';

/**
 * Translucent glass surface primitive. Use for floating layers only; the global
 * glass utilities provide reduced-transparency and reduced-motion fallbacks.
 */
const glassSurfaceVariants = cva('', {
  variants: {
    variant: {
      panel: 'glass-panel',
      bar: 'glass-bar',
      window: 'glass-window',
      titlebar: 'glass-titlebar',
    },
    radius: {
      none: '',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    variant: 'panel',
    radius: 'xl',
  },
});

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
