'use client';

import * as React from 'react';

import {
  Window,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  motion,
  recipes,
  useReducedMotion,
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
        <span aria-hidden className="absolute inset-s-4 top-8 bottom-0 w-px bg-border" />
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
  return (
    <Window title="Sky Player — Installation" className="w-full shadow-raised">
      <Tabs defaultValue="release" className="flex w-full flex-col gap-2">
        <div className="-mx-4 -mt-4 border-b border-border bg-muted/10 p-3">
          <TabsList>
            <TabsTrigger value="release">Standalone release</TabsTrigger>
            <TabsTrigger value="source">From source</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="release" className="mt-0 min-h-70 focus-visible:outline-none">
          <ReleasePanel />
        </TabsContent>
        <TabsContent value="source" className="mt-0 min-h-70 focus-visible:outline-none">
          <SourcePanel />
        </TabsContent>
      </Tabs>
    </Window>
  );
}
