import { requireUser } from '@pumni/auth';
import Link from 'next/link';
import { UserIcon, Tv, Sparkles } from 'lucide-react';

import { BentoGrid, BentoGridItem, Avatar, AvatarFallback, AvatarImage, Button } from '@pumni/ui';

import { DashboardClockCard } from './dashboard-clock-card';
import { DashboardAccentCard } from './dashboard-accent-card';
import { PreviewWindow } from '@/features/sky-player/preview-window';
import { DashboardDock } from './dashboard-dock';

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-gradient-brand text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground font-medium">Welcome back, {user.email}.</p>
      </div>

      <BentoGrid>
        {/* Card 1: Welcome & Info — hero (6 cols desktop, 6 cols tablet) */}
        <BentoGridItem
          tier="hero"
          icon={<Sparkles className="size-5" />}
          title="Welcome to Pumni OS"
          description="This desktop runs on Pumni's token-first design system: OKLCH color roles, shared @pumni/ui primitives, and accessible surfaces."
          interactive={false}
        >
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="sm">
              <a
                href="https://github.com/pumni/Sky-Player"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Repository
              </a>
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono select-none">
                ⌘K
              </kbd>
              <span>to open command palette</span>
            </div>
          </div>
        </BentoGridItem>

        {/* Card 2: System Time — metric (3 cols desktop, 3 cols tablet) */}
        <BentoGridItem tier="metric" interactive={true}>
          <DashboardClockCard />
        </BentoGridItem>

        {/* Card 3: Sky Player Controller — feature (4 cols / row-span-2) */}
        <BentoGridItem
          tier="feature"
          className="p-0 border-0 bg-transparent shadow-none"
          interactive={false}
        >
          <PreviewWindow className="max-w-none w-full" />
        </BentoGridItem>

        {/* Card 4: Accent personalizer — metric (3 cols desktop) */}
        <BentoGridItem tier="metric" interactive={true}>
          <DashboardAccentCard />
        </BentoGridItem>

        {/* Card 5: Profile quick summary — metric (3 cols) */}
        <BentoGridItem
          tier="metric"
          icon={<UserIcon className="size-5" />}
          title="User Profile"
          description={user.email}
          interactive={true}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-9 ring-1 ring-border">
                <AvatarImage src={user.user_metadata?.avatar_url ?? undefined} />
                <AvatarFallback className="font-semibold text-xs">
                  {user.email?.slice(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold text-foreground">Logged In</p>
                <p className="text-[9px] font-mono text-muted-foreground">
                  ID: {user.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="h-8 rounded-lg">
              <Link href="/settings/profile">Manage</Link>
            </Button>
          </div>
        </BentoGridItem>

        {/* Card 6: Watch Together — full (12 cols desktop, spans wide) */}
        <BentoGridItem
          tier="full"
          icon={<Tv className="size-5" />}
          title="Watch Together"
          description="Watch synchronized video loops together with friends in real-time."
          interactive={true}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-medium text-muted-foreground">Multiplayer lobby</span>
            <Button asChild size="sm" variant="outline" className="h-8 rounded-lg">
              <Link href="/watch">Join Room</Link>
            </Button>
          </div>
        </BentoGridItem>
      </BentoGrid>

      <DashboardDock />
    </div>
  );
}
