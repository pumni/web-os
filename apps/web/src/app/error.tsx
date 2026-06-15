'use client';

import { useEffect } from 'react';
import { Button } from '@pumni/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
      <h2 className="text-xl font-bold text-destructive">Something went wrong!</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        An error occurred while loading this page: {error.message || 'Unknown error'}
      </p>
      <Button onClick={() => reset()} variant="outline">
        Try again
      </Button>
    </div>
  );
}
