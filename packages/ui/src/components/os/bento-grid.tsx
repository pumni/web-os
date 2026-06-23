import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Card } from '../layout/card';
import { CardSpotlight } from '../layout/card-spotlight';
import { CardWell } from '../layout/card-well';
import { IconBadge } from '../layout/icon-badge';
import { Skeleton } from '../feedback/skeleton';

/**
 * BentoGrid — 12-column mathematical layout with tier-based tile sizing.
 *
 * **Container-query responsive (mid-2026 standard).** A named container
 * (`@container/bento`) wraps the grid, and the grid collapses 1 → 6 → 12
 * columns based on that wrapper's width, not the viewport. The container is the
 * wrapper rather than the grid itself because CSS never lets an element respond
 * to its own container query (it would loop) — only descendants can. A bento
 * dropped in a sidebar, dialog, or OS Window narrower than the viewport still
 * collapses correctly — the failure mode of viewport-based breakpoints. Tile
 * spans query the same named container (`@[…]/bento:`), so they stay in
 * lock-step with the active column count even though BentoGridItem is itself a
 * container.
 *
 * Breakpoints (container width, not viewport):
 * - < 40rem (640px): 1 column, all tiles full-width
 * - ≥ 40rem: 6 columns
 * - ≥ 64rem (1024px): 12 columns (or 6 when `columns={6}`)
 *
 * Thresholds match the legacy viewport breakpoints (sm/lg), so full-width
 * consumers render identically to before; only nested/narrow placements improve.
 *
 * Tiles use the `tier` prop instead of raw `colSpan`/`rowSpan` strings.
 * Override layout via `className` when needed.
 *
 * **Row height (the bento math).** By default implicit grid rows size to their
 * tallest item, so a `row-span-2` tier (hero/feature) only reads as "twice as
 * tall" when its content happens to fill two rows. Pass `rowHeight` to fix the
 * row track: `grid-auto-rows: minmax(rowHeight, auto)` gives every row a floor
 * (px is fine for sizing — not a color/radius value), and `row-span-2` then
 * spans exactly two of those tracks — the "hộp cơm" proportional ratios that
 * define a true bento grid. The `auto` ceiling lets a row grow past the floor
 * when dense content demands it, so tiles never clip.
 *
 * **Backfilling gaps.** `dense` turns on `grid-auto-flow: dense` so later tiles
 * fill the holes a `row-span-2` tier leaves beside it — at the cost of visual
 * reordering (see the prop docs for the a11y trade-off).
 *
 * @example
 * ```tsx
 * <BentoGrid rowHeight={140}>
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
  /**
   * Floor height (px) of every implicit grid row. When set, the grid uses
   * `grid-auto-rows: minmax(rowHeight, auto)`, so a `row-span-2` tier spans
   * exactly two fixed-height tracks instead of two content-sized rows — the
   * proportional tile ratios that make a true bento. The `auto` ceiling lets a
   * row grow past the floor for dense content. Omit to keep the legacy
   * content-sized rows (the `row-span-2` tiers then size to their content).
   */
  rowHeight?: number;
  /**
   * Backfill gaps with `grid-auto-flow: dense` — later tiles fill empty cells
   * left by earlier row-spanning tiers (e.g. the 2-column hole beside a
   * `hero`+`feature` pair). **Accessibility caveat:** `dense` reorders tiles
   * visually, which can break the DOM reading order for screen-reader users.
   * Only opt in when tile order carries no narrative meaning (dashboards,
   * galleries, demos). Leave it off for sequential/ordered content.
   */
  dense?: boolean;
}

export function BentoGrid({ className, children, columns = 12, rowHeight, dense, style, ...props }: BentoGridProps) {
  // px is a sizing value, not a color/radius — inline-style override is allowed
  // here (consistent with how `BentoGridItem.minHeight` is already handled).
  const gridStyle: React.CSSProperties = {
    ...(rowHeight !== undefined ? { gridAutoRows: `minmax(${rowHeight}px, auto)` } : {}),
    ...(dense ? { gridAutoFlow: 'dense' } : {}),
    ...style,
  };
  return (
    // Named container lives on this WRAPPER, not the grid. A container can never
    // respond to its OWN query — CSS only restyles a container's
    // descendants by its size, never the container itself (the rule the CSS WG
    // keeps unbreakable to avoid infinite resize loops). So `@container/bento`
    // is declared here and the grid below — its descendant — reads this
    // wrapper's width via `@[…]/bento:` variants. A bento dropped in a
    // sidebar/dialog/OS-Window narrower than the viewport collapses on its own
    // width. Thresholds match the legacy viewport breakpoints (sm=40rem,
    // lg=64rem), so full-width consumers render identically to before.
    <div className="@container/bento">
      <div
        className={cn(
          // Columns query the named `bento` wrapper (the parent), and so do the
          // tile spans in bentoTierVariants — both pinned to the same width, so
          // a 6-col grid always gets 6-col spans, never desyncing.
          'grid grid-cols-1 gap-4 @[40rem]/bento:grid-cols-6 @[64rem]/bento:gap-6',
          columns === 12 ? '@[64rem]/bento:grid-cols-12' : '@[64rem]/bento:grid-cols-6',
          className,
        )}
        style={gridStyle}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BentoGridItem (tile) — tier-based spanning
// ---------------------------------------------------------------------------

/**
 * Tier → span mapping (12-col desktop, 6-col tablet, 1-col mobile).
 *
 * Spans query the NAMED `bento` container (the BentoGrid itself), NOT the
 * nearest container — BentoGridItem is also a `@container`, so an unnamed
 * `@[]` would query the item and desync from the grid's column count. The
 * `@[…]/bento:` prefix pins every span to BentoGrid's width so a 6-col grid
 * always gets 6-col spans even when nested in a viewport that's ≥64rem.
 *
 * | tier    | @[64rem] (12-col)     | @[40rem] (6-col) | base (1-col) |
 * | ------- | --------------------- | ---------------- | ------------ |
 * | hero    | col-span-6 row-span-2 | col-span-6       | full width   |
 * | feature | col-span-4 row-span-2 | col-span-6       | full width   |
 * | metric  | col-span-3            | col-span-3       | full width   |
 * | accent  | col-span-2            | col-span-2       | full width   |
 * | full    | col-span-12           | col-span-6       | full width   |
 */
const bentoTierVariants = cva('', {
  variants: {
    tier: {
      hero: '@[64rem]/bento:col-span-6 @[64rem]/bento:row-span-2 @[40rem]/bento:col-span-6',
      feature: '@[64rem]/bento:col-span-4 @[64rem]/bento:row-span-2 @[40rem]/bento:col-span-6',
      metric: '@[64rem]/bento:col-span-3 @[40rem]/bento:col-span-3',
      accent: '@[64rem]/bento:col-span-2 @[40rem]/bento:col-span-2',
      full: '@[64rem]/bento:col-span-12 @[40rem]/bento:col-span-6',
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
   * Accessible label for tiles whose contents alone do not convey meaning
   * (e.g. a bare number like "142k"). Setting it promotes the tile to a
   * labelled `group` so screen readers announce the label as the tile's name;
   * omit it to leave the tile role-less and read its inner title/description
   * naturally. (A bare `aria-label` on the role-less card div would be
   * ignored, so the role is applied only when a label is present.)
   */
  ariaLabel?: string;
  /**
   * When true, renders a Skeleton placeholder instead of children and drives
   * the Card's `loading` state (`aria-busy="true"` + the breathe animation),
   * preventing CLS by keeping the tile at its natural size. Does not override
   * an explicitly supplied `state` (e.g. error/success).
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
        // Inset well — opaque muted surface (CardWell owns the border + radius).
        <CardWell padding="none" className="flex w-full items-center justify-center overflow-hidden min-h-30 max-h-40">
          {header}
        </CardWell>
      )}
      <div className="flex flex-col gap-2 flex-1">
        {(icon || title || description) && (
          <div className="space-y-1.5 min-w-0">
            {icon && (
              // Status-tint icon chip — primary-soft tone.
              <IconBadge size="md">{icon}</IconBadge>
            )}
            {title && (
              <h3 className="type-heading text-foreground wrap-break-word">{title}</h3>
            )}
            {description && (
              <p className="type-label text-muted-foreground wrap-break-word">{description}</p>
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
  // Passive by default, matching Card's contract — a static surface must not
  // depress. Most tiles are display-only (metrics/KPIs); opt in with
  // `interactive` only for tiles that are genuinely clickable.
  interactive = false,
  // Card carries its own `state` prop (idle/loading/error/success). We only
  // surface the loading branch here, so let any consumer-supplied `state`
  // pass through untouched and avoid a name clash in our own props.
  state,
  variant,
  style,
  ...props
}: BentoGridItemProps) {
  const cardStyle: React.CSSProperties = {
    ...(minHeight !== undefined ? { minHeight } : {}),
    ...style,
  };
  // `aria-label` on a role-less <div> is ignored by the accessibility tree, so
  // only emit it alongside a `role="group"` — that makes the tile an
  // announced labelled group when a label is provided, and leaves passive
  // tiles role-less (their inner title/description still read out naturally).
  const a11yProps =
    ariaLabel !== undefined ? { role: 'group' as const, 'aria-label': ariaLabel } : undefined;
  const cardClass = cn(
    'relative overflow-hidden flex flex-col gap-4 p-5 lg:p-6 @container',
    bentoTierVariants({ tier }),
    className,
  );
  // Loading drives both the skeleton content and the Card's `loading` state
  // (which sets `aria-busy="true"` + the breathe animation), but never
  // overrides a consumer-supplied `state` (e.g. error/success).
  const resolvedState = loading ? 'loading' : state;

  if (variant === 'spotlight') {
    return (
      <CardSpotlight
        interactive={interactive}
        state={resolvedState}
        className={cardClass}
        style={cardStyle}
        {...a11yProps}
        {...props}
      >
        {loading ? (
          <BentoGridItemSkeleton />
        ) : (
          <BentoGridItemContent header={header} icon={icon} title={title} description={description}>
            {children}
          </BentoGridItemContent>
        )}
      </CardSpotlight>
    );
  }

  return (
    <Card
      interactive={interactive}
      variant={variant}
      state={resolvedState}
      className={cardClass}
      style={cardStyle}
      {...a11yProps}
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

