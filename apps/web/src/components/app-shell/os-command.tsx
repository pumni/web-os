"use client";

import * as React from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ComponentIcon, LayoutDashboard, Palette, SearchIcon, Settings, User, Music } from "lucide-react";

import { CommandPalette, type CommandItem } from "@pumni/ui";

/**
 * Wires the command palette into the OS shell: a ⌘K / Ctrl+K hotkey plus a
 * topbar search trigger. Navigation items mirror the sidebar.
 */
export function OsCommand() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = React.useMemo<CommandItem[]>(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard />,
        onSelect: () => router.push("/dashboard"),
      },
      {
        id: "sky-player",
        label: "Sky Player",
        keywords: "music song sheet play cotl instrument",
        icon: <Music />,
        onSelect: () => router.push("/sky-player" as Route),
      },
      {
        id: "profile",
        label: "Profile",
        keywords: "settings account name",
        icon: <User />,
        onSelect: () => router.push("/settings/profile"),
      },
      {
        id: "account",
        label: "Account settings",
        keywords: "email password security",
        icon: <Settings />,
        onSelect: () => router.push("/settings/account"),
      },
      {
        id: "appearance",
        label: "Appearance",
        keywords: "theme dark light mode",
        icon: <Palette />,
        onSelect: () => router.push("/settings/appearance"),
      },
      {
        id: "design-system",
        label: "Design System",
        keywords: "tokens components qa visual",
        icon: <ComponentIcon />,
        onSelect: () => router.push("/design-system" as Route),
      },
    ],
    [router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-1 hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} items={items} />
    </>
  );
}
