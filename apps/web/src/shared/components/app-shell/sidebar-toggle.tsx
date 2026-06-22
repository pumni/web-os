'use client';

import { Menu } from 'lucide-react';
import { Button } from '@pumni/ui/form';
import { useAppUiStore } from '@/shared/stores/app-ui-store';

/** Topbar hamburger that opens the mobile drawer on small screens. */
export function SidebarToggle() {
  const openSidebar = useAppUiStore((state) => state.openSidebar);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={openSidebar}
      aria-label="Mở menu điều hướng"
    >
      <Menu className="size-5" />
    </Button>
  );
}
