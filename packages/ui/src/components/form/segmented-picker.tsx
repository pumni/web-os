'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

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
    'relative z-10 inline-flex flex-1 items-center justify-center rounded-md',
    'whitespace-nowrap outline-none focus-ring',
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
  const trackRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateIndicator = () => {
      const activeItem = track.querySelector('[data-state="checked"]') as HTMLElement;
      if (!activeItem) return;

      if (orientation === 'vertical') {
        const { offsetTop, offsetHeight } = activeItem;
        track.style.setProperty('--indicator-offset', `${offsetTop}px`);
        track.style.setProperty('--indicator-height', `${offsetHeight}px`);
      } else {
        const { offsetLeft, offsetWidth } = activeItem;
        track.style.setProperty('--indicator-offset', `${offsetLeft}px`);
        track.style.setProperty('--indicator-width', `${offsetWidth}px`);
      }
    };

    updateIndicator();

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(track);

    return () => {
      resizeObserver.disconnect();
    };
  }, [value, orientation]);

  const items = normalizeOptions(options, labels);
  // Inline style drives the grid column count so a `fullWidth` track lays its
  // options out evenly regardless of label length (avoids `grid-cols-N` utility
  // generation for arbitrary N).
  const trackStyle = fullWidth && orientation === 'horizontal' ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` } : undefined;

  return (
    <RadioGroupPrimitive.Root
      ref={trackRef}
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
        'relative inline-grid gap-1 rounded-lg bg-(--segmented-track) p-0.75',
        orientation === 'horizontal' ? 'grid-flow-col auto-cols-max' : 'grid-flow-row auto-rows-max',
        fullWidth && orientation === 'horizontal' && 'grid w-full',
        className,
      )}
      style={trackStyle}
    >
      {/* Active pill indicator — slides using CSS Custom Properties.
          aria-hidden + pointer-events-none keep it purely decorative. */}
      <span
        aria-hidden
        data-slot="segmented-picker-indicator"
        className={cn(
          "pointer-events-none absolute z-0 rounded-md bg-(--segmented-active) border border-segmented-active-border shadow-segmented-active transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          orientation === 'vertical'
            ? "left-0.75 right-0.75 top-0"
            : "top-0.75 bottom-0.75 left-0"
        )}
        style={
          orientation === 'vertical'
            ? {
                height: 'var(--indicator-height, 0px)',
                transform: 'translateY(var(--indicator-offset, 0px))',
              }
            : {
                width: 'var(--indicator-width, 0px)',
                transform: 'translateX(var(--indicator-offset, 0px))',
              }
        }
      />
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
            <span
              className={cn(
                'inline-flex items-center justify-center gap-1.5 transition-colors duration-200',
                checked ? 'text-foreground font-medium' : 'text-muted-foreground font-normal'
              )}
            >
              {Icon && <Icon className="shrink-0" />}
              {label}
            </span>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}

export { SegmentedPicker, segmentedItemVariants };
