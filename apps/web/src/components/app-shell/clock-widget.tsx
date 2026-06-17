'use client';

import { useClock } from '@/hooks/use-clock';
import { dateFormatter } from '@/lib/formatters';

export function ClockWidget() {
  const timestamp = useClock();

  if (timestamp === null) {
    return <div className="h-5 w-16 animate-pulse rounded bg-muted" />;
  }

  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const formattedDate = dateFormatter.format(date);

  return (
    <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
      <time dateTime={date.toISOString()} className="font-mono font-medium">
        {hours}:{minutes}
      </time>
      <span className="hidden text-xs lg:inline">{formattedDate}</span>
    </div>
  );
}
