'use client';

import { Switch as SwitchPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../../lib/cn';

/**
 * Switch Component - Cần gạt chuyển đổi trạng thái Bật/Tắt trong Pumni OS.
 * Được xây dựng trên nền tảng Radix UI Switch.
 * Sử dụng các token biến chuyển màu và dịch chuyển vòng tròn thumb có gia tốc lò xo (ease-spring).
 *
 * @example
 * ```tsx
 * <Switch checked={isActive} onCheckedChange={setIsActive} />
 * ```
 */
function Switch({ ref, className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      className={cn(
        'peer inline-flex h-(--switch-height) w-(--switch-width) shrink-0 cursor-pointer items-center rounded-full p-0.5',
        'bg-(--switch-track) data-[state=checked]:bg-(--switch-track-checked)',
        'transition-colors duration-(--duration-base) ease-snappy focus-ring outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-(--switch-thumb-size) rounded-full bg-(--switch-thumb) shadow-sm ring-0',
          'transition-transform duration-(--duration-base) ease-(--ease-spring)',
          'data-[state=unchecked]:translate-x-0',
          'data-[state=checked]:translate-x-(--switch-thumb-size)',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

