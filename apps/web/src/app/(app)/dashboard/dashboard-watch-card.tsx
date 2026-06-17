import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@pumni/ui';

/**
 * Watch Together tile body. Quiet, no loading pulse — recent-rooms data lands
 * in Phase 2 via a TanStack Query hook in `features/watch/`. Until then the
 * tile is a plain entry point so the Card primitive does not breathe.
 */
export function DashboardWatchCard() {
  return (
    <div className="flex items-end justify-between gap-4">
      <p className="type-caption text-muted-foreground">
        Open or start a synchronized video room.
      </p>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link href="/watch" className="inline-flex items-center gap-1.5">
          <span>Open</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
