import type { User } from "@supabase/supabase-js";
import { OsCommand } from "./os-command";
import { UserMenu } from "./user-menu";

type AppTopbarProps = {
  user: User;
};

export function AppTopbar({ user }: AppTopbarProps) {
  return (
    <header className="glass-bar sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle will reside here */}
        <div className="lg:hidden font-bold text-lg">Pumni Web OS</div>
        <OsCommand />
      </div>
      <div className="flex items-center gap-4">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
