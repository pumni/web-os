import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Card } from './card';
import { Skeleton } from './skeleton';

/**
 * BentoGrid — 12-column mathematical layout with tier-based tile sizing.
 *
 * Responsive breakpoints:
 * - Mobile (<640px): 1 column, all tiles full-width
 * - Tablet (≥640px): 6 columns
 * - Desktop (≥1024px): 12 columns
 *
 * Tiles use the `tier` prop instead of raw `colSpan`/`rowSpan` strings.
 * Override layout via `className` when needed.
 *
 * @example
 * ```tsx
 * <BentoGrid>
 *   <BentoGridItem tier="hero" title="KPI" description="Main metric" />
 *   <BentoGridItem tier="feature" title="Chart" />
 *   <BentoGridItem tier="metric" ariaLabel="142k active users" title="142k" />
 * </BentoGrid>
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Semantic tier that drives the 12-col span mapping. Override via `className`. */
export type BentoTier = 'hero' | 'feature' | 'metric' | 'accent' | 'full';

// ---------------------------------------------------------------------------
// BentoGrid (container)
// ---------------------------------------------------------------------------

interface BentoGridProps extends React.ComponentProps<'div'> {
  children: React.ReactNode;
  /**
   * Number of columns on desktop. Defaults to 12.
   * Use 6 for a simpler 2-col layout on large screens.
   */
  columns?: 6 | 12;
}

export function BentoGrid({ className, children, columns = 12, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        // Mobile: 1 col → Tablet: 6 col → Desktop: configurable (6 or 12)
        'grid grid-cols-1 gap-4 sm:grid-cols-6 lg:gap-6',
        columns === 12 ? 'lg:grid-cols-12' : 'lg:grid-cols-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BentoGridItem (tile) — tier-based spanning
// ---------------------------------------------------------------------------

/**
 * Tier → span mapping (12-col desktop, 6-col tablet, 1-col mobile):
 *
 * | tier    | Desktop (12-col)            | Tablet (6-col) | Mobile |
 * | ------- | --------------------------- | -------------- | ------ |
 * | hero    | col-span-6 row-span-2       | col-span-6     | 1 col  |
 * | feature | col-span-4 row-span-2       | col-span-6     | 1 col  |
 * | metric  | col-span-3                  | col-span-3     | 1 col  |
 * | accent  | col-span-2                  | col-span-2     | 1 col  |
 * | full    | col-span-12                 | col-span-6     | 1 col  |
 */
const bentoTierVariants = cva('', {
  variants: {
    tier: {
      hero: 'lg:col-span-6 lg:row-span-2 sm:col-span-6',
      feature: 'lg:col-span-4 lg:row-span-2 sm:col-span-6',
      metric: 'lg:col-span-3 sm:col-span-3',
      accent: 'lg:col-span-2 sm:col-span-2',
      full: 'lg:col-span-12 sm:col-span-6',
    },
  },
  defaultVariants: {
    tier: 'metric',
  },
});

interface BentoGridItemProps extends Omit<React.ComponentProps<typeof Card>, 'title'> {
  children?: React.ReactNode;
  /**
   * Optional media/visual header well — rendered as an inset muted surface
   * above the tile content.
   */
  header?: React.ReactNode;
  /** Optional icon — rendered in a `primary/10` chip per the status-tint pattern. */
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /**
   * Semantic tile tier. Drives the column/row span on the 12-col desktop grid.
   * Override layout with `className` for one-off adjustments.
   */
  tier?: BentoTier;
  /**
   * Accessible label for tiles that contain only a bare number (e.g. "142k").
   * Placed on the Card container as `aria-label`.
   */
  ariaLabel?: string;
  /**
   * When true, renders a Skeleton placeholder instead of children.
   * Prevents CLS by keeping the tile at its natural size.
   */
  loading?: boolean;
  /**
   * Minimum height applied as an inline `style` (px is fine for min-height;
   * not a color/radius value). Prevents layout collapse before content loads.
   * Example: `minHeight={200}`.
   */
  minHeight?: number;
}

/** Skeleton placeholder rendered when `loading` is true. Preserves tile height to prevent CLS. */
function BentoGridItemSkeleton() {
  return (
    <div className="flex flex-col gap-3 flex-1">
      <Skeleton className="h-full min-h-20 w-full rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Inner content rendered when the tile is not in loading state. */
function BentoGridItemContent({
  header,
  icon,
  title,
  description,
  children,
}: Pick<BentoGridItemProps, 'header' | 'icon' | 'title' | 'description' | 'children'>) {
  return (
    <>
      {header && (
        // Inset well — opaque muted surface (rule 3: no bg-muted/NN on content)
        <div className="flex w-full items-center justify-center rounded-lg bg-muted overflow-hidden min-h-30 max-h-40 border border-border">
          {header}
        </div>
      )}
      <div className="flex flex-col gap-2 flex-1">
        {(icon || title || description) && (
          <div className="space-y-1.5 min-w-0">
            {icon && (
              // Status-tint pattern: /10 fill + semantic text (hợp lệ)
              <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            {title && (
              <h3 className="type-heading text-foreground break-words">{title}</h3>
            )}
            {description && (
              <p className="type-label text-muted-foreground break-words">{description}</p>
            )}
          </div>
        )}
        {children && (
          <div className="mt-2 flex-1 flex flex-col">
            {children}
          </div>
        )}
      </div>
    </>
  );
}

export function BentoGridItem({
  className,
  children,
  header,
  icon,
  title,
  description,
  tier = 'metric',
  ariaLabel,
  loading = false,
  minHeight,
  interactive = true,
  ...props
}: BentoGridItemProps) {
  const cardStyle = minHeight !== undefined ? { minHeight } : undefined;
  const cardClass = cn(
    'relative overflow-hidden flex flex-col gap-4 p-5 lg:p-6 @container',
    'rounded-xl',
    bentoTierVariants({ tier }),
    className,
  );

  return (
    <Card
      interactive={interactive}
      aria-label={ariaLabel}
      className={cardClass}
      style={cardStyle}
      {...props}
    >
      {loading ? (
        <BentoGridItemSkeleton />
      ) : (
        <BentoGridItemContent header={header} icon={icon} title={title} description={description}>
          {children}
        </BentoGridItemContent>
      )}
    </Card>
  );
}
