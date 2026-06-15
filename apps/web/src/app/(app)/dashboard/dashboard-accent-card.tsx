'use client';

import * as React from 'react';
import { Check, Palette } from 'lucide-react';
import { usePersonalization, type Accent } from '@pumni/ui';

const ACCENT_OPTIONS: { name: Accent; label: string }[] = [
  { name: 'cyan', label: 'Cyan' },
  { name: 'indigo', label: 'Indigo' },
  { name: 'violet', label: 'Violet' },
  { name: 'rose', label: 'Rose' },
];

export function DashboardAccentCard() {
  const { accent, setAccent } = usePersonalization();

  return (
    <div className="flex h-full flex-col justify-between min-h-30 select-none">
      <div className="flex items-center justify-between text-muted-foreground">
        <Palette className="h-4 w-4 text-primary" />
        <span className="text-xs uppercase tracking-wider font-semibold">Accent Theme</span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          {ACCENT_OPTIONS.map((opt) => (
            <div key={opt.name} data-accent={opt.name}>
              <button
                onClick={() => setAccent(opt.name)}
                className="relative flex size-8 items-center justify-center rounded-full bg-primary transition-all duration-(--duration-fast) hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                aria-label={`Set accent color to ${opt.label}`}
              >
                {accent === opt.name && (
                  <Check className="h-4 w-4 text-primary-foreground stroke-[3px]" />
                )}
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-medium text-muted-foreground capitalize">
          Current: {accent}
        </p>
      </div>
    </div>
  );
}
