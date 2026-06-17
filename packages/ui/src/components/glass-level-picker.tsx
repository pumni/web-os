'use client';

import { GLASS_LEVELS, type GlassLevel } from './personalization-provider';
import { Button } from './button';

export function GlassLevelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: GlassLevel) => void;
}) {
  return (
    <div className="inline-flex rounded-md border bg-card p-1">
      {GLASS_LEVELS.map((level) => (
        <Button
          key={level}
          type="button"
          size="sm"
          variant={value === level ? 'secondary' : 'ghost'}
          aria-pressed={value === level}
          onClick={() => onChange(level)}
          className="capitalize"
        >
          {level}
        </Button>
      ))}
    </div>
  );
}
