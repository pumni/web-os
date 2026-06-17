'use client';

import * as React from 'react';

import { cn, withViewTransition } from '@pumni/ui';

import { useActiveSection } from '@/hooks/use-active-section';
import { PAGE_SECTIONS } from '../content';

const PAGE_SECTION_IDS = PAGE_SECTIONS.map((s) => s.id);

export function SectionNav() {
  const activeSection = useActiveSection(PAGE_SECTION_IDS);

  return (
    <div className="sticky top-16 z-[60] border-b border-border bg-background">
      <nav
        aria-label="Page sections"
        className="flex overflow-x-auto"
      >
        {PAGE_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(e) => {
              e.preventDefault();
              withViewTransition(() => {
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
              });
            }}
            className={cn(
              'shrink-0 border-b-2 px-5 py-3.5 text-sm font-medium transition-colors duration-(--duration-base) ease-fluid whitespace-nowrap focus-visible:outline-ring',
              activeSection === section.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
