'use client';

import { Command, Download, FolderOpen, Search, SlidersHorizontal } from 'lucide-react';
import * as React from 'react';

import { AnimatePresence, cn, motion, useReducedMotion } from '@pumni/ui';

import { SHORTCUT_GROUPS } from '../content';
import { AddSongsCallout } from './add-songs-callout';
import { KbdChip } from './kbd-chip';

import type { LucideIcon } from 'lucide-react';

const TAB_ICONS: Record<string, LucideIcon> = {
  picker: Search,
  palette: Command,
  playback: SlidersHorizontal,
  system: FolderOpen,
  add_songs: Download,
};

function ShortcutList({ groupId }: { groupId: string }) {
  const group = SHORTCUT_GROUPS.find((g) => g.id === groupId);

  if (!group) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="type-heading text-sm font-semibold text-foreground">
          {group.label} Shortcuts
        </h4>
        <p className="type-caption text-muted-foreground">
          Keyboard controls for the {group.label.toLowerCase()} interface.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {group.shortcuts.map((shortcut) => (
          <div
            key={shortcut.label}
            className="rounded-lg border border-border bg-card p-4 shadow-sm hover:border-primary/20 transition-colors flex flex-col justify-between gap-3"
          >
            <div className="space-y-1">
              <h5 className="type-label font-semibold text-foreground">{shortcut.label}</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {shortcut.description}
              </p>
            </div>
            {/* Key caps */}
            <div className="flex flex-wrap gap-1 items-center">
              {shortcut.keys.map((key, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-[10px] text-muted-foreground">/</span>}
                  <KbdChip>{key}</KbdChip>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShortcutsReference() {
  const [activeTab, setActiveTab] = React.useState<string>('picker');
  const shouldReduce = useReducedMotion();

  const navItems = [
    ...SHORTCUT_GROUPS.map((g, idx) => ({
      id: g.id,
      label: g.label,
      number: idx + 1,
      icon: TAB_ICONS[g.id] ?? Search,
    })),
    {
      id: 'add_songs',
      label: 'Add songs',
      number: 5,
      icon: Download,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-raised">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 select-none">
        <div className="flex items-center gap-2">
          {/* Custom Traffic Lights */}
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-3 rounded-full bg-(--window-control-close)" />
            <span className="size-3 rounded-full bg-(--window-control-minimize)" />
            <span className="size-3 rounded-full bg-(--window-control-maximize)" />
          </div>
          <span className="font-mono text-xs font-semibold text-muted-foreground ms-2">
            help_system.sh
          </span>
        </div>
        <div className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
          Status: Ready
        </div>
      </div>

      {/* Main Console Workspace */}
      <div className="flex flex-col md:flex-row md:divide-x md:divide-border">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-56 md:shrink-0 bg-muted/15 p-3 flex flex-row overflow-x-auto gap-1 border-b border-border md:border-b-0 md:flex-col md:overflow-x-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex items-center gap-3.5 rounded-lg px-3 py-2 text-xs font-medium transition-all select-none cursor-pointer whitespace-nowrap md:w-full',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="flex-1 p-6 bg-card min-h-90">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={shouldReduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduce ? undefined : { opacity: 0, y: -6 }}
              transition={shouldReduce ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
            >
              {activeTab === 'add_songs' ? (
                <AddSongsCallout />
              ) : (
                <ShortcutList groupId={activeTab} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
