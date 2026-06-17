'use client';

import * as React from 'react';
import { BookOpen, Cpu, Zap, ShieldAlert, Globe } from 'lucide-react';
import { cn } from '@pumni/ui';
import { useActiveSection } from '@/hooks/use-active-section';

const ECOSYSTEM_SECTIONS = [
  { id: 'overview', label: 'Tổng Quan', icon: BookOpen },
  { id: 'architecture', label: 'Kiến Trúc Lõi', icon: Cpu },
  { id: 'performance', label: 'Hiệu Năng', icon: Zap },
  { id: 'security', label: 'Bảo Mật & Vận Hành', icon: ShieldAlert },
  { id: 'ecosystem', label: 'Hệ Sinh Thái', icon: Globe },
] as const;

export function SectionNav() {
  const sectionIds = React.useMemo(
    () => ECOSYSTEM_SECTIONS.map((s) => s.id),
    [],
  );
  const activeSection = useActiveSection(sectionIds);

  return (
    <div className="sticky top-16 z-[60] -mx-4 border-b border-border bg-background px-4 sm:-mx-6 sm:px-6">
      <nav
        aria-label="Page sections"
        className="flex overflow-x-auto scrollbar-none"
      >
        {ECOSYSTEM_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap focus-visible:outline-ring sm:px-5',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{section.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}