import type { Route } from "next";
import type { ComponentType } from "react";
import { ComponentIcon, LayoutDashboard, Music, Palette, Settings, User } from "lucide-react";

export type NavItem = {
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

/** Single source of nav entries, shared by the desktop rail and mobile drawer. */
export const navItems: ReadonlyArray<NavItem> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sky-player" as Route, label: "Sky Player", icon: Music },
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/account", label: "Account", icon: Settings },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/design-system" as Route, label: "Design System", icon: ComponentIcon },
] as const;
