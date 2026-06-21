'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useActiveSection } from '@/shared/hooks/use-active-section';

import {
  CommandIcon,
  UserIcon,
  SettingsIcon,
  CheckCircle2Icon,
  PanelRightIcon,
} from 'lucide-react';
import {
  Button,
  CommandPalette,
  type CommandItem,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
  Skeleton,
  Switch,
} from '@pumni/ui';

// Subcomponents
import { ShowcaseSidebar, SHOWCASE_SECTION_IDS } from './showcase-sidebar';
import { ShowcaseHeader } from './showcase-header';
import { FoundationsSection } from './foundations-section';
import { ControlsSection } from './controls-section';
import { SurfacesSection } from './surfaces-section';
import { OverlaysSection } from './overlays-section';
import { FeedbackSection } from './feedback-section';
import { IdentitySection } from './identity-section';
import { MotionSection } from './motion-section';
import { BentoSection } from './bento-section';
import { CardsSection } from './cards-section';

const commandItems: CommandItem[] = [
  {
    id: 'open-dashboard',
    label: 'Open dashboard',
    keywords: 'home overview',
    icon: <CommandIcon className="size-4" />,
    shortcut: 'D',
    onSelect: () => toast.info('Dashboard command selected.'),
  },
  {
    id: 'invite-member',
    label: 'Invite member',
    keywords: 'team email',
    icon: <UserIcon className="size-4" />,
    shortcut: 'I',
    onSelect: () => toast.success('Invite command selected.'),
  },
  {
    id: 'system-settings',
    label: 'System settings',
    keywords: 'preferences controls',
    icon: <SettingsIcon className="size-4" />,
    shortcut: 'S',
    onSelect: () => toast.info('Settings command selected.'),
  },
];

export function DesignSystemShowcase() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [previewContrast, setPreviewContrast] = React.useState<'standard' | 'more'>('standard');

  const activeSection = useActiveSection(SHOWCASE_SECTION_IDS);

  return (
    <div className="flex gap-10 pb-16">
      <ShowcaseSidebar activeSection={activeSection} />

      <div className="min-w-0 flex-1 space-y-12">
        <ShowcaseHeader onOpenCommand={() => setCommandOpen(true)} />

        <FoundationsSection
          previewContrast={previewContrast}
          setPreviewContrast={setPreviewContrast}
        />

        <ControlsSection />

        <SurfacesSection
          previewContrast={previewContrast}
          setPreviewContrast={setPreviewContrast}
        />

        <OverlaysSection
          onOpenDialog={() => setDialogOpen(true)}
          onOpenSheet={() => setSheetOpen(true)}
        />

        <FeedbackSection />

        <IdentitySection />

        <MotionSection />

        <BentoSection />

        <CardsSection />
      </div>

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
            {/* Z-index layering demo */}
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

      {/* COMMAND PALETTE PORTAL */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={commandItems} />
    </div>
  );
}
