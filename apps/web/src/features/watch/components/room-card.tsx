import type { Route } from 'next';
import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription } from '@pumni/ui';

import type { Room } from '../types';

interface RoomCardProps {
  room: Room;
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

export function RoomCard({ room }: RoomCardProps) {
  const lastActiveText = formatRelativeTime(room.last_active_at);

  const roomUrl = `/watch?roomId=${room.id}` as Route;

  return (
    <Link href={roomUrl} className="block">
      <Card interactive className="h-full min-w-[200px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="size-4 text-primary" />
            <span className="truncate font-mono text-sm">{room.code}</span>
          </CardTitle>
          <CardDescription className="flex items-center gap-1">
            <span>Last active {lastActiveText}</span>
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
