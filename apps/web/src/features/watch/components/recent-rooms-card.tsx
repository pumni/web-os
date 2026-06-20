import Link from 'next/link';
import type { Route } from 'next';
import { ChevronRight, Clapperboard, Pause, Play } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  cn,
} from '@pumni/ui';

import type { Room } from '../types';
import { RoomCard } from './room-card';
import { EmptyRoomsCard } from './empty-rooms-card';

interface RecentRoomsCardProps {
  rooms: Room[];
  /** Hard cap for the glanceable grid — keeps the layout balanced. */
  maxRooms?: number;
}

function pluralize(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

export function RecentRoomsCard({ rooms, maxRooms = 4 }: RecentRoomsCardProps) {
  if (rooms.length === 0) {
    return <EmptyRoomsCard />;
  }

  const visible = rooms.slice(0, maxRooms);
  const playingCount = visible.filter((r) => r.is_playing).length;
  const total = rooms.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Clapperboard className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold">Recent Watch Rooms</CardTitle>
            <CardDescription className="text-sm">
              Resume a recent session or jump back into a live party.
            </CardDescription>
          </div>
        </div>

        <CardAction>
          <div className="flex shrink-0 items-center gap-2">
            {playingCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                </span>
                <Play className="size-3" />
                {pluralize(playingCount, 'playing')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Pause className="size-3" />
                All rooms idle
              </span>
            )}

            <Link
              href={'/watch' as Route}
              className="inline-flex items-center gap-1 rounded-md text-xs font-semibold text-primary transition-colors hover:text-primary/80"
            >
              View all
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4')}>
          {visible.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        {total > visible.length ? (
          <p className="text-center text-xs text-muted-foreground">
            Showing {visible.length} of {total} rooms.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
