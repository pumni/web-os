'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'motion/react';

import { cn } from '../../lib/cn';
import { transition } from '../../lib/motion';

/**
 * SegmentedPicker — the single primitive for "choose one of N" with NO panel
 * content. Replaces every former misuse of `Tabs` as a value picker.
 *
 * Built on Radix RadioGroup so arrow-key navigation + roving tabindex are
 * correct WAI-ARIA out of the box (the previous self-rolled `role="radio"`
 * row had no keyboard model). Visual language is the modern segmented control:
 * a recessed `--segmented-track` well with a sliding `--segmented-active` pill
 * that lifts onto the active option — the affordance is "the selected value
 * rises out of the well". The dedicated track/active tokens (tokens.css)
 * guarantee that delta in BOTH themes: in light, `--muted` sat too close to
 * `--background` (neutral-100 vs neutral-50) so the pill vanished; in dark,
 * `--muted` was LIGHTER than the host card, inverting the well. The
 * `--segmented-*` stops fix both.
 *
 * The sliding pill uses `motion`'s shared-`layoutId` animation: the pill
 * element lives inside whichever item is `checked`, and motion tweens its
 * position/size between mounts. `useReducedMotion()` neutralises the tween
 * (motion's JS animations are not silenced by the CSS media query — see
 * `Window` for the same gating pattern).
 *
 * Backward-compatible API: `options` / `value` / `onChange` / `labels` /
 * `aria-label` are unchanged. New: `size`, `fullWidth`, and per-option `icon`
 * (pass `options` as `{ value, label?, icon? }[]` to use icons).
 */
export type SegmentedPickerOption<T extends string =
  string> = T | { value: T; label?: string; icon?: React.ComponentType<{ className?: string }> };

function normalizeOptions<T extends string>(
  options: readonly SegmentedPickerOption<T>[],
  labels?: Partial<Record<T, string>>,
): Array<{ value: T; label: string; Icon?: React.ComponentType<{ className?: string }> }> {
  return options.map((option) => {
    if (typeof option === 'string') {
      const label = labels?.[option] ?? option;
      return { value: option, label };
    }
    const label = option.label ?? labels?.[option.value] ?? option.value;
    const result: { value: T; label: string; Icon?: React.ComponentType<{ className?: string }> } = {
      value: option.value,
      label,
    };
    if (option.icon) result.Icon = option.icon;
    return result;
  });
}

const segmentedItemVariants = cva(
  cn(
    'relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-md',
    'font-medium whitespace-nowrap transition-colors duration-(--duration-base) ease-(--ease-snappy)',
    'outline-none focus-ring',
    // Inactive affordance: muted text + state overlay on hover/press. The
    // `not-data-[state=checked]` guard keeps the overlay off the active item
    // (mirrors the Tabs inactive-trigger pattern).
    'not-data-[state=checked]:text-muted-foreground',
    'not-data-[state=checked]:state-hover not-data-[state=checked]:state-pressed',
    'data-[state=checked]:text-foreground',
    'disabled:cursor-not-allowed disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ),
  {
    variants: {
      size: {
        // h-8 mirrors the Button `sm` size used by the previous implementation.
        sm: "h-8 px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        // h-control = the comfortable control height token; matches Button default.
        default: "h-control px-4 text-sm [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

function SegmentedPicker<T extends string>({
  options,
  value,
  onChange,
  labels,
  size,
  fullWidth,
  orientation = 'horizontal',
  disabled,
  'aria-label': ariaLabel,
  className,
}: {
  options: readonly SegmentedPickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
  size?: VariantProps<typeof segmentedItemVariants>['size'];
  /** Stretch the track to fill its container (each option gets equal width). */
  fullWidth?: boolean;
  /** Layout orientation. Defaults to 'horizontal'. */
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  'aria-label': string;
  className?: string;
}) {
  // Stable id scopes the shared-layout pill so multiple pickers on one page
  // each animate their own pill (a duplicate `layoutId` would cross-animate).
  const reactId = React.useId();
  const layoutId = `segmented-${reactId}`;

  const items = normalizeOptions(options, labels);
  // Inline style drives the grid column count so a `fullWidth` track lays its
  // options out evenly regardless of label length (avoids `grid-cols-N` utility
  // generation for arbitrary N).
  const trackStyle = fullWidth && orientation === 'horizontal' ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` } : undefined;

  return (
    <RadioGroupPrimitive.Root
      data-slot="segmented-picker"
      aria-label={ariaLabel}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      disabled={disabled}
      orientation={orientation}
      className={cn(
        // The recessed well: --segmented-track is a dedicated stop guaranteed
        // DARKER than the host surface in both themes (neutral-200 light /
        // neutral-900 dark), so the well reads as recessed — `--muted` alone
        // collapsed against `--background` in light and inverted in dark. No
        // outer border: the track/surface luminance gap separates it.
        'inline-grid gap-1 rounded-lg bg-(--segmented-track) p-0.75',
        orientation === 'horizontal' ? 'grid-flow-col auto-cols-max' : 'grid-flow-row auto-rows-max',
        fullWidth && orientation === 'horizontal' && 'grid w-full',
        className,
      )}
      style={trackStyle}
    >
      {items.map(({ value: optionValue, label, Icon }) => {
        const checked = optionValue === value;
        return (
          <RadioGroupPrimitive.Item
            key={optionValue}
            value={optionValue}
            data-slot="segmented-picker-item"
            className={cn(
              segmentedItemVariants({ size }),
              // Full-width items fill their grid cell; otherwise size to content.
              fullWidth && 'w-full px-2',
            )}
          >
            {/* Sliding active pill — lives inside the checked item only. The
                shared `layoutId` makes motion tween the pill between items on
                value change (mount on the new item, unmount on the old); under
                reduced-motion we drop `layout` so it just appears in place
                without a tween. `aria-hidden` + `pointer-events-none` keep it
                purely decorative so it cannot pollute the radiogroup's role
                contract or swallow pointer events meant for the radio. */}
            {checked && (
              <motion.span
                aria-hidden
                data-slot="segmented-picker-indicator"
                className="pointer-events-none absolute inset-0 -z-10 rounded-md bg-(--segmented-active) border border-segmented-active-border shadow-segmented-active"
                layoutId={layoutId}
                layout
                transition={transition.snappy}
              />
            )}
            {Icon && <Icon className="shrink-0" />}
            {label}
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}

export { SegmentedPicker, segmentedItemVariants };
