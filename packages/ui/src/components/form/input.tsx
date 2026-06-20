import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

const inputVariants = cva(
  'h-control w-full min-w-0 rounded-md border px-3 py-control-y text-base shadow-control transition-[color,box-shadow,background-color] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      variant: {
        outline: 'border-input bg-field',
        filled: 'border-transparent bg-muted focus-visible:bg-field focus-visible:border-input',
      },
    },
    defaultVariants: {
      variant: 'outline',
    },
  },
);

function Input({
  ref,
  className,
  type,
  variant = 'outline',
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
