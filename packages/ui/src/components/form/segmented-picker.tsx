'use client';

import * as React from 'react';

import { Button } from './button';

/**
 * Generic single-select segmented control — the shared base for the
 * `DensityPicker` and `GlassLevelPicker` (which differ only in their option
 * set). Exposed as a radiogroup so assistive tech announces it as a grouped
 * choice rather than a row of unrelated toggles.
 *
 * Not exported from the package barrel; the typed wrappers are the public API.
 */
function SegmentedPicker<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-md border bg-card p-1"
    >
      {options.map((option) => {
        const active = value === option;
        return (
          <Button
            key={option}
            type="button"
            role="radio"
            size="sm"
            variant={active ? 'secondary' : 'ghost'}
            aria-checked={active}
            onClick={() => onChange(option)}
            className="capitalize"
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}

export { SegmentedPicker };
