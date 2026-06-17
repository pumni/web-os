'use client';

import * as React from 'react';

import { cn, withViewTransition } from '@pumni/ui';

import { PAGE_SECTIONS } from '../content';

function useActiveSection() {
  const [activeId, setActiveId] = React.useState<string>(PAGE_SECTIONS[0]?.id ?? 'capabilities');

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );

    const elements = PAGE_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    for (const el of elements) observer.observe(el!);

    return () => observer.disconnect();
  }, []);

  return activeId;
}

export function SectionNav() {
  const activeSection = useActiveSection();

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
