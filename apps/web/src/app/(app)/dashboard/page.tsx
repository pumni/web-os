import { requireUser } from '@pumni/auth';
import Link from 'next/link';
import { GitFork } from 'lucide-react';

import { BentoGrid, BentoGridItem, Button } from '@pumni/ui';

import { DashboardAccentCard } from './dashboard-accent-card';
import { DashboardClockCard } from './dashboard-clock-card';
import { DashboardDock } from './dashboard-dock';
import { DashboardProfileCard } from './dashboard-profile-card';
import { DashboardWatchCard } from './dashboard-watch-card';
import { tiles } from './dashboard-meta';
import { QuickActions } from './quick-actions';
import { PreviewWindow } from '@/features/sky-player/preview-window';
import { Kbd } from '@/components/kbd';

/**
 * Desktop Bento math (12-col grid):
 *
 *   Rows 1–2: hero (6×2, left)  |  sky-player (6×2, right)
 *   Row    3: clock(3) | accent(3) | profile(3) | watch(3)
 *
 * Tile sums = 12 cols per row, no wrapping.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const tileById = new Map(tiles.map((tile) => [tile.id, tile]));

  const hero = tileById.get('hero')!;
  const clock = tileById.get('clock')!;
  const accent = tileById.get('accent')!;
  const skyPlayer = tileById.get('sky-player')!;
  const profile = tileById.get('profile')!;
  const watch = tileById.get('watch')!;

  const HeroIcon = hero.icon!;
  const ClockIcon = clock.icon!;
  const AccentIcon = accent.icon!;
  const SkyPlayerIcon = skyPlayer.icon!;
  const ProfileIcon = profile.icon!;
  const WatchIcon = watch.icon!;

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

        {/* Rows 1–2: hero deck (left). Vertical air below the CTA row is
            filled with a brand-gradient glow to keep the tile anchored without
            adding slop. The decorative layer is aria-hidden so it never reaches
            assistive tech. */}
        <BentoGridItem
          tier={hero.tier}
          minHeight={hero.minHeight}
          icon={<HeroIcon className="size-5" />}
          title={hero.title}
          description="Token-first design system: OKLCH color roles, shared @pumni/ui primitives, accessible surfaces."
          interactive={false}
          className="overflow-hidden"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent"
          />
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="sm">
              <Link href="/design-system">Open Design System</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a
                href="https://github.com/pumni/Sky-Player"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5"
              >
                <GitFork className="size-4" aria-hidden />
                <span>GitHub repository</span>
              </a>
            </Button>
            <div className="flex items-center gap-2 type-caption text-muted-foreground">
              <Kbd>⌘K</Kbd>
              <span>opens the command palette</span>
            </div>
          </div>
        </BentoGridItem>

        {/* Rows 1–2: Sky Player preview (right). The tile surface is opted out
            so the embedded `Window` glass isn't double-stacked under another
            Card. */}
        <BentoGridItem
          tier={skyPlayer.tier}
          minHeight={skyPlayer.minHeight}
          icon={<SkyPlayerIcon className="size-5" />}
          title={skyPlayer.title}
          description={skyPlayer.description}
          className="overflow-hidden border-0 bg-transparent p-0 shadow-none"
          interactive={false}
        >
          <PreviewWindow className="max-w-none w-full" showLearnMore />
        </BentoGridItem>

        {/* Row 3: clock */}
        <BentoGridItem
          tier={clock.tier}
          minHeight={clock.minHeight}
          icon={<ClockIcon className="size-5" />}
          title={clock.title}
          interactive
        >
          <DashboardClockCard />
        </BentoGridItem>

        {/* Row 3: accent */}
        <BentoGridItem
          tier={accent.tier}
          minHeight={accent.minHeight}
          icon={<AccentIcon className="size-5" />}
          title={accent.title}
          interactive
        >
          <DashboardAccentCard />
        </BentoGridItem>

        {/* Row 3: profile */}
        <BentoGridItem
          tier={profile.tier}
          minHeight={profile.minHeight}
          icon={<ProfileIcon className="size-5" />}
          title={profile.title}
          description="Avatar, display name and notification email."
          interactive
        >
          <DashboardProfileCard user={user} />
        </BentoGridItem>

        {/* Row 3: watch — idle, intentionally no `state="loading"` so the Card
            stays solid and never breathes. Recent-rooms data lands in Phase 2
            via a TanStack Query hook in `features/watch/`. */}
        <BentoGridItem
          tier={watch.tier}
          minHeight={watch.minHeight}
          icon={<WatchIcon className="size-5" />}
          title={watch.title}
          interactive
        >
          <DashboardWatchCard />
        </BentoGridItem>
      </BentoGrid>

      <QuickActions />

      <DashboardDock />
    </div>
  );
}
