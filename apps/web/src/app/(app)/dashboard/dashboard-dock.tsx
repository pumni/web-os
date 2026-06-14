"use client";

import type { Route } from "next";
import type { ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Palette, Settings, User, Music } from "lucide-react";

import { Dock, DockItem, withViewTransition } from "@pumni/ui";

const dockItems: ReadonlyArray<{
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: LayoutDashboard },
  { href: "/sky-player" as Route, label: "Sky Player", icon: Music },
  { href: "/settings/profile" as Route, label: "Profile", icon: User },
  { href: "/settings/account" as Route, label: "Account", icon: Settings },
  { href: "/settings/appearance" as Route, label: "Appearance", icon: Palette },
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
              onClick={() => withViewTransition(() => router.push(item.href))}
            >
              <Icon />
            </DockItem>
          );
        })}
      </Dock>
    </div>
  );
}
