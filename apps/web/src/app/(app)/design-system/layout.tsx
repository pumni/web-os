'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { CommandIcon, UserIcon, SettingsIcon } from 'lucide-react';
import { CommandPalette } from '@pumni/ui/overlay';
import type { CommandItem } from '@pumni/ui/overlay';
import { cn } from '@pumni/ui/lib/cn';

// Subcomponents
import { ShowcaseHeader } from '@/features/design-system/components/showcase-header';

const commandItems: CommandItem[] = [
  {
    id: 'open-dashboard',
    label: 'Open dashboard',
    keywords: 'home overview',
    icon: <CommandIcon className="size-4" />,
    shortcut: 'D',
    onSelect: () => toast.info('Dashboard command selected.'),
  },
  {
    id: 'invite-member',
    label: 'Invite member',
    keywords: 'team email',
    icon: <UserIcon className="size-4" />,
    shortcut: 'I',
    onSelect: () => toast.success('Invite command selected.'),
  },
  {
    id: 'system-settings',
    label: 'System settings',
    keywords: 'preferences controls',
    icon: <SettingsIcon className="size-4" />,
    shortcut: 'S',
    onSelect: () => toast.info('Settings command selected.'),
  },
];

const TABS = [
  { href: '/design-system/tokens', label: 'Tokens & Foundations' },
  { href: '/design-system/components', label: 'Component Library' },
  { href: '/design-system/motion', label: 'Animation & Motion' },
  { href: '/design-system/apca', label: 'APCA & Contrast' },
] as const;

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = React.useState(false);

  return (
    <div className="space-y-8 pb-16">
      <ShowcaseHeader onOpenCommand={() => setCommandOpen(true)} />

      {/* Premium Horizontal Navigation Tab Bar */}
      <div className="border-b border-border">
        <nav className="flex gap-1" aria-label="Design System Navigation">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'relative px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-(--duration-base) ease-fluid outline-hidden',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground state-hover'
                )}
              >
                {tab.label}
                {isActive && (
                  <span
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-primary"
                    style={{ viewTransitionName: 'active-ds-tab' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Subpage content */}
      <div className="min-w-0 flex-1">
        {children}
      </div>

      {/* COMMAND PALETTE PORTAL */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={commandItems} />
    </div>
  );
}
