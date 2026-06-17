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

/**
 * Accent personalizer tile body.
 *
 * Reads `accent` from the personalization provider so the selected swatch
 * stays in sync with the one set on `/settings/appearance`. Layout height is
 * owned by the parent `BentoGridItem` via `minHeight`.
 */
export function DashboardAccentCard() {
  const { accent, setAccent } = usePersonalization();

  return (
    <div className="flex h-full flex-col justify-between select-none">
      <div className="flex items-center justify-between text-muted-foreground">
        <Palette className="size-4 text-primary" />
        <span className="type-caption font-semibold uppercase tracking-wider">
          Accent theme
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.name}
              type="button"
              onClick={() => setAccent(opt.name)}
              aria-pressed={accent === opt.name}
              aria-label={`Set accent color to ${opt.label}`}
              className="relative inline-flex size-8 items-center justify-center rounded-full bg-primary transition-transform duration-(--duration-fast) motion-safe:hover:scale-110 motion-safe:active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {accent === opt.name && (
                <Check className="size-4 stroke-[3px] text-primary-foreground" />
              )}
           </button>
          ))}
       </div>
        <p className="type-caption font-medium capitalize text-muted-foreground">
          Current: {accent}
        </p>
      </div>
    </div>
  );
}
