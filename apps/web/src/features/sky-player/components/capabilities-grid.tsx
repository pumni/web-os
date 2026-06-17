'use client';

import {
  CardSpotlight,
  CardHeader,
  CardTitle,
  CardDescription,
  motion,
  recipes,
  useReducedMotion,
  cn,
} from '@pumni/ui';

import { CAPABILITIES, type Capability } from '../content';

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
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary',
              isFeatured ? 'size-12' : 'size-10',
            )}
          >
            <Icon className={cn(isFeatured ? 'size-6' : 'size-5')} aria-hidden />
          </div>

          <div className="min-w-0 space-y-2">
            <CardTitle
              className={cn(
                'font-semibold tracking-tight',
                isFeatured ? 'text-xl' : 'text-base',
              )}
            >
              {cap.title}
            </CardTitle>
            <CardDescription className="type-body text-muted-foreground leading-relaxed">
              {cap.description}
            </CardDescription>

            {isFeatured && (
              <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2">
                <span className="font-mono text-xs text-muted-foreground">{'> '}</span>
                <span className="font-mono text-xs text-foreground">
                  dawn sky cotl
                  <span className="motion-safe:animate-pulse text-primary">_</span>
                </span>
              </div>
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
