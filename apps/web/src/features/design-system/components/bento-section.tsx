import * as React from 'react';
import {
  UserIcon,
  SettingsIcon,
  CheckCircle2Icon,
  BellIcon,
  MoonIcon,
  SunIcon,
  PlusIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import { BentoGrid, BentoGridItem, Skeleton } from '@pumni/ui';
import { ShowcaseSection } from './showcase-section';

export function BentoSection() {
  return (
    <ShowcaseSection
      title="Bento Grid (12-col)"
      id="bento-grid"
      description="Mathematical 12-column grid with tier-based spans (hero/feature/metric/accent/full). `rowHeight` fixes the row track so row-span-2 tiers read as exactly twice a metric — the proportional ratios that make a real bento. Visual contract: Playwright snapshots this section."
    >
      <BentoGrid id="bento-showcase" rowHeight={110} dense>
        {/* HERO tier: col-span-6 row-span-2 (desktop), col-span-12 (tablet).
            With rowHeight=110 the 2-row span fixes the tile at 220px — no
            minHeight needed; the math owns the height. */}
        <BentoGridItem
          tier="hero"
          ariaLabel="142k active users this month"
          icon={<UserIcon className="size-4" />}
          title="142k"
          description="Active users this month — hero KPI tile"
        >
          <div className="flex flex-1 items-end">
            <div className="flex h-16 w-full items-end gap-1">
              {[40, 55, 38, 72, 60, 85, 78].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-primary/20"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </BentoGridItem>

        {/* FEATURE tier: col-span-4 row-span-2 (desktop), col-span-6 (tablet) */}
        <BentoGridItem
          tier="feature"
          icon={<SettingsIcon className="size-4" />}
          title="System Health"
          description="Feature tile — chart / sparkline / donut"
        >
          <div className="flex flex-1 items-center justify-center">
            <div className="relative size-20">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="72 28"
                  className="text-primary"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                72%
              </span>
            </div>
          </div>
        </BentoGridItem>

        {/* METRIC tier: col-span-3 (desktop), col-span-3 (tablet) */}
        <BentoGridItem
          tier="metric"
          ariaLabel="98.7% uptime SLA"
          icon={<CheckCircle2Icon className="size-4" />}
          title="98.7%"
          description="Uptime SLA"
        />

        {/* METRIC tile: another KPI */}
        <BentoGridItem
          tier="metric"
          ariaLabel="3.4ms average API response time"
          icon={<BellIcon className="size-4" />}
          title="3.4ms"
          description="Avg. API response"
        />

        {/* METRIC tile: another KPI */}
        <BentoGridItem
          tier="metric"
          ariaLabel="24 active sessions"
          icon={<MoonIcon className="size-4" />}
          title="24"
          description="Active sessions"
        />

        {/* METRIC tile: another KPI */}
        <BentoGridItem
          tier="metric"
          ariaLabel="1.2GB memory used"
          icon={<SunIcon className="size-4" />}
          title="1.2GB"
          description="Memory used"
        />

        {/* ACCENT tier: col-span-2 (desktop), col-span-2 (tablet) */}
        <BentoGridItem
          tier="accent"
          icon={<PlusIcon className="size-4" />}
          title="Quick Add"
          description="CTA tile"
        />

        <BentoGridItem
          tier="accent"
          icon={<ExternalLinkIcon className="size-4" />}
          title="Export"
          description="Accent shortcut"
        />

        {/* FULL tier: col-span-12 (desktop), col-span-6 (tablet) */}
        <BentoGridItem
          tier="full"
          title="Activity Feed"
          description="Full-width tile — activity feed, data tables, high-density content"
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded-md" />
            ))}
          </div>
        </BentoGridItem>
      </BentoGrid>
    </ShowcaseSection>
  );
}
