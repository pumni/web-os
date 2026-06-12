import type { User } from "@supabase/supabase-js";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { DesktopBackground } from "./desktop-background";

type AppShellProps = Readonly<{
  user: User;
  children: React.ReactNode;
}>;

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="relative min-h-dvh">
      <DesktopBackground />
      <AppSidebar />
      <div className="relative z-10 lg:pl-64 flex flex-col min-h-dvh">
        <AppTopbar user={user} />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
