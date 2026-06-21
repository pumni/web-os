import * as React from 'react';

import { cn } from '@/shared/lib/utils';


/**
 * Local `<Kbd>` for in-app keyboard hints.
 *
 * Tracked for promotion to `@pumni/ui` once a second consumer appears (today
 * it is shared by `dashboard/page.tsx` and `app-shell/os-command.tsx` so the
 * bar is already met — track this as the follow-up that promotes it).
 */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground select-none',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
