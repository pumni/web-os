"use client";

import { Menu, PanelLeft } from "lucide-react";
import { Button } from "@pumni/ui";
import { useAppUiStore } from "@/stores/app-ui-store";

/**
 * Topbar controls: a hamburger that opens the mobile drawer (small screens) and
 * a panel button that collapses/expands the desktop rail.
 */
export function SidebarToggle() {
  const openSidebar = useAppUiStore((state) => state.openSidebar);
  const toggleCollapsed = useAppUiStore((state) => state.toggleSidebarCollapsed);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={openSidebar}
        aria-label="Mở menu điều hướng"
      >
        <Menu className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleCollapsed}
        aria-label="Thu gọn hoặc mở rộng thanh bên"
      >
        <PanelLeft className="size-4" />
      </Button>
    </>
  );
}
