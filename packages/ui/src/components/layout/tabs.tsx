'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { motion, useReducedMotion } from 'motion/react';

import { cn } from '../../lib/cn';
import { withViewTransition } from '../../lib/view-transition';

/**
 * Tabs — the single primitive for switching PANEL CONTENT.
 *
 * Tabs exist only to drive `<TabsContent>`: each trigger is bound to a panel
 * that swaps in/out. For "choose one of N" with no panel (a value picker),
 * use `SegmentedPicker` instead — the pill segmented control was retired from
 * Tabs because it duplicated the picker's job with a different visual.
 *
 * Visual language is the bottom-underline section nav: a flat transparent
 * track with a sliding `bg-primary` underline that tracks the active
 * trigger. The underline uses motion's shared-`layoutId` animation so it
 * glides between triggers on selection; `useReducedMotion()` neutralises the
 * tween (motion's JS animations are not silenced by the CSS media query — see
 * `Window` for the same gating pattern).
 */

// Stable layoutId + the active value, both scoped per Tabs-Root. A single Root
// owns one shared underline, so all its triggers must share the SAME layoutId —
// but two Tabs instances on one page must NOT collide (a duplicate layoutId
// would cross-animate). The active value lets each trigger decide whether to
// mount the indicator without reaching into the DOM (motion's `layoutId`
// animation requires the indicator to actually mount/unmount as the active
// trigger changes). React context threads both from the Root down to the
// triggers; `useId` keeps the id stable across renders.
type TabsLayoutContextValue = { layoutId: string; activeValue: string | undefined };
const TabsLayoutContext = React.createContext<TabsLayoutContextValue>({
  layoutId: 'tabs-layout',
  activeValue: undefined,
});

/**
 * TabsList — the underline track. Flat and transparent; the bottom border
 * reads as the rail the active sits on. Override`w-fit` (default)
 * with `w-full` + a grid/flex to lay triggers across the container.
 */
const tabsListVariants =
  'inline-flex h-control w-fit items-center justify-center gap-0 border-b border-border bg-transparent p-0 text-muted-foreground';

/**
 * TabsTrigger — a flat section-nav trigger. `relative` + bottom padding host
 * the absolutely-positioned underline indicator (rendered by `TabsTrigger`
 * itself on the active trigger only).
 */
const tabsTriggerVariants =
  "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color] outline-none focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 not-data-[state=active]:state-hover not-data-[state=active]:state-pressed data-[state=active]:text-foreground";

function TabsRoot({
  ref,
  className,
  onValueChange,
  disableTransition = true,
  value,
  defaultValue,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
  disableTransition?: boolean;
}) {
  const layoutId = `tabs-${React.useId()}`;
  const handleValueChange = React.useCallback(
    (next: string) => {
      // Wrap the consumer's update in the native View Transitions API when
      // enabled + supported + motion allowed; otherwise a plain call. The
      // helper is the single source of this progressive-enhancement logic.
      if (disableTransition) {
        onValueChange?.(next);
      } else {
        withViewTransition(() => onValueChange?.(next));
      }
    },
    [disableTransition, onValueChange],
  );

  // Track the active value in React state so triggers know when to mount the
  // indicator. Radix drives selection internally; we mirror it via the
  // onValueChange callback (controlled) or a local state seeded from
  // defaultValue (uncontrolled). Controlled usage without onValueChange is a
  // consumer bug — we still render the value they passed.
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);
  const activeValue = value ?? internalValue;
  const setActive = React.useCallback(
    (next: string) => {
      setInternalValue(next);
      handleValueChange(next);
    },
    [handleValueChange],
  );

  const contextValue = React.useMemo<TabsLayoutContextValue>(
    () => ({ layoutId, activeValue }),
    [layoutId, activeValue],
  );

  return (
    <TabsLayoutContext.Provider value={contextValue}>
      <TabsPrimitive.Root
        ref={ref}
        data-slot="tabs"
        onValueChange={setActive}
        className={cn('flex flex-col gap-2', className)}
        {...(value !== undefined && { value })}
        {...(defaultValue !== undefined && { defaultValue })}
        {...props}
      />
    </TabsLayoutContext.Provider>
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
      className={cn(tabsListVariants, className)}
      {...props}
    />
  );
}

function TabsTrigger({
  ref,
  className,
  value,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { layoutId, activeValue } = React.useContext(TabsLayoutContext);
  const shouldReduce = useReducedMotion();
  const isActive = value === activeValue;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      value={value}
      className={cn(tabsTriggerVariants, className)}
      {...props}
    >
      {isActive && (
        // Sliding underline indicator — mounted ONLY on the active trigger so
        // motion's shared `layoutId` tweens it between triggers as the active
        // value moves (the previous unmounts, the next mounts, motion bridges
        // the position). Under reduced-motion we drop `layoutId` so it simply
        // appears in place. `aria-hidden` + `pointer-events-none` keep it
        // purely decorative — it cannot pollute the tab role or swallow clicks.
        <motion.span
          aria-hidden
          data-slot="tabs-trigger-indicator"
          className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
          {...(!shouldReduce && { layoutId, layout: true })}
        />
      )}
      {children}
    </TabsPrimitive.Trigger>
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

const Tabs = Object.assign(TabsRoot, {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
};
