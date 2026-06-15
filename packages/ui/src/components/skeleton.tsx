import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/cn';

const skeletonVariants = cva('rounded-md bg-muted', {
  variants: {
    variant: {
      pulse: 'animate-pulse',
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
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      className={cn(skeletonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Skeleton, skeletonVariants };
