'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';

import { cn } from '../../lib/cn';
import { OVERLAY_ANIMATION, OVERLAY_SLIDE_SIDES } from './_overlay-variants';

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

// NOTE: does NOT wrap in `TooltipProvider`. Radix requires exactly one provider
// in scope; auto-wrapping each `<Tooltip>` spawns a provider per instance, which
// defeats the shared `delayDuration` / skip-delay behaviour and wastes context
// work. Wrap the app (or a region) once in `<TooltipProvider>` — see the root
// layout — and use bare `<Tooltip>` children here.
function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 4,
  style,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        style={{ zIndex: 'var(--z-tooltip)', ...style }}
        className={cn(
          'w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background',
          OVERLAY_SLIDE_SIDES,
          OVERLAY_ANIMATION,
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-10 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-xs bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
