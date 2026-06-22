'use client';

import * as React from 'react';

import { Window, CardWell, Tabs, motion, recipes, useReducedMotion } from '@pumni/ui';

import { SHORTCUT_GROUPS } from '../content';
import { AddSongsCallout } from './add-songs-callout';
import { KbdChip } from './kbd-chip';

function ShortcutList({ groupId }: { groupId: string }) {
  const group = SHORTCUT_GROUPS.find((g) => g.id === groupId);
  const shouldReduce = useReducedMotion();

  if (!group) return null;

  return (
    <motion.ul
      {...(shouldReduce ? {} : recipes.fadeRise)}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {group.shortcuts.map((shortcut) => (
        <li key={shortcut.label}>
          <CardWell
            radius="lg"
            padding="md"
            className="flex h-full items-start justify-between gap-4"
          >
            <div className="min-w-0 space-y-1">
              <p className="type-label font-semibold text-foreground">{shortcut.label}</p>
              <p className="type-caption leading-relaxed text-muted-foreground">
                {shortcut.description}
              </p>
            </div>

            {/* Key chips — aligned to the right, smart joins */}
            <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
              {shortcut.keys.map((key, i) => {
                const isCombination =
                  shortcut.keys.includes('Ctrl') || shortcut.keys.includes('Shift');
                return (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {isCombination ? '+' : '/'}
                      </span>
                    )}
                    <KbdChip>{key}</KbdChip>
                  </React.Fragment>
                );
              })}
            </div>
          </CardWell>
        </li>
      ))}
    </motion.ul>
  );
}

export function ShortcutsReference() {
  const tabsItems = [
    ...SHORTCUT_GROUPS,
    {
      id: 'add_songs',
      label: 'Add songs',
    },
  ];

  return (
    <Window title="Sky Player — Help & Reference" className="w-full shadow-raised">
      <Tabs defaultValue="picker" className="flex w-full flex-col gap-2">
        {/* Tab List */}
        <div className="-mx-4 -mt-4 border-b border-transparent bg-muted/10 p-3">
          <Tabs.List className="flex h-auto flex-wrap gap-1">
            {tabsItems.map((item) => (
              <Tabs.Trigger key={item.id} value={item.id}>
                {item.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>

        {/* Tab Contents */}
        <div className="min-h-70 p-5 pt-4">
          {SHORTCUT_GROUPS.map((group) => (
            <Tabs.Content
              key={group.id}
              value={group.id}
              className="mt-0 focus-visible:outline-none"
            >
              <ShortcutList groupId={group.id} />
            </Tabs.Content>
          ))}
          <Tabs.Content value="add_songs" className="mt-0 focus-visible:outline-none">
            <AddSongsCallout />
          </Tabs.Content>
        </div>
      </Tabs>
    </Window>
  );
}
