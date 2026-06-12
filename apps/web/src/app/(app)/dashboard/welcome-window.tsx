"use client";

import * as React from "react";

import { Window } from "@pumni/ui";

/**
 * Showcase of the OS `Window` primitive on the dashboard. The titlebar controls
 * are wired: close hides the window, minimize collapses the body.
 */
export function WelcomeWindow() {
  const [visible, setVisible] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState(false);

  if (!visible) return null;

  return (
    <Window
      title="Welcome to Pumni OS"
      onClose={() => setVisible(false)}
      onMinimize={() => setCollapsed((value) => !value)}
      onMaximize={() => setCollapsed(false)}
    >
      {!collapsed && (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            This desktop runs on the new <strong className="text-foreground">Liquid Glass</strong>{" "}
            design system — OKLCH tokens, an Indigo brand, and frosted floating surfaces.
          </p>
          <p>
            Press{" "}
            <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">⌘K</kbd> to open the
            command palette, or use the dock below to jump between apps.
          </p>
        </div>
      )}
    </Window>
  );
}
