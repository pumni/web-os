'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';

import { cn } from '../lib/cn';

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-(--switch-height) w-(--switch-width) shrink-0 items-center rounded-full border border-transparent shadow-control transition-[background-color,box-shadow] outline-none focus-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-(--switch-thumb-size) rounded-full bg-background ring-0 transition-transform duration-(--duration-base) ease-(--ease-spring) data-[state=checked]:translate-x-[calc(var(--switch-width)-var(--switch-thumb-size)-2px)] data-[state=unchecked]:translate-x-0 dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
