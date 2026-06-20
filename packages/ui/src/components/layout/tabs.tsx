'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '../../lib/cn';
import { withViewTransition } from '../../lib/view-transition';

function Tabs({
  ref,
  className,
  onValueChange,
  disableTransition = true,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
  disableTransition?: boolean;
}) {
  const handleValueChange = React.useCallback(
    (value: string) => {
      // Wrap the consumer's update in the native View Transitions API when
      // enabled + supported + motion allowed; otherwise a plain call. The
      // helper is the single source of this progressive-enhancement logic.
      if (disableTransition) {
        onValueChange?.(value);
      } else {
        withViewTransition(() => onValueChange?.(value));
      }
    },
    [disableTransition, onValueChange],
  );

  return (
    <TabsPrimitive.Root
      ref={ref}
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...(onValueChange ? { onValueChange: handleValueChange } : {})}
      {...props}
    />
  );
}

function TabsList({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      className={cn(
        'inline-flex h-control w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-ring disabled:pointer-events-none disabled:opacity-50 not-data-[state=active]:state-hover not-data-[state=active]:state-pressed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-control dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
