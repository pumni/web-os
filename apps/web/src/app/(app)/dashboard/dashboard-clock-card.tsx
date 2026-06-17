'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';

import { useClock } from '@/hooks/use-clock';
import { dateFormatter } from '@/lib/formatters';

/**
 * System-time tile body. Layout height is owned by the parent `BentoGridItem`
 * via the `minHeight` prop — pass it to the Bento (see `dashboard-meta.ts`).
 */
export function DashboardClockCard() {
  const timestamp = useClock();

  if (timestamp === null) {
    return (
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <Clock className="size-4 text-primary" />
          <span className="type-caption font-semibold uppercase tracking-wider">
            System time
          </span>
        </div>
        <div className="space-y-2">
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    );
  }

  const date = new Date(timestamp);

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  const formattedDate = dateFormatter.format(date);

  return (
    <div className="flex h-full select-none flex-col justify-between">
      <div className="flex items-center justify-between text-muted-foreground">
        <Clock className="size-4 text-primary" />
        <span className="type-caption font-semibold uppercase tracking-wider">
          System time
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <time
          dateTime={date.toISOString()}
          className="flex items-baseline gap-1 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          <span>{hours}</span>
          <span className="animate-pulse text-primary">:</span>
          <span>{minutes}</span>
          <span className="type-caption font-medium text-muted-foreground">:{seconds}</span>
        </time>

        <p className="type-caption font-medium text-muted-foreground">{formattedDate}</p>
      </div>
    </div>
  );
}
