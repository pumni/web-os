import type { User } from '@supabase/supabase-js';
import { ClockWidget } from './clock-widget';
import { OsCommand } from './os-command';
import { SidebarToggle } from './sidebar-toggle';
import { UserMenu } from './user-menu';

type AppTopbarProps = {
  user: User;
};

export function AppTopbar({ user }: AppTopbarProps) {
  return (
    <header className="glass-bar-edge-b sticky top-0 z-topbar flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 sm:gap-4">
        <SidebarToggle />
        <div className="lg:hidden font-bold text-lg">Pumni Web OS</div>
        <OsCommand />
      </div>
      <div className="flex items-center gap-4">
        <ClockWidget />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
