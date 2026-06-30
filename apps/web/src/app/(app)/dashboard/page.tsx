import { Suspense } from 'react';
import type { Metadata } from 'next';

import { requireUser } from '@pumni/auth';

import { DashboardBento, DashboardBentoSkeleton } from './dashboard-bento';
import { DashboardDock } from './dashboard-dock';
import { DashboardHeaderCard } from './dashboard-header-card';
import { RecentRoomsCard, getRecentRooms, type Room } from '@/features/watch';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Resume your watch rooms, start new sessions, and stay on top of your day.',
};

async function BentoSection({ recentRooms }: { recentRooms: Room[] }) {
  return <DashboardBento recentRooms={recentRooms} />;
}

async function RecentRoomsSection({ recentRooms }: { recentRooms: Room[] }) {
  return <RecentRoomsCard rooms={recentRooms} maxRooms={4} />;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const recentRooms = await getRecentRooms(user.id, 5);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-28">
      <DashboardHeaderCard user={user} />

      <Suspense fallback={<DashboardBentoSkeleton />}>
        <BentoSection recentRooms={recentRooms} />
     </Suspense>

      <Suspense fallback={<div className="h-52.5 w-full animate-pulse rounded-xl bg-muted/40" />}>
        <section aria-labelledby="dashboard-recent-rooms" className="space-y-1">
          <h2
            id="dashboard-recent-rooms"
            className="type-heading text-foreground"
          >
            Recent rooms
         </h2>
          <RecentRoomsSection recentRooms={recentRooms} />
       </section>
     </Suspense>

      <DashboardDock />
  </div>
  );
}
