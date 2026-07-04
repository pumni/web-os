'use client';

import { tabsListVariants, tabsTriggerVariants } from '@pumni/ui/layout';
import { cn } from '@pumni/ui/lib/cn';
import type { CommandItem } from '@pumni/ui/overlay';
import { CommandPalette } from '@pumni/ui/overlay';
import { CommandIcon, SettingsIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

// Subcomponents
import { ShowcaseHeader } from '@/features/design-system';

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

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = React.useState(false);

  return (
    <div className="space-y-8 pb-16">
      <ShowcaseHeader onOpenCommand={() => setCommandOpen(true)} />

      {/* Horizontal Navigation Tab Bar */}
      <nav className={cn(tabsListVariants, 'w-full justify-start')} aria-label="Design System Navigation">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-state={isActive ? 'active' : 'inactive'}
              className={cn(tabsTriggerVariants, 'flex-none px-6 py-4 text-base')}
            >
              {tab.label}
              {isActive && (
                <span className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Subpage content */}
      <div className="min-w-0 flex-1">{children}</div>

      {/* COMMAND PALETTE PORTAL */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={commandItems} />
    </div>
  );
}
