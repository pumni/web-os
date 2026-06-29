'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { CheckCircle2Icon, PanelRightIcon } from 'lucide-react';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@pumni/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@pumni/ui/overlay';
import { Skeleton } from '@pumni/ui/feedback';

// Subcomponents
import { ControlsSection } from '@/features/design-system/components/controls-section';
import { SurfacesSection } from '@/features/design-system/components/surfaces-section';
import { OverlaysSection } from '@/features/design-system/components/overlays-section';
import { FeedbackSection } from '@/features/design-system/components/feedback-section';
import { BentoSection } from '@/features/design-system/components/bento-section';
import { CardsSection } from '@/features/design-system/components/cards-section';

export default function ComponentsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <div className="space-y-12">
      <ControlsSection />

      <SurfacesSection />

      <OverlaysSection
        onOpenDialog={() => setDialogOpen(true)}
        onOpenSheet={() => setSheetOpen(true)}
      />

      <FeedbackSection />

      <BentoSection />

      <CardsSection />

      {/* OVERLAY DIALOG PORTAL */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CheckCircle2Icon className="size-5" />
            </div>
            <DialogTitle className="text-xl">Overlay Dialog Surface</DialogTitle>
            <DialogDescription className="max-w-md leading-relaxed">
              Provides modal containment, focus trapping, and backdrop overlay rendering.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5 text-sm text-muted-foreground">
            <p>This dialog overlay uses a translucent panel with built-in close action hooks.</p>
            <div className="space-y-1.5">
              <Label
                htmlFor="dialog-priority-select"
                className="text-xs font-medium text-foreground"
              >
                Priority (z-index layering demo)
              </Label>
              <Select>
                <SelectTrigger id="dialog-priority-select" className="w-full">
                  <SelectValue placeholder="Select priority…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Dropdown must appear above this dialog panel (z-popover 1050 &gt; z-modal 1000).
              </p>
            </div>
            <Skeleton className="h-4 w-4/5" />
          </div>
          <DialogFooter className="border-t bg-muted/40 px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                toast.success('Action confirmed.');
                setDialogOpen(false);
              }}
            >
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OVERLAY SHEET PORTAL */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col justify-between sm:max-w-md">
          <div>
            <SheetHeader className="border-b pb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <PanelRightIcon className="size-5" />
              </div>
              <SheetTitle className="text-lg">Overlay Side Sheet</SheetTitle>
              <SheetDescription className="leading-relaxed">
                Sliding lateral portal for contextual preferences or filters.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-6">
              <span className="block text-xs font-semibold text-muted-foreground">
                Scope Settings
              </span>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sheet-update">Auto-Sync</Label>
                  <Switch id="sheet-update" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sheet-developer">Developer Tools</Label>
                  <Switch id="sheet-developer" />
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="border-t pt-4">
            <SheetClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </SheetClose>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                toast.success('Settings applied.');
                setSheetOpen(false);
              }}
            >
              Apply
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
