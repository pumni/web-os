'use client';

import * as React from 'react';
import { Maximize2, Minus, X } from 'lucide-react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';

import { cn } from '../../lib/cn';
import { transition } from '../../lib/motion';

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
        'inline-flex size-3.5 items-center justify-center rounded-full text-transparent transition-colors hover:text-(--window-control-icon) focus-visible:text-(--window-control-icon) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-2.5',
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

  return (
    <motion.section
      data-slot="window"
      data-active={active}
      aria-label={typeof title === 'string' ? title : undefined}
      style={{ zIndex: active ? 'var(--z-window-active)' : 'var(--z-window)', ...style }}
      initial={shouldReduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: active ? 1 : 0.95, scale: 1, y: 0 }}
      exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
      transition={shouldReduce ? { duration: 0 } : transition.fluid}
      className={cn('glass-window flex flex-col overflow-hidden rounded-xl', className)}
      {...props}
    >
      <header
        data-slot="window-titlebar"
        className="glass-titlebar flex h-10 shrink-0 items-center gap-3 border-b px-3"
      >
        <div className="flex items-center gap-2">
          <WindowControl
            label="Close window"
            onClick={onClose}
            className="bg-(--window-control-close)"
          >
            <X />
          </WindowControl>
          <WindowControl
            label="Minimize window"
            onClick={onMinimize}
            className="bg-(--window-control-minimize)"
          >
            <Minus />
          </WindowControl>
          <WindowControl
            label="Maximize window"
            onClick={onMaximize}
            className="bg-(--window-control-maximize)"
          >
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
