'use client';

import * as React from 'react';

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardContent,
  Button,
  motion,
  recipes,
  useReducedMotion,
} from '@pumni/ui';

import { RELEASE_INSTALL_STEPS, SOURCE_INSTALL_STEPS, SKY_PLAYER_LINKS } from '../content';

function InstallSteps({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, idx) => (
        <li key={idx}>
          <Card interactive variant="inset">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-(--brand-gradient-from) to-(--brand-gradient-via) text-xs font-bold text-primary-foreground">
                {idx + 1}
              </div>
              <p className="text-sm font-medium text-foreground">{step}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}

function ReleasePanel() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      {...(shouldReduce ? {} : recipes.fadeRise)}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Recommended for most users — no Python or build tools required.
      </p>
      <InstallSteps steps={RELEASE_INSTALL_STEPS} />
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
    <motion.div
      {...(shouldReduce ? {} : recipes.fadeRise)}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        For developers who want to run or modify the Python source directly.
      </p>
      <InstallSteps steps={SOURCE_INSTALL_STEPS} />
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
    <Tabs defaultValue="release">
      <TabsList className="grid w-full max-w-md grid-cols-2 h-9 p-1 bg-muted border border-border rounded-lg">
        <TabsTrigger value="release" className="text-xs h-7">
          Standalone release
        </TabsTrigger>
        <TabsTrigger value="source" className="text-xs h-7">
          From source
        </TabsTrigger>
      </TabsList>

      <TabsContent value="release" className="mt-6 min-h-[280px]">
        <ReleasePanel />
      </TabsContent>
      <TabsContent value="source" className="mt-6 min-h-[280px]">
        <SourcePanel />
      </TabsContent>
    </Tabs>
  );
}
