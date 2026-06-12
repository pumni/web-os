"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Palette, Settings, User } from "lucide-react";

import { Dock, DockItem } from "@pumni/ui";

const dockItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/account", label: "Account", icon: Settings },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
] as const;

export function DashboardDock() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 flex justify-center px-4"
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))", zIndex: "var(--z-dock)" }}
    >
      <Dock className="pointer-events-auto">
        {dockItems.map((item) => {
          const Icon = item.icon;
          return (
            <DockItem
              key={item.href}
              label={item.label}
              active={pathname === item.href}
              onClick={() => router.push(item.href)}
            >
              <Icon />
            </DockItem>
          );
        })}
      </Dock>
    </div>
  );
}
