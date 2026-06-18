'use client';

import { DENSITIES, type Density } from './personalization-provider';
import { Button } from './button';

export function DensityPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: Density) => void;
}) {
  return (
    <div className="inline-flex rounded-md border bg-card p-1">
      {DENSITIES.map((d) => (
        <Button
          key={d}
          type="button"
          size="sm"
          variant={value === d ? 'secondary' : 'ghost'}
          aria-pressed={value === d}
          onClick={() => onChange(d)}
          className="capitalize"
        >
          {d}
        </Button>
      ))}
    </div>
  );
}
