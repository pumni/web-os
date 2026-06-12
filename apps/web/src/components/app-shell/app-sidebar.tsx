"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, User, Settings, Palette, ComponentIcon } from "lucide-react";

const navItems: ReadonlyArray<{
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/account", label: "Account", icon: Settings },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/design-system" as Route, label: "Design System", icon: ComponentIcon },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-bar fixed inset-y-0 left-0 z-20 hidden w-64 border-r lg:block">
      <div className="flex h-16 items-center border-b border-border px-6 font-bold text-lg tracking-tight text-foreground">
        Pumni Web OS
      </div>

      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
