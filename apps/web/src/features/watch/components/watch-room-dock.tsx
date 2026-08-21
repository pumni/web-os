'use client';

import type { ComponentProps } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@pumni/ui/overlay';
import { cn } from '@pumni/ui/lib/cn';

import { SideDock } from './side-dock';

type SideDockProps = ComponentProps<typeof SideDock>;

interface WatchRoomDockProps extends SideDockProps {
  desktopOpen: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

/** Responsive shell that renders one SideDock contract on desktop and mobile. */
export function WatchRoomDock({
  desktopOpen,
  mobileOpen,
  onMobileOpenChange,
  ...sideDockProps
}: WatchRoomDockProps) {
  return (
    <>
      <div
        className={cn(
          'relative hidden min-h-0 min-w-0 shrink-0 overflow-hidden transition-all duration-(--duration-base) ease-fluid lg:block',
          desktopOpen
            ? 'w-80 opacity-100 lg:ml-4 lg:basis-80'
            : 'w-0 opacity-0 lg:ml-0 lg:basis-0',
        )}
      >
        <div className="relative h-full min-h-0 w-80">
          <SideDock {...sideDockProps} />
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col border-l border-border p-0 sm:max-w-md"
        >
          <SheetHeader className="shrink-0 border-b border-border p-4">
            <SheetTitle className="type-heading text-sm">Bảng điều khiển</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden p-2">
            <SideDock {...sideDockProps} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
