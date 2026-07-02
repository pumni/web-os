import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Banner — the owned inline status banner primitive.
 *
 * Replaces the hand-rolled `<div>` shells used by
 * `apps/web/src/features/watch/components/host-claim-banner.tsx` (compact
 * "no host available" inline banner) and the responsible-use guidance
 * block inside `apps/web/src/features/sky-player/sky-player-intro.tsx`
 * (a card-sized, vertical banner). Two sizes share one tone contract so
 * the visual vocabulary stays consistent.
 *
 * ### Tone contract
 * Mirrors `<Badge tone>`: `border-{tone}/20 bg-{tone}/10 text-{tone}` —
 * the single place a tinted border survives the "one `border-border`"
 * ADR-0019 rule (status indicators are the documented exemption).
 * The tone colour cascades to children via CSS inheritance; the
 * `description` body explicitly opts back into `text-foreground` so the
 * block reads neutrally after the icon stamps the tone.
 *
 * ### Size contract
 * - `compact` — single-row, horizontal. Icon • title • `action?`.
 *   Used in chat panels / control bars where vertical space is precious.
 *   Passing `description` here is silently ignored — switch to
 *   `size="block"` if you need the body copy.
 * - `block` — vertical card. Icon block • title • `description?`.
 *   Used as a prominent section divider or a "responsible use" callout.
 *
 * ### a11y
 * `tone="error"` promotes the role to `alert` so screen readers
 * announce urgent content; other tones land on `status` (live region
 * candidate). The trailing `action` is a regular slot — typically a
 * `<Button>` from this package.
 */
type BannerTone = 'warning' | 'info' | 'error' | 'success';
type BannerSize = 'compact' | 'block';

const toneShellClass: Record<BannerTone, string> = {
  warning: 'border-warning/20 bg-warning/10 text-warning',
  info: 'border-info/20 bg-info/10 text-info',
  error: 'border-destructive/20 bg-destructive/10 text-destructive',
  success: 'border-success/20 bg-success/10 text-success',
};

function Banner({
  ref,
  className,
  tone = 'warning',
  size = 'compact',
  icon: Icon,
  title,
  description,
  action,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  tone?: BannerTone;
  size?: BannerSize;
  /** Leading icon — renders as a tone-tinted block (compact) or square (block). */
  icon?: React.ComponentType<{ className?: string }>;
  /** Title node — required. */
  title: React.ReactNode;
  /** Optional richer body content under the title. Silently ignored for
   *  `size="compact"` — switch to `size="block"` to render it. */
  description?: React.ReactNode;
  /** Trailing action slot (e.g. `<Button>`). */
  action?: React.ReactNode;
}) {
  const isCompact = size === 'compact';
  const showDescription = !isCompact && description != null;

  return (
    <div
      ref={ref}
      data-slot="banner"
      data-tone={tone}
      data-size={size}
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex border select-none',
        isCompact
          ? 'items-center justify-between gap-3 rounded-xl px-4 py-2.5'
          : 'items-start gap-4 rounded-lg p-5 md:p-6',
        toneShellClass[tone],
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex min-w-0',
          isCompact ? 'items-center gap-2 type-caption font-medium' : 'flex-col items-start gap-3',
        )}
      >
        {Icon ? (
          <span
            aria-hidden
            className={cn(
              'flex shrink-0 items-center justify-center bg-current/10',
              isCompact ? 'size-5 rounded-md' : 'flex size-9 rounded-lg',
            )}
          >
            <Icon className={isCompact ? 'size-3.5' : 'h-5 w-5'} />
          </span>
        ) : null}
        <div className={cn('flex min-w-0 flex-col', isCompact ? 'gap-0.5' : 'space-y-1.5')}>
          <span
            className={cn(isCompact ? 'type-caption font-medium' : 'type-heading text-foreground')}
          >
            {title}
          </span>
          {showDescription ? (
            <p className="type-body text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      {action ? <div className="ms-auto flex shrink-0 items-center">{action}</div> : null}

      {children}
    </div>
  );
}

export { Banner };
