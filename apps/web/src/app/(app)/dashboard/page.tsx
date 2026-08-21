import { Suspense } from 'react';
import type { Metadata } from 'next';

import { requireUser } from '@pumni/auth';

import { DashboardBento, DashboardBentoSkeleton } from './dashboard-bento';
import { DashboardDock } from './dashboard-dock';
import { DashboardHeaderCard } from './dashboard-header-card';
import { getRecentRooms } from '@/features/watch';
import { RecentRoomsCard } from '@/features/watch/client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Resume your watch rooms, start new sessions, and stay on top of your day.',
};

/**
 * Dynamic data island: the recent-rooms read lives *inside* the Suspense
 * boundary so the page's static-ish shell (header + dock) streams immediately
 * and this section fills in behind a real skeleton, instead of the whole page
 * blocking on the await. `getRecentRooms` is `'use cache'`, so the single read
 * feeds both the bento and the list without a second round-trip.
 */
async function DashboardRooms({ userId }: { userId: string }) {
  const recentRooms = await getRecentRooms(userId, 5);

  return (
    <>
      <DashboardBento recentRooms={recentRooms} />

      <section aria-labelledby="dashboard-recent-rooms" className="space-y-1">
        <h2 id="dashboard-recent-rooms" className="type-heading text-foreground">
          Recent rooms
        </h2>
        <RecentRoomsCard rooms={recentRooms} maxRooms={4} />
      </section>
    </>
  );
}

function DashboardRoomsSkeleton() {
  return (
    <>
      <DashboardBentoSkeleton />
      <div className="h-52.5 w-full animate-pulse rounded-xl bg-muted/40" />
    </>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-28">
      <DashboardHeaderCard user={user} />

      <Suspense fallback={<DashboardRoomsSkeleton />}>
        <DashboardRooms userId={user.id} />
      </Suspense>

      <DashboardDock />
    </div>
  );
}
