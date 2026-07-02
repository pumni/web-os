import * as React from 'react';

import { cn } from '../../lib/cn';

/**
 * OS dock — a floating glass bar of launcher items. Renders a real nav with
 * focusable buttons so it remains keyboard-navigable.
 */
function Dock({ ref, className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      ref={ref}
      data-slot="dock"
      aria-label="Application dock"
      style={{ zIndex: 'var(--z-dock)' }}
      className={cn(
        'glass-bar-bordered relative flex items-center gap-1 overflow-visible rounded-2xl p-1.5',
        className,
      )}
      {...props}
    />
  );
}

type DockItemProps = React.ComponentProps<'button'> & {
  label: string;
  active?: boolean;
};

function DockItem({ ref, className, label, active = false, children, ...props }: DockItemProps) {
  return (
    <button
      ref={ref}
      type="button"
      data-slot="dock-item"
      data-active={active}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      title={label}
      className={cn(
        'group relative inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-[transform,color,background-color] duration-(--duration-base) ease-snappy hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:scale-(--press-scale) data-[active=true]:text-foreground [&_svg]:size-5',
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden
        className="absolute -bottom-1 size-1 rounded-full bg-primary opacity-0 transition-opacity group-data-[active=true]:opacity-100"
      />
    </button>
  );
}

export { Dock, DockItem };
