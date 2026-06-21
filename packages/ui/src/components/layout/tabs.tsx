'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { withViewTransition } from '../../lib/view-transition';

/**
 * TabsList styling — two visual variants:
 *
 * - `pill` (default): the original segmented-control style. Rounded track with
 *   `bg-muted`, active trigger fills with `bg-background` + `shadow-control`.
 * - `underline`: a bottom-border underline style. Flat transparent track with
 *   a `border-b-2` active indicator. Use for side-docks, section navs, and any
 *   context where a pill fill would look heavy.
 */
const tabsListVariants = cva(
  'inline-flex h-control w-fit items-center justify-center text-muted-foreground',
  {
    variants: {
      variant: {
        /** Segmented-control pill (default — the original style). */
        pill: 'rounded-lg bg-muted p-0.75',
        /** Bottom-border underline indicator. Pair with `TabsTrigger variant="underline"`. */
        underline: 'gap-0 border-b border-border bg-transparent p-0',
      },
    },
    defaultVariants: {
      variant: 'pill',
    },
  },
);

/**
 * TabsTrigger styling — mirrors `TabsList` variants:
 *
 * - `pill` (default): rounded trigger with filled active state.
 * - `underline`: flat trigger with `border-b-2` active indicator. The default
 *   pill fill/shadow/rounded classes are suppressed; a `border-primary` bottom
 *   border appears on `data-[state=active]`.
 */
const tabsTriggerVariants = cva(
  "inline-flex h-full flex-1 items-center justify-center gap-1.5 border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Segmented-control pill (default — the original style). */
        pill: "rounded-md not-data-[state=active]:state-hover not-data-[state=active]:state-pressed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-control dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground",
        /** Bottom-border underline indicator. Pair with `TabsList variant="underline"`. */
        underline: "border-b-2 rounded-none bg-transparent shadow-none not-data-[state=active]:state-hover not-data-[state=active]:state-pressed data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-foreground",
      },
    },
    defaultVariants: {
      variant: 'pill',
    },
  },
);

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
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  ref,
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      data-variant={variant}
      className={cn(tabsTriggerVariants({ variant }), className)}
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

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
};
