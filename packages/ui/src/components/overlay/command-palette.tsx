'use client';

import * as React from 'react';
import { SearchIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { matchSorter } from 'match-sorter';

import { cn } from '../../lib/cn';
import { KbdChip } from '../feedback/kbd-chip';
import { Highlight } from '../layout/highlight';
import { OVERLAY_ANIMATION } from './_overlay-variants';

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

  // Defer the expensive fuzzy-filter so keystrokes stay responsive even with
  // hundreds of items. The input shows the raw query immediately; filtering
  // and re-rendering of the list runs at a lower priority.
  const deferredQuery = React.useDeferredValue(query);
  const isPending = query !== deferredQuery;

  const q = deferredQuery.trim();
  const filtered = q ? matchSorter(items, q, { keys: ['label', 'keywords'] }).slice(0, 25) : items;

  // Bucket results by `group` (first-seen order) so grouped items render under
  // a heading. Ungrouped items fall into a synthetic "Other" bucket only when
  // any other item is grouped — otherwise the list stays flat for back-compat.
  const grouped = (() => {
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
  })();

  // Flat index lookup per item, pre-computed once per filter pass. Replaces the
  // previous `filtered.indexOf(item)` inside the grouped render loop, which was
  // O(n²) — every grouped item rescanned the whole list to find its position.
  const indexByItem = new Map<CommandItem, number>();
  filtered.forEach((item, index) => indexByItem.set(item, index));

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery('');
      setActiveIndex(0);
    }
    onOpenChange(next);
  }

  React.useEffect(() => {
    // Skip the scroll-into-view work while the palette is closed (the effect
    // previously ran on every activeIndex change even when unmounted behind
    // the dialog, querying a list that wasn't painted).
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function select(index: number) {
    const item = filtered[index];
    if (!item) return;
    handleOpenChange(false);
    item.onSelect();
  }

  // Keep the active row valid as deferred results change: if filtering removes
  // every item or the current selection goes out of bounds, drop it so Enter
  // (which goes through `select`) and aria-activedescendant stay consistent.
  React.useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [deferredQuery, filtered.length, activeIndex]);

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
        // Guard the mousemove with the current index so hovering WITHIN a row
        // (or re-entering the already-active row) doesn't fire a redundant
        // setState per pixel and re-render the whole list.
        onMouseMove={() => setActiveIndex((current) => (current === index ? current : index))}
        className="flex w-full items-center gap-3 rounded-md state-hover state-pressed px-3 py-2 text-left text-sm text-foreground transition-colors outline-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
      >
        {item.icon}
        <span className="flex-1 truncate">
          <Highlight text={item.label} query={query} />
        </span>
        {item.shortcut && <KbdChip className="ml-auto">{item.shortcut}</KbdChip>}
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
          className={cn(
            'fixed top-[20%] left-[50%] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] glass-panel gap-0 overflow-hidden rounded-xl p-0 outline-none sm:max-w-xl',
            OVERLAY_ANIMATION,
          )}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search for a command or page, then press Enter to run it.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-2 border-b border-border px-3">
            <SearchIcon
              className={cn('size-4 shrink-0 text-muted-foreground', isPending && 'animate-pulse')}
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
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
                    className="px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {bucket.name}
                  </div>
                  {bucket.items.map((item) => {
                    const index = indexByItem.get(item) ?? 0;
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
