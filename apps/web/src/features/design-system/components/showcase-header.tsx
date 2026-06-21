import * as React from 'react';
import { Button } from '@pumni/ui';
import { toast } from 'sonner';
import { BellIcon, CommandIcon } from 'lucide-react';

export function ShowcaseHeader({ onOpenCommand }: { onOpenCommand: () => void }) {
  return (
    <header className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Design System</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Token foundations, shared primitives, surfaces, motion, and personalization from{' '}
          <code className="text-foreground">@pumni/ui</code>.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => toast.success('Notification toast triggered.')}
        >
          <BellIcon />
          Test Toast
        </Button>
        <Button variant="outline" onClick={() => onOpenCommand()}>
          <CommandIcon />
          Command Palette
        </Button>
      </div>
    </header>
  );
}
