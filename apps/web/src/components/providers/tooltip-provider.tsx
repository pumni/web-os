'use client';

import { TooltipProvider } from '@pumni/ui';

/**
 * Single root provider for every `<Tooltip>` in the app. Radix requires exactly
 * one TooltipProvider in the component tree; without it, `<Tooltip>` throws.
 * Placing it here (inside the root layout) means no individual component needs
 * to wrap its own provider — just render bare `<Tooltip>` / `<TooltipTrigger>`
 * / `<TooltipContent>` anywhere.
 */
export function RootTooltipProvider({ children }: { readonly children: React.ReactNode }) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>;
}
