'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@pumni/ui';
import { cn } from '@/shared/lib/utils';
import { useAppUiStore } from '@/shared/stores/app-ui-store';

import { navItems } from './nav-items';

/**
 * Off-canvas navigation for small screens. Controlled by the shared UI store so
 * the topbar hamburger can open it; closes on selection, overlay click, or Esc.
 */
export function MobileNav() {
  const pathname = usePathname();
  const isOpen = useAppUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppUiStore((state) => state.setSidebarOpen);
  const closeSidebar = useAppUiStore((state) => state.closeSidebar);

  return (
    <Sheet open={isOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-72 gap-0 p-0 lg:hidden">
        <SheetHeader className="h-16 justify-center border-b border-border">
          <SheetTitle className="text-lg tracking-tight">Pumni Web OS</SheetTitle>
        </SheetHeader>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
