import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const markerVariants = cva(
  'flex w-full items-center gap-2 text-xs font-normal text-muted-foreground select-none',
  {
    variants: {
      variant: {
        default: 'inline-flex items-center',
        border: 'border-b border-border pb-2',
        separator: 'relative justify-center before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-px before:w-[calc(50%-1.5rem)] before:bg-border after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-px after:w-[calc(50%-1.5rem)] after:bg-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface MarkerProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof markerVariants> {
  asChild?: boolean;
}

function Marker({ className, variant, asChild, ...props }: MarkerProps) {
  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      data-slot="marker"
      className={cn(markerVariants({ variant }), className)}
      {...props}
    />
  );
}

function MarkerIcon({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn('size-3.5 shrink-0 text-muted-foreground', className)}
      {...props}
    />
  );
}

function MarkerContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="marker-content"
      className={cn('min-w-0 flex-1 truncate text-left', className)}
      {...props}
    />
  );
}

export { Marker, MarkerIcon, MarkerContent };
