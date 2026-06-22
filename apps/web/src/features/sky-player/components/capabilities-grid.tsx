'use client';

import { CardSpotlight, CardHeader, CardTitle, CardDescription, CardWell, IconBadge } from '@pumni/ui/layout';
import { motion, useReducedMotion } from '@pumni/ui/lib/motion-primitives';
import { recipes } from '@pumni/ui/lib/motion';
import { cn } from '@pumni/ui/lib/cn';

import { CAPABILITIES, type Capability } from '../content';

// fallow-ignore-next-line complexity
function CapabilityCard({
  cap,
  isFeatured,
  shouldReduce,
  layoutClass,
}: {
  cap: Capability;
  isFeatured: boolean;
  shouldReduce: boolean | null;
  layoutClass: string;
}) {
  const Icon = cap.icon;

  return (
    <motion.div
      key={cap.title}
      {...(shouldReduce ? {} : recipes.staggerItem)}
      className={layoutClass}
    >
      <CardSpotlight interactive className="h-full">
        <CardHeader className={cn('gap-4', isFeatured && 'lg:flex-row lg:items-start')}>
          <IconBadge tone="primary-soft" size={isFeatured ? 'lg' : 'md'} radius="xl" aria-hidden>
            <Icon />
          </IconBadge>

          <div className="min-w-0 space-y-2">
            <CardTitle
              className={cn('font-semibold tracking-tight', isFeatured ? 'text-xl' : 'text-base')}
            >
              {cap.title}
            </CardTitle>
            <CardDescription className="type-body leading-relaxed text-muted-foreground">
              {cap.description}
            </CardDescription>

            {isFeatured && (
              <CardWell
                radius="lg"
                padding="none"
                className="mt-4 flex items-center gap-1.5 px-3 py-2"
              >
                <span className="font-mono text-xs text-muted-foreground">{'> '}</span>
                <span className="font-mono text-xs text-foreground">
                  dawn sky cotl
                  <span className="text-primary motion-safe:animate-pulse">_</span>
                </span>
              </CardWell>
            )}
          </div>
        </CardHeader>
      </CardSpotlight>
    </motion.div>
  );
}

export function CapabilitiesGrid() {
  const shouldReduce = useReducedMotion();

  // Layout map matching the plan diagram:
  // Row 1: Fuzzy Search (col-span-7) | Command Palette (col-span-5)
  // Row 2: Playback Controls (col-span-5) | Drop-in Library (col-span-7)
  const layoutMap = [
    'lg:col-span-7', // 0 — Fuzzy Search: featured left 2/3
    'lg:col-span-5', // 1 — Command Palette: right 1/3
    'lg:col-span-5', // 2 — Playback Controls: left 5/12
    'lg:col-span-7', // 3 — Drop-in Library: right 7/12
  ];

  return (
    <motion.div
      {...(shouldReduce ? {} : recipes.staggerContainer)}
      className="grid gap-4 lg:grid-cols-12"
    >
      {CAPABILITIES.map((cap, index) => (
        <CapabilityCard
          key={cap.title}
          cap={cap}
          isFeatured={index === 0}
          shouldReduce={shouldReduce}
          layoutClass={layoutMap[index] ?? 'lg:col-span-6'}
        />
      ))}
    </motion.div>
  );
}
