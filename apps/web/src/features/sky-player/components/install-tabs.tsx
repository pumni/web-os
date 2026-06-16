'use client';

import * as React from 'react';

import {
  Window,
  Button,
  motion,
  recipes,
  useReducedMotion,
  cn,
} from '@pumni/ui';

import { RELEASE_INSTALL_STEPS, SOURCE_INSTALL_STEPS, SKY_PLAYER_LINKS } from '../content';

function InstallStep({
  index,
  total,
  text,
}: {
  index: number;
  total: number;
  text: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {index < total - 1 ? (
        <span
          aria-hidden
          className="absolute start-4 top-8 bottom-0 w-px bg-border"
        />
      ) : null}
      <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
        {index + 1}
      </div>
      <p className="pt-1.5 text-sm leading-relaxed text-foreground">{text}</p>
    </li>
  );
}

function ReleasePanel() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div {...(shouldReduce ? {} : recipes.fadeRise)} className="space-y-5 p-5 pt-4">
      <p className="type-label text-muted-foreground">
        Recommended — no Python or build tools required.
      </p>
      <ol className="space-y-0">
        {RELEASE_INSTALL_STEPS.map((step, idx) => (
          <InstallStep key={idx} index={idx} total={RELEASE_INSTALL_STEPS.length} text={step} />
        ))}
      </ol>
      <Button asChild className="rounded-full">
        <a href={SKY_PLAYER_LINKS.releases} target="_blank" rel="noopener noreferrer">
          Get latest release
        </a>
      </Button>
    </motion.div>
  );
}

function SourcePanel() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div {...(shouldReduce ? {} : recipes.fadeRise)} className="space-y-5 p-5 pt-4">
      <p className="type-label text-muted-foreground">
        For developers who want to run or modify the Python source directly.
      </p>
      <ol className="space-y-0">
        {SOURCE_INSTALL_STEPS.map((step, idx) => (
          <InstallStep key={idx} index={idx} total={SOURCE_INSTALL_STEPS.length} text={step} />
        ))}
      </ol>
      <Button asChild variant="outline" className="rounded-full">
        <a href={SKY_PLAYER_LINKS.repo} target="_blank" rel="noopener noreferrer">
          View repository
        </a>
      </Button>
    </motion.div>
  );
}

export function InstallTabs() {
  const [activeTab, setActiveTab] = React.useState<'release' | 'source'>('release');

  return (
    <Window title="Sky Player — Installation" className="w-full shadow-raised">
      <div className="border-b border-border p-3">
        <div className="inline-flex rounded-lg bg-muted p-1 text-muted-foreground">
          <button
            type="button"
            onClick={() => setActiveTab('release')}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
              activeTab === 'release'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'hover:bg-foreground/5 hover:text-foreground',
            )}
          >
            Standalone release
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('source')}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
              activeTab === 'source'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'hover:bg-foreground/5 hover:text-foreground',
            )}
          >
            From source
          </button>
        </div>
      </div>

      <div className="min-h-[280px]">
        {activeTab === 'release' ? <ReleasePanel /> : <SourcePanel />}
      </div>
    </Window>
  );
}
