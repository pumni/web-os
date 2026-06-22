import type { ReactNode } from 'react';

import { cn } from '@pumni/ui/lib/cn';

type KbdChipProps = {
  children: ReactNode;
  className?: string;
};

export function KbdChip({ children, className }: KbdChipProps) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5',
        'font-mono text-xs font-semibold text-foreground shadow-sm select-none',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
