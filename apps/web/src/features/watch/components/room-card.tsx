import type { Route } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Clapperboard, Tv } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, cn } from '@pumni/ui';

import type { Room } from '../types';

interface RoomCardProps {
  room: Room;
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}

function statusLabel(playing: boolean): string {
  return playing ? 'Playing' : 'Idle';
}

export function RoomCard({ room }: RoomCardProps) {
  const lastActiveText = formatRelativeTime(room.last_active_at);
  const roomUrl = `/watch?roomId=${room.id}` as Route;

  const hasSource = Boolean(room.source_type);
  const sourceName = room.source_type
    ? room.source_type.charAt(0).toUpperCase() + room.source_type.slice(1)
    : 'No source yet';
  const sourceDetail = room.source_ref
    ? room.source_ref.length > 28
      ? `${room.source_ref.slice(0, 26)}…`
      : room.source_ref
    : 'Add a media URL to begin';

  return (
    <Link
      href={roomUrl}
      className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      aria-label={`Resume watch room ${room.code}, ${statusLabel(room.is_playing).toLowerCase()}`}
    >
      <Card
        interactive
        className={cn(
          'relative h-full overflow-hidden border transition-colors hover:border-primary/40',
        )}
      >
        {/* Subtle gradient hover wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-100"
        />

        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  'inline-flex size-8 shrink-0 items-center justify-center rounded-lg',
                  hasSource ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                <Clapperboard className="size-4" />
              </span>
              <CardTitle className="truncate font-mono text-base font-semibold text-foreground">
                {room.code}
              </CardTitle>
            </div>

            {/* Status chip — semantic tint pattern */}
            {room.is_playing ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                </span>
                Playing
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                Idle
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          {/* Media info — opaque inset well */}
          <div className="space-y-1 rounded-lg border bg-muted p-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Tv className="size-3 text-primary" />
              Active stream
            </span>
            <div className="space-y-0.5">
              <p className="truncate text-sm font-semibold text-foreground">{sourceName}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">{sourceDetail}</p>
            </div>
          </div>

          <CardDescription className="flex items-center justify-between gap-2 pt-0 text-xs">
            <span className="text-muted-foreground">Last active {lastActiveText}</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary transition-transform group-hover:translate-x-0.5">
              Resume
              <ArrowUpRight className="size-3" />
            </span>
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
