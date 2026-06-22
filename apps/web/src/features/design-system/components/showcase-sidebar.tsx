import * as React from 'react';
import { cn } from '@pumni/ui/lib/cn';

export const SHOWCASE_SECTIONS = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'controls', label: 'Controls' },
  { id: 'surfaces-layout', label: 'Surfaces & Layout' },
  { id: 'overlays-menus', label: 'Overlays & Menus' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'identity-personalization', label: 'Identity & Personalization' },
  { id: 'motion', label: 'Motion' },
  { id: 'bento-grid', label: 'Bento Grid' },
  { id: 'card-states', label: 'Card States & Spotlight' },
] as const;

export const SHOWCASE_SECTION_IDS = SHOWCASE_SECTIONS.map((s) => s.id);

export function ShowcaseSidebar({ activeSection }: { activeSection: string | null }) {
  return (
    <aside className="hidden w-52 shrink-0 lg:block">
      <nav className="sticky top-24 space-y-0.5 pt-1">
        {SHOWCASE_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={cn(
              'block rounded-md px-3 py-1.5 text-sm transition-colors',
              activeSection === section.id
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
