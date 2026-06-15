import * as React from "react";

import { cn } from "../lib/cn";

/**
 * OS dock — a floating glass bar of launcher items. Renders a real nav with
 * focusable buttons so it remains keyboard-navigable.
 */
function Dock({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="dock"
      aria-label="Application dock"
      style={{ zIndex: "var(--z-dock)" }}
      className={cn(
        "glass-bar-bordered relative flex items-center gap-1 overflow-visible rounded-2xl p-1.5",
        className,
      )}
      {...props}
    />
  );
}

type DockItemProps = React.ComponentProps<"button"> & {
  label: string;
  active?: boolean;
};

function DockItem({ className, label, active = false, children, ...props }: DockItemProps) {
  return (
    <button
      type="button"
      data-slot="dock-item"
      data-active={active}
      aria-label={label}
      aria-current={active ? "true" : undefined}
      title={label}
      className={cn(
        "group relative inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[active=true]:text-foreground [&_svg]:size-5",
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
