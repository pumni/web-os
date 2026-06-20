import type { Route } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Clapperboard, Tv } from 'lucide-react';

import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardWell,
  IconBadge,
} from '@pumni/ui';

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
    <Card
      asChild
      interactive
      className="group relative h-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Link
        href={roomUrl}
        aria-label={`Resume watch room ${room.code}, ${statusLabel(room.is_playing).toLowerCase()}`}
      >
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <IconBadge tone={hasSource ? 'primary-soft' : 'muted'} size="sm">
                <Clapperboard />
              </IconBadge>
              <CardTitle className="truncate font-mono text-base font-semibold text-foreground">
                {room.code}
              </CardTitle>
            </div>

            {/* Status chip */}
            {room.is_playing ? (
              <Badge tone="success" size="sm" pulse>
                Playing
              </Badge>
            ) : (
              <Badge tone="neutral" size="sm">
                Idle
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          {/* Media info — opaque inset well */}
          <CardWell padding="sm" className="space-y-1">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Tv className="size-3 text-primary" />
              Active stream
            </span>
            <div className="space-y-0.5">
              <p className="truncate text-sm font-semibold text-foreground">{sourceName}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">{sourceDetail}</p>
            </div>
          </CardWell>

          <CardDescription className="flex items-center justify-between gap-2 pt-0 text-xs">
            <span className="text-muted-foreground">Last active {lastActiveText}</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary transition-transform group-hover:translate-x-0.5">
              Resume
              <ArrowUpRight className="size-3" />
            </span>
          </CardDescription>
        </CardContent>
      </Link>
    </Card>
  );
}
