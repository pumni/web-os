'use client';

import * as React from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { SearchIcon } from 'lucide-react';

import { CommandPalette } from '@pumni/ui/overlay';
import type { CommandItem } from '@pumni/ui/overlay';
import { KbdChip } from '@pumni/ui/feedback';
import { withViewTransition } from '@pumni/ui/lib/view-transition';
import { commandNavItems } from './nav-items';

/** Turns a route path into a DOM-safe id: "/settings/account" -> "settings-account". */
function toCommandId(href: Route): string {
  return href.replace(/^\/+/, '').replace(/\//g, '-') || 'root';
}

/**
 * Wires the command palette into the OS shell: a ⌘K / Ctrl+K hotkey plus a
 * topbar search trigger. Items are derived from the shared nav source so the
 * palette stays in sync with the sidebar automatically — no manual duplication
 * when a feature is added.
 */
export function OsCommand() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const items: CommandItem[] = commandNavItems.map((item) => {
    const Icon = item.icon;
    return {
      id: toCommandId(item.href),
      label: item.label,
      keywords: item.keywords,
      group: item.group,
      icon: <Icon />,
      onSelect: () =>
        withViewTransition(() => router.push(item.href), { type: 'slide-forward' }),
    };
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card surface-raised px-3 text-sm text-muted-foreground transition-colors state-hover state-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Search…</span>
        <KbdChip className="ml-1 hidden sm:inline">⌘K</KbdChip>
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} items={items} />
    </>
  );
}
