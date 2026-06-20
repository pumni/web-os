import type { User } from '@supabase/supabase-js';
import { OsCommand } from './os-command';
import { SidebarToggle } from './sidebar-toggle';
import { UserMenu } from './user-menu';

type AppTopbarProps = {
  user: User;
};

export function AppTopbar({ user }: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-topbar flex h-16 shrink-0 items-center justify-between glass-bar-edge-b px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 sm:gap-4">
        <SidebarToggle />
        <div className="text-lg font-bold lg:hidden">Pumni Web OS</div>
        <OsCommand />
      </div>
      <div className="flex items-center gap-4">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
