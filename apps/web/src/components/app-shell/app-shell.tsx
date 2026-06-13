import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { AppMain } from "./app-main";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { DesktopBackground } from "./desktop-background";
import { MobileNav } from "./mobile-nav";
import { SIDEBAR_COOKIE } from "./sidebar-config";

type AppShellProps = Readonly<{
  user: User;
  children: React.ReactNode;
}>;

export async function AppShell({ user, children }: AppShellProps) {
  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <div className="relative min-h-dvh">
      <DesktopBackground />
      <AppSidebar defaultCollapsed={defaultCollapsed} />
      <MobileNav />
      <AppMain defaultCollapsed={defaultCollapsed} topbar={<AppTopbar user={user} />}>
        {children}
      </AppMain>
    </div>
  );
}
