import Link from 'next/link';
import type { Route } from 'next';
import { Clapperboard, Plus } from 'lucide-react';

import { Button, Card, CardContent } from '@pumni/ui';

export function EmptyRoomsCard() {
  return (
    <Card className="relative overflow-hidden">
      {/* Subtle brand ambient wash — decorative only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-(--brand-gradient-from)/10 via-transparent to-(--brand-gradient-to)/10"
      />

      <CardContent className="relative flex flex-col items-center justify-center gap-4 py-12 text-center">
        <span
          aria-hidden
          className="inline-flex size-14 items-center justify-center rounded-2xl border bg-card text-primary shadow-card"
        >
          <Clapperboard className="size-7" />
        </span>

        <div className="w-full max-w-sm space-y-1">
          <h3 className="text-lg font-semibold text-foreground">No watch rooms yet</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Start a synchronized session and invite friends — your recent rooms show up here so
            you can pick up where you left off.
          </p>
        </div>

        <Button
          asChild
          className="bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-via) text-primary-foreground shadow-card hover:shadow-interactive-hover"
        >
          <Link href={'/watch' as Route}>
            <Plus className="size-4" />
            Start a new room
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
