'use client';

import * as React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Pause, Play, Plus, Tv, Users, Wifi } from 'lucide-react';

import { Badge } from '@pumni/ui/feedback';
import { BentoGrid, BentoGridItem } from '@pumni/ui/os';
import { Button, Input } from '@pumni/ui/form';
import { CardWell } from '@pumni/ui/layout';

import type { Room } from '@/features/watch/client';

interface DashboardBentoProps {
  recentRooms: ReadonlyArray<Room>;
}

type NextIntent =
  { kind: 'start' } | { kind: 'open'; room: Room } | { kind: 'resume-live'; room: Room };

function deriveIntent(mostRecent: Room | undefined): NextIntent {
  if (!mostRecent) return { kind: 'start' };
  return mostRecent.is_playing
    ? { kind: 'resume-live', room: mostRecent }
    : { kind: 'open', room: mostRecent };
}

function DashboardHero({ recentRooms }: { recentRooms: ReadonlyArray<Room> }) {
  const router = useRouter();
  const [roomCode, setRoomCode] = React.useState('');
  const mostRecent = recentRooms[0];
  const intent = deriveIntent(mostRecent);

  const title =
    intent.kind === 'resume-live'
      ? `Resume ${intent.room.code}`
      : intent.kind === 'open'
        ? `Resume ${intent.room.code}`
        : 'Start your first session';

  const subtitle =
    intent.kind === 'resume-live'
      ? `Room ${intent.room.code} is playing — jump back in sync.`
      : intent.kind === 'open'
        ? `Pick up where you left off in room ${intent.room.code}.`
        : 'Host a synchronized party or join one with a code.';

  const primaryHref: Route =
    intent.kind === 'start' ? ('/watch' as Route) : (`/watch?roomId=${intent.room.id}` as Route);

  const primaryLabel =
    intent.kind === 'resume-live'
      ? 'Resume live session'
      : intent.kind === 'open'
        ? 'Open room'
        : 'Start a new room';

  const PrimaryIcon = intent.kind === 'resume-live' ? Play : intent.kind === 'open' ? Tv : Plus;

  const joinRoom = () => {
    const normalized = roomCode.trim().toUpperCase();
    if (!normalized) return;
    router.push(`/watch?roomCode=${encodeURIComponent(normalized)}` as Route);
  };

  return (
    <BentoGridItem className="md:col-span-2" aria-labelledby="dashboard-next-action">
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge tone="accent" size="sm">
              Next action
            </Badge>
            {intent.kind === 'resume-live' ? (
              <Badge tone="success" size="sm" className="gap-1">
                <Wifi className="size-3" /> Live
              </Badge>
            ) : null}
          </div>
          <div className="space-y-1">
            <h2 id="dashboard-next-action" className="type-display text-xl text-foreground">
              {title}
            </h2>
            <p className="type-caption max-w-xl text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-2">
            <Input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') joinRoom();
              }}
              placeholder="Room code"
              aria-label="Room code"
              className="max-w-xs"
            />
            <Button variant="secondary" onClick={joinRoom} disabled={!roomCode.trim()}>
              Join
            </Button>
          </div>

          <Button asChild className="shrink-0 gap-2">
            <Link href={primaryHref}>
              <PrimaryIcon className="size-4" />
              {primaryLabel}
            </Link>
          </Button>
        </div>
      </div>
    </BentoGridItem>
  );
}

function SessionPulse({ recentRooms }: { recentRooms: ReadonlyArray<Room> }) {
  const active = recentRooms.filter((room) => room.is_playing).length;
  const paused = Math.max(recentRooms.length - active, 0);

  return (
    <BentoGridItem className="md:col-span-1" aria-labelledby="dashboard-session-pulse">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="space-y-1">
          <p className="type-caption text-muted-foreground">Session pulse</p>
          <h2 id="dashboard-session-pulse" className="type-display text-2xl text-foreground">
            {active} live
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CardWell className="flex items-center gap-2 p-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-success/12 text-success">
              <Play className="size-4" />
            </span>
            <div>
              <div className="type-heading text-sm text-foreground">{active}</div>
              <div className="type-caption text-muted-foreground">Playing</div>
            </div>
          </CardWell>
          <CardWell className="flex items-center gap-2 p-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Pause className="size-4" />
            </span>
            <div>
              <div className="type-heading text-sm text-foreground">{paused}</div>
              <div className="type-caption text-muted-foreground">Paused</div>
            </div>
          </CardWell>
        </div>
      </div>
    </BentoGridItem>
  );
}

function RoomInventory({ recentRooms }: { recentRooms: ReadonlyArray<Room> }) {
  const total = recentRooms.length;
  const mostRecent = recentRooms[0];

  return (
    <BentoGridItem className="md:col-span-1" aria-labelledby="dashboard-room-inventory">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="type-caption text-muted-foreground">Recent rooms</p>
            <h2 id="dashboard-room-inventory" className="type-display text-2xl text-foreground">
              {total}
            </h2>
          </div>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-4" />
          </span>
        </div>

        <div className="space-y-2">
          <p className="type-caption text-muted-foreground">
            {mostRecent ? `Latest room ${mostRecent.code}` : 'No recent room yet'}
          </p>
          <Button variant="ghost" size="sm" asChild className="w-fit gap-1 px-0">
            <Link href={'/watch' as Route}>
              Open Watch Together <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </BentoGridItem>
  );
}

export function DashboardBento({ recentRooms }: DashboardBentoProps) {
  return (
    <BentoGrid className="md:grid-cols-3">
      <DashboardHero recentRooms={recentRooms} />
      <SessionPulse recentRooms={recentRooms} />
      <RoomInventory recentRooms={recentRooms} />
    </BentoGrid>
  );
}

export function DashboardBentoSkeleton() {
  return (
    <BentoGrid className="md:grid-cols-3" aria-hidden="true">
      {[2, 1, 1].map((span, index) => (
        <BentoGridItem key={index} className={span === 2 ? 'md:col-span-2' : 'md:col-span-1'}>
          <div className="h-36 animate-pulse rounded-xl bg-muted/40" />
        </BentoGridItem>
      ))}
    </BentoGrid>
  );
}
