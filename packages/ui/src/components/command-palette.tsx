'use client';

import * as React from 'react';
import { SearchIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { matchSorter } from 'match-sorter';

import { Highlight } from './highlight';

export type CommandItem = {
  id: string;
  label: string;
  /** Extra search terms not shown in the label. */
  keywords?: string;
  /** Optional group heading — items with the same value are bucketed under a label. */
  group?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
};

function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = 'Type a command or search...',
  emptyMessage = 'No results found.',
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // match-sorter gives fuzzy matching (typo tolerance), relevance ranking, and
  // acronym support ("db" → "Dashboard") across both label and keywords.
  const filtered = React.useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return matchSorter(items, q, { keys: ['label', 'keywords'] });
  }, [items, query]);

  // Bucket results by `group` (first-seen order) so grouped items render under
  // a heading. Ungrouped items fall into a synthetic "Other" bucket only when
  // any other item is grouped — otherwise the list stays flat for back-compat.
  const grouped = React.useMemo(() => {
    const hasGroups = filtered.some((item) => item.group);
    if (!hasGroups) return null;
    const buckets: { name: string; items: CommandItem[] }[] = [];
    for (const item of filtered) {
      const name = item.group ?? 'Other';
      let bucket = buckets.find((b) => b.name === name);
      if (!bucket) {
        bucket = { name, items: [] };
        buckets.push(bucket);
      }
      bucket.items.push(item);
    }
    return buckets;
  }, [filtered]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery('');
      setActiveIndex(0);
    }
    onOpenChange(next);
  }

  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function select(index: number) {
    const item = filtered[index];
    if (!item) return;
    handleOpenChange(false);
    item.onSelect();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(activeIndex);
    }
  }

  function renderOption(item: CommandItem, index: number) {
    return (
      <button
        key={item.id}
        id={`command-item-${item.id}`}
        type="button"
        role="option"
        aria-selected={index === activeIndex}
        data-index={index}
        data-active={index === activeIndex}
        onClick={() => select(index)}
        onMouseMove={() => setActiveIndex(index)}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-foreground outline-none transition-colors state-hover state-pressed [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
      >
        {item.icon}
        <span className="flex-1 truncate">
          <Highlight text={item.label} query={query} />
        </span>
        {item.shortcut && (
          <kbd className="ml-auto text-xs tracking-widest text-muted-foreground">{item.shortcut}</kbd>
        )}
      </button>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="command-overlay"
          style={{ zIndex: 'var(--z-overlay)' }}
          className="fixed inset-0 overlay-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          data-slot="command-palette"
          onKeyDown={onKeyDown}
          style={{ zIndex: 'var(--z-command)' }}
          className="glass-panel fixed top-[20%] left-[50%] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] gap-0 overflow-hidden rounded-xl p-0 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-xl"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search for a command or page, then press Enter to run it.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-2 border-b border-border px-3">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              role="combobox"
              aria-expanded
              aria-controls="command-palette-list"
              aria-activedescendant={
                filtered[activeIndex] ? `command-item-${filtered[activeIndex].id}` : undefined
              }
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div
            ref={listRef}
            id="command-palette-list"
            role="listbox"
            className="max-h-80 overflow-y-auto p-1.5"
          >
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            ) : grouped ? (
              grouped.map((bucket) => (
                <div key={bucket.name} role="group" aria-label={bucket.name} className="p-1">
                  <div
                    role="presentation"
                    data-slot="command-group-label"
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {bucket.name}
                  </div>
                  {bucket.items.map((item) => {
                    const index = filtered.indexOf(item);
                    return renderOption(item, index);
                  })}
                </div>
              ))
            ) : (
              filtered.map((item, index) => renderOption(item, index))
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { CommandPalette };
