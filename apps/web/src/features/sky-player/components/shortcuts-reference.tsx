'use client';

import type { ReactNode } from 'react';

import { Card, CardContent, motion, recipes, useReducedMotion } from '@pumni/ui';

import { KEYBOARD_SHORTCUTS } from '../content';

function KbdChip({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-semibold text-foreground select-none">
      {children}
    </kbd>
  );
}

export function ShortcutsReference() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      {...(shouldReduce ? {} : recipes.staggerContainer)}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {KEYBOARD_SHORTCUTS.map((shortcut) => (
        <motion.div key={shortcut.label} {...(shouldReduce ? {} : recipes.staggerItem)}>
          <Card variant="inset" className="h-full">
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i} className="inline-flex items-center gap-1">
                    {i > 0 ? (
                      <span className="text-[10px] text-muted-foreground">+</span>
                    ) : null}
                    <KbdChip>{key}</KbdChip>
                  </span>
                ))}
              </div>
              <p className="text-sm font-semibold text-foreground">{shortcut.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{shortcut.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
