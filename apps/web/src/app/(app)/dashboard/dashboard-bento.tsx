'use client';

import * as React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight,
  ClipboardList,
  Palette,
  Pause,
  Play,
  Plus,
  Sparkles,
  Tv,
  Users,
} from 'lucide-react';

import {
  Badge,
  BentoGrid,
  BentoGridItem,
  Button,
  CardWell,
  IconBadge,
  Input,
  usePersonalization,
} from '@pumni/ui';

import type { Room } from '@/features/watch';


interface DashboardBentoProps {
  recentRooms: ReadonlyArray<Room>;
}

const TASKS_STORAGE_KEY = 'pumni_dashboard_tasks';

/** Custom event name dispatched by DailyPlanner after writing to localStorage. */
const TASKS_UPDATED_EVENT = 'pumni:dashboard-tasks-updated';

interface StoredTask {
  id: string;
  text: string;
  completed: boolean;
}

function readTasksFromStorage(): StoredTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Stable snapshot ref for useSyncExternalStore below.
const FROZEN_EMPTY_TASKS: readonly StoredTask[] = Object.freeze([]);

function TasksMetricContent() {
  const cacheRef = React.useRef<{
    tasks: StoredTask[];
    serialized: string;
  } | null>(null);

  const getSnapshot = React.useCallback((): StoredTask[] => {
    return cacheRef.current ? cacheRef.current.tasks : (FROZEN_EMPTY_TASKS as StoredTask[]);
  }, []);

  const subscribe = React.useCallback((notify: () => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};
    const sync = () => {
      const fresh = readTasksFromStorage();
      const serialized = JSON.stringify(fresh);
      const previous = cacheRef.current;
      if (previous === null || previous.serialized !== serialized) {
        cacheRef.current = { tasks: fresh, serialized };
        notify();
      } else {
        cacheRef.current = { tasks: fresh, serialized };
      }
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener(TASKS_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener(TASKS_UPDATED_EVENT, sync);
    };
  }, []);

  const tasks = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => FROZEN_EMPTY_TASKS as StoredTask[],
  );

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const allDone = total > 0 && completed === total;

  const titleValue = total === 0 ? '0/0' : `${completed}/${total}`;
  const description = total === 0 ? 'No tasks yet' : allDone ? 'All done' : "Today's tasks";
  const ariaTemplate = `${completed} of ${total} tasks completed`;

  return (
    <BentoGridItem
      tier="metric"
      interactive={false}
      icon={<ClipboardList className="size-4" />}
      title={titleValue}
      description={description}
      ariaLabel={ariaTemplate}
    >
      <div className="mt-auto flex items-center gap-2">
        <Badge tone={allDone ? 'success' : 'primary'}>{allDone ? 'Caught up' : 'Keep going'}</Badge>
      </div>
    </BentoGridItem>
  );
}

function subscribeToClientReady() {
  return () => {};
}

function getClientReadySnapshot() {
  return true;
}

function getServerReadySnapshot() {
  return false;
}

function PersonalizeMetric() {
  const { accent } = usePersonalization();
  const mounted = React.useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot,
  );

  const accentValue: string = mounted ? (accent ?? 'coral') : 'coral';
  const swatch: Record<string, string> = {
    coral: 'CO',
    cyan: 'CY',
    indigo: 'IN',
    violet: 'VI',
    rose: 'RO',
  };
  const titleValue = mounted ? (swatch[accentValue] ?? 'CO') : '--';
  const accentLabel = mounted
    ? accentValue.charAt(0).toUpperCase() + accentValue.slice(1)
    : 'Loading';
  const description = mounted ? `${accentLabel} accent` : 'Loading accent...';
  const ariaLabel = mounted ? `Current theme accent: ${accentLabel}` : 'Loading accent';

  return (
    <BentoGridItem
      tier="metric"
      interactive={false}
      icon={<Palette className="size-4" />}
      title={titleValue}
      description={description}
      ariaLabel={ariaLabel}
    >
      <div className="mt-auto flex items-center justify-between gap-2">
        <Badge tone="neutral">Theme</Badge>
        <Button asChild variant="ghost" size="xs" className="gap-1 px-2 text-primary">
          <Link href={'/settings/appearance' as Route}>
            Edit
            <ArrowUpRight className="size-3" />
          </Link>
        </Button>
      </div>
    </BentoGridItem>
  );
}

export function DashboardBento({ recentRooms }: DashboardBentoProps) {
  const mostRecent = recentRooms[0];
  const totalRooms = recentRooms.length;
  const playingCount = recentRooms.filter((room) => room.is_playing).length;
  const lastRoomUrl: Route = mostRecent
    ? (`/watch?roomId=${mostRecent.id}` as Route)
    : ('/watch' as Route);

  return (
    <BentoGrid>
      {/* HERO 1 - Start / Join Watch Room */}
      <BentoGridItem
        tier="hero"
        interactive={false}
        icon={<Sparkles className="size-4" />}
        title="Start a Watch Room"
        description="Create a synchronized session or join one with a code."
        minHeight={320}
      >
        <CardWell className="mt-2 flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Ready to share
            </span>
            <span className="font-mono text-xs font-medium text-muted-foreground">
              Press Ctrl+K to open palette
            </span>
          </div>

          <Button
            asChild
            size="lg"
            className="w-full justify-center gap-2 bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-via) text-primary-foreground shadow-card hover:shadow-interactive-hover"
          >
            <Link href={'/watch' as Route}>
              <Plus className="size-4" />
              Start a new room
            </Link>
          </Button>

          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            action="/watch"
            method="get"
          >
            <Input
              name="roomCode"
              placeholder="Enter a room code (e.g. ABCD)"
              maxLength={12}
              aria-label="Room code to join"
              className="flex-1 font-mono tracking-wider uppercase"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <Button type="submit" variant="outline" className="shrink-0 sm:w-auto">
              Join
            </Button>
          </form>
        </CardWell>
      </BentoGridItem>

      {/* HERO 2 - Most Recent Room or empty state */}
      <BentoGridItem
        tier="hero"
        interactive={false}
        icon={<Tv className="size-4" />}
        title={
          mostRecent
            ? mostRecent.is_playing
              ? 'Resume the live party'
              : 'Resume your last session'
            : 'No rooms yet'
        }
        description={
          mostRecent
            ? mostRecent.is_playing
              ? `Room ${mostRecent.code} is playing — jump back in sync.`
              : `Pick up where you left off in room ${mostRecent.code}.`
            : 'Start a session to make this your dashboard resume surface.'
        }
        minHeight={320}
      >
        {mostRecent ? (
          <CardWell className="mt-2 flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-md border bg-card px-2.5 py-1 font-mono text-sm font-semibold text-foreground">
                <Tv className="size-3.5 text-primary" />
                {mostRecent.code}
              </span>
              {mostRecent.is_playing ? (
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
                {mostRecent.source_type
                  ? mostRecent.source_type.charAt(0).toUpperCase() + mostRecent.source_type.slice(1)
                  : 'No media queued yet'}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {mostRecent.source_ref ?? 'Queue something to start playback'}
              </p>
            </div>

            <Button asChild className="mt-auto w-full justify-center gap-2">
              <Link href={lastRoomUrl}>
                {mostRecent.is_playing ? (
                  <span className="inline-flex items-center gap-2">
                    <Play className="size-4" />
                    Resume live session
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <ArrowUpRight className="size-4" />
                    Open room
                  </span>
                )}
              </Link>
            </Button>
          </CardWell>
        ) : (
          <CardWell
            padding="lg"
            className="mt-2 flex flex-1 flex-col items-center justify-center gap-3 text-center"
          >
            <IconBadge aria-hidden tone="raised" size="lg" radius="xl">
              <Play />
            </IconBadge>
            <div className="space-y-1">
              <p className="type-heading font-semibold text-foreground">Ready when you are</p>
              <p className="text-xs text-muted-foreground">
                Host a session or join a friend&apos;s code on the left
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={'/watch' as Route}>
                Browse watch tools
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardWell>
        )}
      </BentoGridItem>

      {/* METRIC - Recent rooms count */}
      <BentoGridItem
        tier="metric"
        interactive={false}
        icon={<Tv className="size-4" />}
        title={String(totalRooms)}
        description={totalRooms === 0 ? 'No rooms yet' : 'Recent rooms'}
        ariaLabel={`${totalRooms} recent watch rooms`}
      >
        <div className="mt-auto flex items-center justify-between gap-2">
          <Badge tone={totalRooms > 0 ? 'primary' : 'neutral'}>
            {totalRooms > 0 ? 'In your library' : 'Start one today'}
          </Badge>
          <Button asChild variant="ghost" size="xs" className="gap-1 px-2 text-primary">
            <Link href={'/watch' as Route}>
              Browse
              <ArrowUpRight className="size-3" />
            </Link>
          </Button>
        </div>
      </BentoGridItem>

      {/* METRIC - Active sessions */}
      <BentoGridItem
        tier="metric"
        interactive={false}
        icon={<Users className="size-4" />}
        title={String(playingCount)}
        description={playingCount === 0 ? 'No live sessions' : 'Live right now'}
        ariaLabel={`${playingCount} active playing rooms`}
      >
        <div className="mt-auto flex items-center gap-2">
          <Badge tone={playingCount > 0 ? 'success' : 'neutral'} pulse={playingCount > 0}>
            {playingCount > 0 ? 'Sync engaged' : 'Quiet'}
          </Badge>
        </div>
      </BentoGridItem>

      {/* METRIC - Today tasks */}
      <TasksMetricContent />

      {/* METRIC - Personalize (accent-aware) */}
      <PersonalizeMetric />
    </BentoGrid>
  );
}

export function DashboardBentoSkeleton() {
  return (
    <BentoGrid>
      {[0, 1].map((idx) => (
        <BentoGridItem key={idx} tier="hero" loading interactive={false} minHeight={320} />
      ))}
      {[0, 1, 2, 3].map((idx) => (
        <BentoGridItem key={`m-${idx}`} tier="metric" loading interactive={false} />
      ))}
    </BentoGrid>
  );
}
