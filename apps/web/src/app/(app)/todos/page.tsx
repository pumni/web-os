import type { Metadata } from 'next';
import { CheckSquare } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@pumni/ui/layout';

import { DailyPlanner } from './daily-planner';

export const metadata: Metadata = {
  title: 'Todos',
  description: 'Lightweight local-only to-do list to keep momentum between sessions.',
};

export default function TodosPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-28">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <CheckSquare className="size-5" />
       </span>
        <div className="space-y-0.5">
          <h1 className="type-title leading-tight font-semibold text-foreground">Todos</h1>
          <p className="type-label text-muted-foreground">
            A lightweight to-do list that lives in this browser only — keep momentum between
            sessions.
         </p>
       </div>
     </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Planner</CardTitle>
          <CardDescription>
            Add, complete, or remove tasks. Tasks persist per browser, not across devices.
         </CardDescription>
       </CardHeader>
        <CardContent>
          <DailyPlanner />
       </CardContent>
     </Card>
   </div>
  );
}
