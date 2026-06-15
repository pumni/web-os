'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@pumni/ui';
import { cn } from '@/lib/utils';
import { useAppUiStore, useSidebarCollapsed } from '@/stores/app-ui-store';
import { navItems } from './nav-items';
import { SIDEBAR_WIDTH } from './sidebar-config';

type AppSidebarProps = Readonly<{ defaultCollapsed: boolean }>;

/** Platform-aware modifier label for the keyboard hint. */
function modKey(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return /mac|iphone|ipad/i.test(navigator.userAgent) ? '⌘' : 'Ctrl';
}

export function AppSidebar({ defaultCollapsed }: AppSidebarProps) {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed(defaultCollapsed);
  const toggleCollapsed = useAppUiStore((state) => state.toggleSidebarCollapsed);

  // Ctrl/Cmd+B toggles the rail, matching the convention in VS Code / Linear.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleCollapsed]);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'glass-bar-edge-r fixed inset-y-0 left-0 z-sidebar hidden transition-[width] duration-300 ease-out lg:block',
          collapsed ? SIDEBAR_WIDTH.collapsed.rail : SIDEBAR_WIDTH.expanded.rail,
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center',
            collapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          {!collapsed && (
            <span className="truncate font-bold text-lg tracking-tight text-foreground">
              Pumni Web OS
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
                aria-pressed={collapsed}
              >
                {collapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {collapsed ? 'Mở rộng' : 'Thu gọn'}
              <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 font-mono text-[0.7rem] text-muted-foreground">
                {modKey()} B
              </kbd>
            </TooltipContent>
          </Tooltip>
        </div>
        <div
          aria-hidden
          className="mx-auto h-px bg-linear-to-r from-transparent via-glass-border/20 to-transparent"
        />

        <nav className={cn('space-y-1 p-3', !collapsed && 'px-4')}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const link = (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  'flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2' : 'px-3',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
