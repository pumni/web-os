import * as React from 'react';
import { toast } from 'sonner';
import {
  ExternalLinkIcon,
  UserIcon,
  SettingsIcon,
  PanelRightIcon,
  TrashIcon,
  PlusIcon,
} from 'lucide-react';
import { Button } from '@pumni/ui/form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@pumni/ui/layout';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@pumni/ui/overlay';
import { ShowcaseSection } from './showcase-section';

interface OverlaysSectionProps {
  onOpenDialog: () => void;
  onOpenSheet: () => void;
  onOpenAlertDialog: () => void;
}

export function OverlaysSection({
  onOpenDialog,
  onOpenSheet,
  onOpenAlertDialog,
}: OverlaysSectionProps) {
  const [dropdownCheckState, setDropdownCheckState] = React.useState({
    notifications: true,
    compact: false,
  });
  const [dropdownRadio, setDropdownRadio] = React.useState('comfortable');
  const [contextCheckState, setContextCheckState] = React.useState({
    showHidden: false,
    readOnly: true,
  });

  return (
    <ShowcaseSection
      id="overlays-menus"
      title="Overlays & Menus"
      description="Modals, dropdown context surfaces, command list triggers, tooltips, and floating popovers."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Dialog & Sheet Triggers */}
        <Card>
          <CardHeader>
            <CardTitle>Modals & Overlays</CardTitle>
            <CardDescription>Blocking and context dialog controls.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={onOpenDialog}>Trigger Dialog</Button>
            <Button variant="secondary" onClick={onOpenSheet}>
              <PanelRightIcon className="size-4" />
              Trigger Sheet
            </Button>
            <Button variant="destructive" onClick={onOpenAlertDialog}>
              <TrashIcon className="size-4" />
              Trigger Alert
            </Button>
          </CardContent>
        </Card>

        {/* Dropdowns & Context Menu */}
        <Card>
          <CardHeader>
            <CardTitle>Menus & Dropdowns</CardTitle>
            <CardDescription>Standard clickable lists and context actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" pressable={false} className="w-full justify-between">
                  Open Dropdown
                  <ExternalLinkIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Account Preferences</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Profile menu selected.')}>
                  <UserIcon className="size-4" />
                  User Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('Appearance settings opened.')}>
                  <SettingsIcon className="size-4" />
                  Appearance
                  <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={dropdownCheckState.notifications}
                  onCheckedChange={(checked) =>
                    setDropdownCheckState((s) => ({ ...s, notifications: checked }))
                  }
                >
                  Push Notifications
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={dropdownCheckState.compact}
                  onCheckedChange={(checked) =>
                    setDropdownCheckState((s) => ({ ...s, compact: checked }))
                  }
                >
                  Compact Mode
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Layout Density</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={dropdownRadio} onValueChange={setDropdownRadio}>
                  <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <PanelRightIcon className="size-4" />
                    Developer Tools
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => toast.info('Console opened.')}>
                      Toggle Console
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info('Inspector opened.')}>
                      Inspect Elements
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => toast.error('Account delete clicked.')}
                >
                  <TrashIcon className="size-4" />
                  Delete Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="flex h-20 w-full cursor-context-menu items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted/30">
                  Right-Click Area
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuLabel>Desktop Actions</ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => toast.info('Created folder.')}>
                  <PlusIcon className="size-4" />
                  New Folder
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => toast.success('Refreshed workspace.')}>
                  Refresh
                  <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuSub>
                  <ContextMenuSubTrigger>View Options</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    <ContextMenuCheckboxItem
                      checked={contextCheckState.showHidden}
                      onCheckedChange={(checked) =>
                        setContextCheckState((s) => ({ ...s, showHidden: checked }))
                      }
                    >
                      Show Hidden Files
                    </ContextMenuCheckboxItem>
                    <ContextMenuCheckboxItem
                      checked={contextCheckState.readOnly}
                      onCheckedChange={(checked) =>
                        setContextCheckState((s) => ({ ...s, readOnly: checked }))
                      }
                    >
                      Read-Only Mode
                    </ContextMenuCheckboxItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>Sort By</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-40">
                    <ContextMenuRadioGroup value={dropdownRadio} onValueChange={setDropdownRadio}>
                      <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
                      <ContextMenuRadioItem value="date">Date Modified</ContextMenuRadioItem>
                      <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
                    </ContextMenuRadioGroup>
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuItem
                  variant="destructive"
                  onSelect={() => toast.error('Cleaned workspace.')}
                >
                  <TrashIcon className="size-4" />
                  Clean Workspace
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </CardContent>
        </Card>

        {/* Tooltip & Popover */}
        <Card>
          <CardHeader>
            <CardTitle>Tooltips & Popovers</CardTitle>
            <CardDescription>Hover info cards and popover triggers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Translucent tooltip surface</TooltipContent>
            </Tooltip>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" pressable={false}>
                  Open Popover
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">System Notification</p>
                  <p className="text-xs text-muted-foreground">
                    This popover container is bound to the trigger using semantic overlay
                    constraints.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      </div>
    </ShowcaseSection>
  );
}
