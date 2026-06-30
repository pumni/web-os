import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Spinner } from '../feedback/spinner';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow,transform] outline-none focus-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-field shadow-control hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground state-hover state-pressed',
        ghost: 'state-hover state-pressed',
        link: 'text-primary underline-offset-4 hover:underline',
        /** Transparent surface — no padding, no bg, no border. Keeps only the
         *  shared focus ring + disabled state. Use for inline triggers that
         *  need to spread external listeners (e.g. dnd-kit's drag handle)
         *  onto a real, accessible <button>. Pair with `size="icon-*"` to
         *  control the click area. */
        unstyled:
          'h-auto w-auto gap-0 rounded-none bg-transparent p-0 shadow-none motion-safe:active:scale-100 hover:bg-transparent hover:text-inherit focus-visible:ring-1',
      },
      size: {
        default: 'h-control px-4 py-control-y has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-control',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
      pressable: {
        true: 'motion-safe:active:scale-(--press-scale)',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      pressable: true,
    },
  },
);

/**
 * Button Component - Cấu phần Nút tương tác đa năng trong Pumni OS.
 * Hỗ trợ các biến thể (variants), kích thước (sizes), và hiệu ứng nhấn tactile đặc thù.
 *
 * @example
 * ```tsx
 * <Button variant="default" size="default" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
function Button({
  ref,
  className,
  variant = 'default',
  size = 'default',
  pressable = true,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** 
     * Hỗ trợ cơ chế Slot của Radix UI. Khi đặt thành `true`, component sẽ không render thẻ `<button>` 
     * mà chuyển toàn bộ props và ref sang phần tử con đầu tiên của nó.
     */
    asChild?: boolean;
    /** 
     * Trạng thái chờ/tải dữ liệu. Khi được bật, nút sẽ tự động bị vô hiệu hóa (disabled), 
     * ẩn nội dung chữ và hiển thị cấu phần quay Spinner trung tâm.
     */
    loading?: boolean;
    /** 
     * Cho phép hoặc vô hiệu hóa hiệu ứng co giãn tactile khi nhấn nút (:active).
     * Cần đặt thành `false` khi nút đóng vai trò là Trigger (neo) cho các trình đơn nổi 
     * (như DropdownMenu, Popover, Select) để tránh việc vị trí popup bị tính toán sai khi co giãn.
     */
    pressable?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      className={cn('relative', buttonVariants({ variant, size, pressable, className }))}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner size="sm" />
            </span>
          )}
          <span
            // Hide the label from assistive tech while loading (aria-busy covers
            // the state); otherwise the invisible-but-present label is read aloud
            // alongside the spinner announcement.
            aria-hidden={loading || undefined}
            className={cn(
              'inline-flex items-center justify-center gap-2',
              loading && 'opacity-0 pointer-events-none',
            )}
          >
            {children}
          </span>
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
