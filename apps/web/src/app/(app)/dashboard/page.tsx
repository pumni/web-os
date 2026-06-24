import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';

import { requireUser } from '@pumni/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@pumni/ui/layout';

import { DailyPlanner } from './daily-planner';
import { DashboardBento, DashboardBentoSkeleton } from './dashboard-bento';
import { DashboardDock } from './dashboard-dock';
import { DashboardHeaderCard } from './dashboard-header-card';
import { RecentRoomsCard, getRecentRooms } from '@/features/watch';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Resume your watch rooms, start new sessions, and stay on top of your day.',
};

async function DashboardBentoSection({ userId }: { userId: string }) {
  const recentRooms = await getRecentRooms(userId, 5);
  return <DashboardBento recentRooms={recentRooms} />;
}

async function RecentRoomsSection({ userId }: { userId: string }) {
  const recentRooms = await getRecentRooms(userId, 5);
  return <RecentRoomsCard rooms={recentRooms} maxRooms={4} />;
}

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-28">
      <DashboardHeaderCard user={user} />

      <Suspense fallback={<DashboardBentoSkeleton />}>
        <DashboardBentoSection userId={user.id} />
      </Suspense>

      {/* Daily planner — local productivity streak */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <Sparkles className="size-4" />
            </span>
            <div className="space-y-0.5">
              <CardTitle>Workspace Planner</CardTitle>
              <CardDescription>
                A lightweight to-do list that lives in this browser only — keep momentum between
                sessions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DailyPlanner />
        </CardContent>
      </Card>

      {/* Recent Watch Rooms — glanceable grid + empty state */}
      <section aria-labelledby="recent-watch-rooms-heading" className="space-y-1">
        <h2 id="recent-watch-rooms-heading" className="sr-only">
          Recent Watch Rooms
        </h2>
        <Suspense fallback={<div className="h-[210px] w-full animate-pulse rounded-xl bg-muted/40" />}>
          <RecentRoomsSection userId={user.id} />
        </Suspense>
      </section>

      <DashboardDock />
    </div>
  );
}
