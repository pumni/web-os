import { requireUser } from '@pumni/auth';
import type { Route } from 'next';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Music } from 'lucide-react';

import { BentoGrid, BentoGridItem, Button } from '@pumni/ui';

import { getRecentRooms } from '@/features/watch/queries';
import { RecentRoomsCard } from '@/features/watch/components/recent-rooms-card';
import { PreviewWindow } from '@/features/sky-player/preview-window';
import { DashboardDock } from './dashboard-dock';
import { quickActions, tiles } from './dashboard-meta';
import { Kbd } from '@/components/kbd';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your personal entry point — start or join watch rooms and explore tools.',
};

/** Dashboard entry point. Layout (desktop 12-col):
 *
 *   Rows 1–2: hero (6×2, left)     |  sky-player (6×2, right)
 *   Row    3: recent rooms (12×1) full-width strip
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const recentRooms = await getRecentRooms(user.id, 5);

  const tileById = new Map(tiles.map((tile) => [tile.id, tile]));
  const hero = tileById.get('hero')!;
  const skyPlayer = tileById.get('sky-player')!;

  const HeroIcon = hero.icon!;

  return (
    <div className="space-y-6 pb-28">
      <header>
        <h1 className="text-gradient-brand text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="type-label font-medium text-muted-foreground">
          Welcome back, {user.email}.
        </p>
      </header>

      <BentoGrid aria-labelledby="dashboard-heading">
        <h2 id="dashboard-heading" className="sr-only">
          Dashboard tiles
        </h2>

        {/* Rows 1–2: hero deck (left) */}
        <BentoGridItem
          tier={hero.tier}
          minHeight={hero.minHeight}
          icon={<HeroIcon className="size-5" />}
          title="Welcome back"
          description="Start or join a watch room to get going."
          interactive={false}
          className="overflow-hidden"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent"
          />
          <div className="flex flex-col gap-4">
            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="sm">
                <Link href={"/watch" as Route}>Start a new room</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={"/watch" as Route}>Join with code</Link>
              </Button>
              <div className="flex items-center gap-2 type-caption text-muted-foreground">
                <Kbd>⌘K</Kbd>
                <span>opens the command palette</span>
              </div>
            </div>

            {/* Quick action chips */}
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button key={action.id} asChild variant="ghost" size="sm">
                    {action.external ? (
                      <a
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5"
                      >
                        <Icon className="size-3.5" />
                        <span>{action.label}</span>
                      </a>
                    ) : (
                      <Link href={action.href} className="inline-flex items-center gap-1.5">
                        <Icon className="size-3.5" />
                        <span>{action.label}</span>
                      </Link>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </BentoGridItem>

        {/* Rows 1–2: Sky Player showcase (right). The tile surface is opted out
            so the embedded `Window` glass isn't double-stacked under another Card. */}
        <BentoGridItem
          tier={skyPlayer.tier}
          minHeight={skyPlayer.minHeight}
          icon={<Music className="size-5" />}
          title={skyPlayer.title}
          description={skyPlayer.description}
          className="overflow-hidden border-0 bg-transparent p-0 shadow-none"
          interactive={false}
        >
          <PreviewWindow className="max-w-none w-full" showLearnMore />
        </BentoGridItem>
      </BentoGrid>

      {/* Recent Rooms full-width strip */}
      <section aria-labelledby="recent-rooms-heading">
        <h2 id="recent-rooms-heading" className="sr-only">
          Recent rooms
        </h2>
        <RecentRoomsCard rooms={recentRooms} />
      </section>

      <DashboardDock />
    </div>
  );
}
