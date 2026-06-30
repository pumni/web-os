import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-base shadow-control transition-[color,box-shadow,background-color] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 resize-y',
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

type TextareaProps = React.ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>;

/**
 * Textarea Component - Ô nhập liệu nhiều dòng trong Pumni OS.
 * Kế thừa toàn bộ hệ thống màu, viền và focus ring đồng bộ với Input.
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Nhập tin nhắn của bạn..." rows={4} />
 * ```
 */
function Textarea({
  ref,
  className,
  variant = 'outline',
  ...props
}: TextareaProps) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      data-variant={variant}
      className={cn(textareaVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };
