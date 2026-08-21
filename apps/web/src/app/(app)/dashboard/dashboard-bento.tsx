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

  const PrimaryIcon =
    intent.kind === 'resume-live' ? Play : intent.kind === 'open' ? ArrowUpRight : Plus;

  if (intent.kind === 'start') {
    return (
      <BentoGridItem
        tier="hero"
        interactive={false}
        icon={<Tv className="size-4" />}
        title={title}
        description={subtitle}
        minHeight={320}
      >
        <CardWell className="mt-2 flex flex-1 flex-col gap-3">
          <Button
            asChild
            size="lg"
            className="w-full justify-center gap-2 bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-via) text-primary-foreground shadow-card hover:shadow-interactive-hover"
          >
            <Link href={primaryHref}>
              <PrimaryIcon className="size-4" />
              {primaryLabel}
            </Link>
          </Button>

          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              const code = roomCode.trim().toUpperCase();
              if (code) {
                router.push(`/watch?roomCode=${code}` as Route);
              }
            }}
          >
            <Input
              name="roomCode"
              placeholder="Enter a room code (e.g. ABCD)"
              maxLength={12}
              aria-label="Room code to join"
              className="flex-1 font-mono tracking-wider uppercase"
              autoCapitalize="characters"
              spellCheck={false}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <Button type="submit" variant="outline" className="shrink-0 sm:w-auto">
              Join
            </Button>
          </form>
        </CardWell>
      </BentoGridItem>
    );
  }

  const room = intent.room;

  return (
    <BentoGridItem
      tier="hero"
      interactive={false}
      icon={<Tv className="size-4" />}
      title={title}
      description={subtitle}
      minHeight={320}
    >
      <CardWell className="mt-2 flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border bg-card px-2.5 py-1 font-mono text-sm font-semibold text-foreground">
            <Tv className="size-3.5 text-primary" />
            {room.code}
          </span>
          {intent.kind === 'resume-live' ? (
            <Badge tone="success" pulse>
              Live now
            </Badge>
          ) : (
            <Badge tone="neutral">
              <Pause className="size-3" />
              Idle
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {room.source_type
              ? room.source_type.charAt(0).toUpperCase() + room.source_type.slice(1)
              : 'No media queued yet'}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {room.source_ref ?? 'Queue something to start playback'}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full justify-center gap-2 sm:flex-1">
            <Link href={primaryHref}>
              <PrimaryIcon className="size-4" />
              {primaryLabel}
            </Link>
          </Button>
          <Button asChild variant="outline" size="default" className="w-full sm:w-auto">
            <Link href={'/watch' as Route}>
              Browse watch tools
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </CardWell>
    </BentoGridItem>
  );
}

function ActiveRoomsMetric({ recentRooms }: { recentRooms: ReadonlyArray<Room> }) {
  const count = recentRooms.filter((room) => room.is_playing).length;
  return (
    <BentoGridItem
      tier="metric"
      interactive={false}
      icon={<Users className="size-4" />}
      title={String(count)}
      description={count === 0 ? 'No live sessions' : 'Live right now'}
      ariaLabel={`${count} active playing rooms`}
    >
      <div className="mt-auto flex items-center gap-2">
        <Badge tone={count > 0 ? 'success' : 'neutral'} pulse={count > 0}>
          {count > 0 ? 'Sync engaged' : 'Quiet'}
        </Badge>
      </div>
    </BentoGridItem>
  );
}

function PendingInvitesMetric({ count }: { count: number }) {
  return (
    <BentoGridItem
      tier="metric"
      interactive={false}
      icon={<Wifi className="size-4" />}
      title={String(count)}
      description={count === 0 ? 'No pending invites' : 'Awaiting your reply'}
      ariaLabel={`${count} pending invites`}
    >
      <div className="mt-auto flex items-center gap-2">
        <Badge tone={count > 0 ? 'primary' : 'neutral'}>{count > 0 ? 'Open inbox' : 'Clear'}</Badge>
      </div>
    </BentoGridItem>
  );
}

function SyncDriftMetric() {
  return (
    <BentoGridItem
      tier="metric"
      interactive={false}
      icon={<Wifi className="size-4" />}
      title="Stable"
      description="All clear — last activity recent"
      ariaLabel="Sync drift is stable"
    >
      <div className="mt-auto flex items-center gap-2">
        <Badge tone="success">No drift</Badge>
      </div>
    </BentoGridItem>
  );
}

export function DashboardBento({ recentRooms }: DashboardBentoProps) {
  return (
    <BentoGrid rowHeight={140}>
      <DashboardHero recentRooms={recentRooms} />
      <ActiveRoomsMetric recentRooms={recentRooms} />
      <PendingInvitesMetric count={0} />
      <SyncDriftMetric />
    </BentoGrid>
  );
}

export function DashboardBentoSkeleton() {
  return (
    <BentoGrid rowHeight={140}>
      <BentoGridItem key="hero" tier="hero" loading interactive={false} minHeight={320} />
      <BentoGridItem key="a" tier="metric" loading interactive={false} />
      <BentoGridItem key="b" tier="metric" loading interactive={false} />
      <BentoGridItem key="c" tier="metric" loading interactive={false} />
    </BentoGrid>
  );
}
