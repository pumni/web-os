'use client';

import * as React from 'react';
import { Maximize2, Minus, X } from 'lucide-react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';

import { cn } from '../../lib/cn';
import { transition } from '../../lib/motion';

// ---------------------------------------------------------------------------
// Motion vocabulary (module scope).
// ---------------------------------------------------------------------------
// Motion values are constant — declaring them at module scope keeps their
// identity stable across renders instead of allocating fresh objects each
// paint. `useReducedMotion` still gates which of these reach the element
// (passing `false` for `initial`/`exit` and a `duration: 0` transition
// neutralises the JS animation under reduced-motion, since the global CSS
// media query cannot silence motion's JS animations).

/** Full-energy entrance — fade + subtle rise + settle. */
const WINDOW_ENTER = { opacity: 0, scale: 0.96, y: 8 } as const;
/** Resting state of an active window. */
const WINDOW_VISIBLE = { opacity: 1, scale: 1, y: 0 } as const;
/** Slightly dimmed resting state for an inactive window. */
const WINDOW_INACTIVE = { opacity: 0.95, scale: 1, y: 0 } as const;
/** Exit mirrors the entrance for a symmetric hand-off. */
const WINDOW_EXIT = { opacity: 0, scale: 0.96, y: 8 } as const;
/** Reduced-motion exit — opacity-only so the window never pops out. */
const WINDOW_EXIT_REDUCED = { opacity: 0 } as const;

type WindowProps = Omit<HTMLMotionProps<'section'>, 'title' | 'children'> & {
  title: React.ReactNode;
  children?: React.ReactNode;
  active?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  toolbar?: React.ReactNode;
};

function WindowControl({
  className,
  label,
  ...props
}: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-6 items-center justify-center rounded-md text-muted-foreground',
        'transition-colors hover:text-foreground focus-visible:outline-2',
        'focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-3.5',
        'state-hover',
        className,
      )}
      {...props}
    />
  );
}

function Window({
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
      data-slot="window"
      data-active={active}
      aria-labelledby={titleId}
      style={{ zIndex: active ? 'var(--z-window-active)' : 'var(--z-window)', ...style }}
      initial={shouldReduce ? false : WINDOW_ENTER}
      animate={active ? WINDOW_VISIBLE : WINDOW_INACTIVE}
      exit={shouldReduce ? WINDOW_EXIT_REDUCED : WINDOW_EXIT}
      transition={shouldReduce ? { duration: 0 } : transition.fluid}
      className={cn('glass-window flex flex-col overflow-hidden rounded-xl', className)}
      {...props}
    >
      <header
        data-slot="window-titlebar"
        id={titleId}
        className="glass-titlebar flex h-10 shrink-0 items-center gap-3 px-3"
      >
        <div className="flex items-center gap-2">
          <WindowControl
            label="Close window"
            onClick={onClose}
            className="hover:text-destructive"
          >
            <X />
          </WindowControl>
          <WindowControl label="Minimize window" onClick={onMinimize}>
            <Minus />
          </WindowControl>
          <WindowControl label="Maximize window" onClick={onMaximize}>
            <Maximize2 />
          </WindowControl>
        </div>
        <div className="min-w-0 flex-1 truncate text-center text-sm font-medium text-foreground">
          {title}
        </div>
        <div className="flex shrink-0 items-center gap-1">{toolbar}</div>
      </header>
      <div data-slot="window-body" className="min-h-0 flex-1 overflow-auto bg-card p-4">
        {children}
      </div>
    </motion.section>
  );
}

export { Window };
