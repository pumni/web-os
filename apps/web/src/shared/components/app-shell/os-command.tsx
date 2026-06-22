'use client';

import * as React from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { SearchIcon } from 'lucide-react';

import { CommandPalette } from '@pumni/ui/overlay';
import type { CommandItem } from '@pumni/ui/overlay';
import { withViewTransition } from '@pumni/ui/lib/view-transition';
import { navItems } from './nav-items';

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

  const items = React.useMemo<CommandItem[]>(
    () =>
      navItems.map((item) => {
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
      }),
    [router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
