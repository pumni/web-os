"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebarCollapsed } from "@/stores/app-ui-store";
import { SIDEBAR_WIDTH } from "./sidebar-config";

type AppMainProps = Readonly<{
  defaultCollapsed: boolean;
  topbar: ReactNode;
  children: ReactNode;
}>;

/**
 * Client wrapper for the content column. Keeps its left padding in sync with the
 * desktop rail width so the page reflows as the sidebar collapses/expands.
 * `topbar` and `children` are server-rendered nodes passed through untouched.
 */
export function AppMain({ defaultCollapsed, topbar, children }: AppMainProps) {
  const collapsed = useSidebarCollapsed(defaultCollapsed);

  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col transition-[padding] duration-300 ease-out",
        collapsed ? SIDEBAR_WIDTH.collapsed.pad : SIDEBAR_WIDTH.expanded.pad,
      )}
    >
      {topbar}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 duration-500 animate-in fade-in slide-in-from-bottom-2 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
