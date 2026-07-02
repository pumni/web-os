'use client';

import * as React from 'react';
import { Maximize2, Minus, Plus, X } from 'lucide-react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';

import { cn } from '../../lib/cn';
import { transition, recipes } from '../../lib/motion';

// ---------------------------------------------------------------------------
// Motion vocabulary (module scope).
// ---------------------------------------------------------------------------
// Motion values are constant — declaring them at module scope keeps their
// identity stable across renders instead of allocating fresh objects each
// paint. `useReducedMotion` still gates which of these reach the element
// (passing `false` for `initial`/`exit` and a `duration: 0` transition
// neutralises the JS animation under reduced-motion, since the global CSS
// media query cannot silence motion's JS animations).

// Divergence rationale: The window entry/exit animations are now promoted to the
// central `recipes.window` (in `lib/motion.ts`). They intentionally diverge from
// `recipes.fadeRise` (by adding a subtle scale settle: 0.96 -> 1) because
// a large OS surface like a window benefits from scale-settle feedback,
// whereas smaller UI content panels do not.

/** Slightly dimmed resting state for an inactive window. */
const WINDOW_INACTIVE = { opacity: 0.95, scale: 1, y: 0 } as const;

type WindowControlProps = React.ComponentProps<'button'> & {
  label: string;
  variant: 'close' | 'minimize' | 'maximize';
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

function WindowControl({
  className,
  label,
  variant,
  icon: Icon,
  ...props
}: WindowControlProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // Apple-style traffic light controls: small round circles, color
      // transition, and hover states. Muted gray when inactive, colored when active.
      className={cn(
        'relative inline-flex size-3 items-center justify-center rounded-full',
        'transition-colors duration-(--duration-base) ease-snappy',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'motion-safe:active:scale-(--press-scale)',
        // Default state (inactive window or non-hover): neutral gray
        'bg-border text-transparent',
        // When active, show the OS colors (red, yellow, green)
        variant === 'close' && 'group-data-[active=true]/window:bg-destructive/80 group-data-[active=true]/window:hover:bg-destructive',
        variant === 'minimize' && 'group-data-[active=true]/window:bg-warning/80 group-data-[active=true]/window:hover:bg-warning',
        variant === 'maximize' && 'group-data-[active=true]/window:bg-success/80 group-data-[active=true]/window:hover:bg-success',
        className,
      )}
      {...props}
    >
      <Icon
        className="absolute size-2 text-window-control-icon opacity-0 group-hover/controls:opacity-100 transition-opacity duration-(--duration-fast) pointer-events-none"
        strokeWidth={4}
      />
    </button>
  );
}

type WindowProps = Omit<HTMLMotionProps<'section'>, 'title' | 'children'> & {
  title: React.ReactNode;
  children?: React.ReactNode;
  active?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  toolbar?: React.ReactNode;
};

function Window({
  ref,
  className,
  title,
  active = true,
  onClose,
  onMinimize,
  onMaximize,
  toolbar,
  children,
  style,
  ...props
}: WindowProps) {
  // motion runs JS animations, which the global CSS reduced-motion media query
  // cannot neutralise — so honour the preference here explicitly.
  const shouldReduce = useReducedMotion();
  // Stable id wires the titlebar text to the window region's accessible name,
  // so a ReactNode title (icon + text) is named correctly — not only string
  // titles (an `aria-label` fallback would miss node titles).
  const titleId = React.useId();

  return (
    <motion.section
      ref={ref}
      data-slot="window"
      data-active={active}
      aria-labelledby={titleId}
      style={{ zIndex: active ? 'var(--z-window-active)' : 'var(--z-window)', ...style }}
      initial={shouldReduce ? false : recipes.window.initial}
      animate={active ? recipes.window.animate : WINDOW_INACTIVE}
      exit={shouldReduce ? { opacity: 0 } : recipes.window.exit}
      transition={shouldReduce ? { duration: 0 } : recipes.window.transition}
      className={cn('glass-window group/window flex flex-col overflow-hidden rounded-xl', className)}
      {...props}
    >
      {/* Header sits INSIDE the `glass-window` shell with no surface of its own
          (no `glass-titlebar`, no `bg-*`, no `border-bottom`): the shell's
          backdrop-filter, tint, and top highlight rim show through here, so the
          titlebar reads as the glass region of ONE continuous window surface
          rather than an iOS-style translucent toolbar divided from its content.
          The opaque `bg-background` body below provides the natural fill shift
          that separates header from content — the Pumni way (fill shift, not
          divider). Uses `--background` (not `--popover`) so that in dark mode
          child cards (`--card`, neutral-880) correctly read as raised above the
          body (background is neutral-890, one stop DARKER), avoiding an inverted
          elevation where the card sank into the surface.
          Avoids a second stacked backdrop-filter pass (ADR-0014 ≤2-layer rule). */}
      <header
        data-slot="window-titlebar"
        id={titleId}
        className="flex h-10 shrink-0 items-center gap-3 px-3"
      >
        <div className="flex items-center gap-1.5 group/controls">
          <WindowControl
            label="Close window"
            onClick={onClose}
            variant="close"
            icon={X}
          />
          <WindowControl
            label="Minimize window"
            onClick={onMinimize}
            variant="minimize"
            icon={Minus}
          />
          <WindowControl
            label="Maximize window"
            onClick={onMaximize}
            variant="maximize"
            icon={Plus}
          />
        </div>
        <div className="min-w-0 flex-1 truncate text-center text-sm font-medium text-foreground">
          {title}
        </div>
        <div className="flex shrink-0 items-center gap-1">{toolbar}</div>
      </header>
      <div data-slot="window-body" className="min-h-0 flex-1 overflow-auto bg-background p-4">
        {children}
      </div>
    </motion.section>
  );
}

export { Window };
