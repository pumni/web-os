'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@pumni/ui/form';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Something went wrong | Pumni Web OS</title>
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground antialiased"
      >
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            The application hit an unrecoverable error. Try again to reload this screen.
          </p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">Error digest: {error.digest}</p>
          ) : null}
          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
}
