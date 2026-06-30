'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { Circle } from 'lucide-react';

import { cn } from '../../lib/cn';

/**
 * RadioGroup Component - Nhóm các nút chọn một trong nhiều trong Pumni OS.
 * Được xây dựng trên nền tảng Radix UI RadioGroup.
 *
 * @example
 * ```tsx
 * <RadioGroup defaultValue="option-1" onValueChange={handleValueChange}>
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="option-1" id="r1" />
 *     <Label htmlFor="r1">Option 1</Label>
 *   </div>
 * </RadioGroup>
 * ```
 */
function RadioGroup({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-slot="radio-group"
      className={cn('grid gap-2', className)}
      {...props}
    />
  );
}

/**
 * RadioGroupItem Component - Nút chọn đơn lẻ hình tròn trong RadioGroup.
 * Khi được kích hoạt, dấu chấm đồng tâm sẽ hiển thị với hiệu ứng chuyển động lò xo.
 */
function RadioGroupItem({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-slot="radio-group-item"
      className={cn(
        'peer size-4 shrink-0 rounded-full border border-input bg-field shadow-control transition-[color,box-shadow,background-color] outline-none focus-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center text-primary transition-transform duration-(--duration-base) ease-(--ease-spring) motion-safe:scale-100 motion-safe:opacity-100 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in"
      >
        <Circle className="size-2 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
