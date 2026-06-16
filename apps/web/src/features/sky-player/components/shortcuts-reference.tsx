'use client';

import * as React from 'react';

import {
  Window,
  Card,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  motion,
  recipes,
  useReducedMotion,
} from '@pumni/ui';

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
          <Card variant="inset" className="h-full">
            <CardContent className="flex justify-between items-start gap-4 p-4">
              <div className="min-w-0 space-y-1">
                <p className="type-label font-semibold text-foreground">
                  {shortcut.label}
                </p>
                <p className="type-caption text-muted-foreground leading-relaxed">
                  {shortcut.description}
                </p>
              </div>

              {/* Key chips — aligned to the right, smart joins */}
              <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                {shortcut.keys.map((key, i) => {
                  const isCombination = shortcut.keys.includes('Ctrl') || shortcut.keys.includes('Shift');
                  return (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {isCombination ? '+' : '/'}
                        </span>
                      )}
                      <KbdChip>{key}</KbdChip>
                    </React.Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
      <Tabs defaultValue="picker" className="w-full flex flex-col gap-2">
        {/* Tab List */}
        <div className="border-b border-border p-3 -mx-4 -mt-4 bg-muted/10">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {tabsItems.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[280px] p-5 pt-4">
          {SHORTCUT_GROUPS.map((group) => (
            <TabsContent
              key={group.id}
              value={group.id}
              className="mt-0 focus-visible:outline-none"
            >
              <ShortcutList groupId={group.id} />
            </TabsContent>
          ))}
          <TabsContent value="add_songs" className="mt-0 focus-visible:outline-none">
            <AddSongsCallout />
          </TabsContent>
        </div>
      </Tabs>
    </Window>
  );
}
