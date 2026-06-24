'use client';

import * as React from 'react';

import { cn } from '@pumni/ui/lib/cn';
import { withViewTransition } from '@pumni/ui/lib/view-transition';

import { useActiveSection } from '@/shared/hooks/use-active-section';

/**
 * SectionNav — sticky scroll-spy underline navigation.
 *
 * Renders a horizontal row of anchor links with a `border-b-2` active
 * underline indicator. Backed by `useActiveSection` (IntersectionObserver)
 * so the underline tracks the currently-visible section as the user scrolls.
 *
 * This is the **anchor-nav** pattern (scroll-spy `<a>` links), NOT the
 * Radix Tabs pattern. For underline tabs on Radix `Tabs`, use
 * `TabsList variant="underline"` from `@pumni/ui` instead.
 *
 * The underline class vocabulary intentionally mirrors the `underline`
 * variant of `TabsTrigger` so the visual language stays consistent.
 */
export interface SectionNavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SectionNavProps {
  /** The sections to track. `id` anchors to `#id`; `label` is the link text. */
  sections: readonly SectionNavItem[];
  /** Wrap scrollIntoView in the View Transitions API. Default: true. */
  viewTransition?: boolean;
  /** Outer wrapper className (for sticky positioning, negative margin, etc.). */
  className?: string;
  /** Inner nav className (for overflow-x, padding, etc.). */
  navClassName?: string;
  /** Per-link className (for font-size, gap, padding, etc.). */
  linkClassName?: string;
  /** Per-label className (e.g. `hidden sm:inline` to hide text on mobile). */
  labelClassName?: string;
}

export function SectionNav({
  sections,
  viewTransition = true,
  className,
  navClassName,
  linkClassName,
  labelClassName,
}: SectionNavProps) {
  const sectionIds = React.useMemo(() => sections.map((s) => s.id), [sections]);
  const activeSection = useActiveSection(sectionIds);

  const handleNav = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      e.preventDefault();
      const scroll = () =>
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      if (viewTransition) {
        withViewTransition(scroll, { type: 'card-crossfade' });
      } else {
        scroll();
      }
    },
    [viewTransition],
  );

  return (
    <div className={cn('sticky top-16 z-(--z-topbar) border-b border-border surface-base', className)}>
      <nav
        aria-label="Page sections"
        className={cn('flex scrollbar-none overflow-x-auto', navClassName)}
      >
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => handleNav(e, section.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-(--duration-base) ease-fluid focus-visible:outline-ring',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
                linkClassName,
              )}
            >
              {Icon && <Icon className="size-4 shrink-0" />}
              <span className={labelClassName}>{section.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
