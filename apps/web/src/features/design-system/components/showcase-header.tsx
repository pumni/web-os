'use client';

import * as React from 'react';
import { Button } from '@pumni/ui';
import { toast } from 'sonner';
import { BellIcon, CommandIcon, SunIcon, MoonIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ShowcaseHeader({ onOpenCommand }: { onOpenCommand: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

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
        <Button variant="outline" onClick={toggleTheme} aria-label="Toggle theme">
          {mounted ? (
            resolvedTheme === 'dark' ? (
              <SunIcon className="size-4" />
            ) : (
              <MoonIcon className="size-4" />
            )
          ) : (
            <MoonIcon className="size-4" />
          )}
          {mounted ? (resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Theme'}
        </Button>
        <Button variant="outline" onClick={() => toast.success('Notification toast triggered.')}>
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
