import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * KbdChip — the owned `<kbd>` shortcut chip primitive.
 *
 * Replaces the inline `<kbd>` styling that was hand-rolled in
 * `apps/web/src/features/sky-player/components/kbd-chip.tsx` (and the
 * unstyled `<kbd>` inside the command palette's shortcut hint).
 * One vocabulary, one reduced-motion-safe a11y contract: the native
 * `<kbd>` element is left intact so OS-level shortcut styling and
 * screen-reader semantics are preserved.
 *
 * ### Accessibility
 * Always renders as a native `<kbd>` element. When inside a sentence
 * about a shortcut ("Press Cmd K to open"), prefer wrapping the text
 * in `<KbdChip>` rather than relying on the default UA `<kbd>` style,
 * which varies wildly (italic on macOS, monospace on Linux, etc.).
 *
 * ### Tone
 * Inherits current text colour by default. Use `tone="primary"` to
 * surface the chip as a richer "interactive shortcut" affordance
 * (e.g. inside a command-palette row or button trigger).
 */
type KbdChipTone = 'neutral' | 'primary';

const toneClass: Record<KbdChipTone, string> = {
  neutral:
    'border border-border bg-muted font-mono text-xs font-semibold text-foreground shadow-sm',
  primary:
    'border border-primary/30 bg-primary/10 font-mono text-xs font-semibold text-primary shadow-sm',
};

function KbdChip({
  className,
  tone = 'neutral',
  children,
  ...props
}: React.ComponentProps<'kbd'> & {
  tone?: KbdChipTone;
}) {
  return (
    <kbd
      data-slot="kbd-chip"
      data-tone={tone}
      className={cn(
        'inline-flex min-w-6 items-center justify-center rounded-md px-1.5 py-0.5 select-none whitespace-nowrap align-baseline',
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
   </kbd>
  );
}

export { KbdChip };
