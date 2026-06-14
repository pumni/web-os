"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  BellIcon,
  CheckCircle2Icon,
  CommandIcon,
  ExternalLinkIcon,
  MoonIcon,
  PanelRightIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
  HelpCircleIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import {
  AnimatePresence,
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardFooter,
  Checkbox,
  CommandPalette,
  type CommandItem,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  Dock,
  DockItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  GlassSurface,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
  Skeleton,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Window,
  cn,
  motion,
  recipes,
  useReducedMotion,
  ACCENTS,
  GLASS_LEVELS,
  usePersonalization,
} from "@pumni/ui";

type DemoFormValues = {
  workspaceName: string;
  adminEmail: string;
};

const commandItems: CommandItem[] = [
  {
    id: "open-dashboard",
    label: "Open dashboard",
    keywords: "home overview",
    icon: <CommandIcon />,
    shortcut: "D",
    onSelect: () => toast.info("Dashboard command selected."),
  },
  {
    id: "invite-member",
    label: "Invite member",
    keywords: "team email",
    icon: <UserIcon />,
    shortcut: "I",
    onSelect: () => toast.success("Invite command selected."),
  },
  {
    id: "system-settings",
    label: "System settings",
    keywords: "preferences controls",
    icon: <SettingsIcon />,
    shortcut: "S",
    onSelect: () => toast.info("Settings command selected."),
  },
];

export function DesignSystemShowcase() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [motionWindowOpen, setMotionWindowOpen] = React.useState(true);
  const [staggerKey, setStaggerKey] = React.useState(0);
  const [sliderValue, setSliderValue] = React.useState([45]);
  const shouldReduceMotion = useReducedMotion();

  const { accent, glass, setAccent, setGlass } = usePersonalization();

  const [previewTransparency, setPreviewTransparency] = React.useState<"standard" | "reduced">(
    "standard",
  );
  const [previewContrast, setPreviewContrast] = React.useState<"standard" | "more">("standard");

  const form = useForm<DemoFormValues>({
    defaultValues: {
      workspaceName: "Pumni OS Catalog",
      adminEmail: "",
    },
  });

  return (
    <div className="space-y-12 pb-16">
      {/* HEADER */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Design System</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Token foundations, shared primitives, surfaces, motion, and personalization from{" "}
            <code className="text-foreground">@pumni/ui</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => toast.success("Notification toast triggered.")}>
            <BellIcon />
            Test Toast
          </Button>
          <Button variant="outline" onClick={() => setCommandOpen(true)}>
            <CommandIcon />
            Command Palette
          </Button>
        </div>
      </header>

      {/* 1. FOUNDATIONS */}
      <ShowcaseSection
        title="Foundations"
        description="Core design tokens: semantic colors, typography scale, radius knobs, elevation, and z-index layers."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Semantic Palette</CardTitle>
              <CardDescription>Theme-aware color roles consumed by UI components.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Swatch label="Background" className="bg-background text-foreground border border-border" />
              <Swatch label="Foreground" className="bg-foreground text-background" />
              <Swatch label="Card" className="bg-card text-card-foreground border border-border" />
              <Swatch label="Popover" className="bg-popover text-popover-foreground border border-border" />
              <Swatch label="Primary" className="bg-primary text-primary-foreground" />
              <Swatch label="Secondary" className="bg-secondary text-secondary-foreground" />
              <Swatch label="Muted" className="bg-muted text-muted-foreground" />
              <Swatch label="Accent" className="bg-accent text-accent-foreground" />
              <Swatch label="Success" className="bg-success text-success-foreground" />
              <Swatch label="Warning" className="bg-warning text-warning-foreground" />
              <Swatch label="Destructive" className="bg-destructive text-destructive-foreground" />
              <Swatch label="Border" className="bg-border text-foreground flex items-center justify-center text-xs" />
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography Scale</CardTitle>
              <CardDescription>Typography steps and paired line-heights.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between border-b pb-1.5">
                <span className="text-xs text-muted-foreground">Scale</span>
                <span className="text-xs text-muted-foreground">Example</span>
              </div>
              <div className="flex items-baseline justify-between"><span className="text-xs font-mono text-muted-foreground">text-4xl</span><span className="text-4xl font-bold tracking-tight">OS Title</span></div>
              <div className="flex items-baseline justify-between"><span className="text-xs font-mono text-muted-foreground">text-3xl</span><span className="text-3xl font-semibold">Section Header</span></div>
              <div className="flex items-baseline justify-between"><span className="text-xs font-mono text-muted-foreground">text-2xl</span><span className="text-2xl font-semibold">Sub-heading</span></div>
              <div className="flex items-baseline justify-between"><span className="text-xs font-mono text-muted-foreground">text-xl</span><span className="text-xl font-medium">Card Header</span></div>
              <div className="flex items-baseline justify-between"><span className="text-xs font-mono text-muted-foreground">text-lg</span><span className="text-lg font-medium">Lead text</span></div>
              <div className="flex items-baseline justify-between"><span className="text-xs font-mono text-muted-foreground">text-base</span><span className="text-base text-foreground">Body default</span></div>
              <div className="flex items-baseline justify-between"><span className="text-xs font-mono text-muted-foreground">text-sm</span><span className="text-sm text-muted-foreground">Subdued detail</span></div>
              <div className="flex items-baseline justify-between"><span className="text-xs font-mono text-muted-foreground">text-xs</span><span className="text-xs text-muted-foreground">Captions & labels</span></div>
            </CardContent>
          </Card>

          {/* Radius Scale */}
          <Card>
            <CardHeader>
              <CardTitle>Radius Scale</CardTitle>
              <CardDescription>Scale calculated dynamically off a single base knob.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <RadiusDemo label="rounded-xs" className="rounded-xs" />
              <RadiusDemo label="rounded-sm" className="rounded-sm" />
              <RadiusDemo label="rounded-md" className="rounded-md" />
              <RadiusDemo label="rounded-lg" className="rounded-lg" />
              <RadiusDemo label="rounded-xl" className="rounded-xl" />
              <RadiusDemo label="rounded-2xl" className="rounded-2xl" />
              <RadiusDemo label="rounded-3xl" className="rounded-3xl" />
              <RadiusDemo label="rounded-full" className="rounded-full" />
            </CardContent>
          </Card>

          {/* Layering & Elevation */}
          <Card>
            <CardHeader>
              <CardTitle>Layering (z-index)</CardTitle>
              <CardDescription>The global layering order for overlap coordination.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <div className="flex justify-between border-b pb-1 font-medium text-xs text-muted-foreground">
                <span>Layer Role</span>
                <span>Utility Name / Value</span>
              </div>
              <div className="flex justify-between"><span>Toasts (always frontmost)</span><span className="font-mono text-xs">z-toast (1200)</span></div>
              <div className="flex justify-between"><span>Command Palette</span><span className="font-mono text-xs">z-command (1100)</span></div>
              <div className="flex justify-between"><span>Overlay Scrim</span><span className="font-mono text-xs">z-overlay (900)</span></div>
              <div className="flex justify-between"><span>Floating Dock</span><span className="font-mono text-xs">z-dock (800)</span></div>
              <div className="flex justify-between"><span>Top App Bar</span><span className="font-mono text-xs">z-topbar (850)</span></div>
              <div className="flex justify-between"><span>OS Windows</span><span className="font-mono text-xs">z-window (100)</span></div>
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      {/* 2. ACTIONS AND INPUTS */}
      <ShowcaseSection
        title="Controls"
        description="Interactable form elements, selection fields, button variants, and validations."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Action triggers across hierarchy levels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link Action</Button>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="lg">Large</Button>
                <Button size="default">Default</Button>
                <Button size="sm">Small</Button>
                <Button size="xs">XS</Button>
                <Button size="icon" aria-label="Icon option"><SettingsIcon className="size-4" /></Button>
                <Button size="icon-sm" aria-label="Small icon option"><SettingsIcon className="size-3.5" /></Button>
              </div>
            </CardContent>
          </Card>

          {/* Form & Validation */}
          <Card>
            <CardHeader>
              <CardTitle>Form Primitives</CardTitle>
              <CardDescription>React Hook Form validation states.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit((values) =>
                    toast.success(`Form saved: ${values.workspaceName}`),
                  )}
                >
                  <FormField
                    control={form.control}
                    name="workspaceName"
                    rules={{ required: "Workspace name is required." }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter workspace..." {...field} />
                        </FormControl>
                        <FormDescription>Must be unique in the organization.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm">Submit Form</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Input & Label States */}
          <Card>
            <CardHeader>
              <CardTitle>Input States</CardTitle>
              <CardDescription>Fields under different user feedback scenarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="input-normal">Active Input</Label>
                <Input id="input-normal" defaultValue="Editable content" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="input-placeholder">Placeholder Input</Label>
                <Input id="input-placeholder" placeholder="Enter text here..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="input-invalid" className="text-destructive">Invalid Input</Label>
                <Input id="input-invalid" placeholder="Invalid data entered" aria-invalid="true" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="input-disabled" className="opacity-50">Disabled Input</Label>
                <Input id="input-disabled" defaultValue="Locked value" disabled />
              </div>
            </CardContent>
          </Card>

          {/* Selection & Slider */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Selection & Slider</CardTitle>
              <CardDescription>Checkbox, switches, select fields, and numeric sliders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="switch-showcase">System Updates</Label>
                <Switch id="switch-showcase" defaultChecked />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="checkbox-showcase" defaultChecked />
                <Label htmlFor="checkbox-showcase">I agree to terms & conditions</Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="select-showcase">Select Action</Label>
                <Select defaultValue="profile">
                  <SelectTrigger id="select-showcase" className="w-full">
                    <SelectValue placeholder="Choose action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Actions</SelectLabel>
                      <SelectItem value="profile">Edit Profile</SelectItem>
                      <SelectItem value="settings">Open Settings</SelectItem>
                      <SelectSeparator />
                      <SelectItem value="delete" className="text-destructive">Delete Account</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <Label htmlFor="slider-showcase">Volume Adjustment</Label>
                  <span className="font-mono text-xs font-semibold text-primary">{sliderValue[0]}%</span>
                </div>
                <Slider
                  id="slider-showcase"
                  aria-label="Volume Adjustment"
                  min={0}
                  max={100}
                  step={1}
                  value={sliderValue}
                  onValueChange={setSliderValue}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Tab Switching</CardTitle>
              <CardDescription>Sub-content isolation within settings surfaces.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tab-general">
                <TabsList className="w-full justify-start sm:w-auto">
                  <TabsTrigger value="tab-general">General</TabsTrigger>
                  <TabsTrigger value="tab-appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="tab-advanced">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="tab-general" className="pt-4 text-sm text-muted-foreground">
                  Manage primary workspace credentials, regional defaults, and collaboration schedules.
                </TabsContent>
                <TabsContent value="tab-appearance" className="pt-4 text-sm text-muted-foreground">
                  Personalize the background canvas, accent color palettes, and surface transparency levels.
                </TabsContent>
                <TabsContent value="tab-advanced" className="pt-4 text-sm text-muted-foreground">
                  Configure hotkeys, hardware acceleration override, and view runtime diagnostic statistics.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      {/* 3. SURFACES AND LAYOUT */}
      <ShowcaseSection
        title="Surfaces & Layout"
        description="Layout structures: default glass cards, solid cards, floating surface primitives, windows, and scrolling views."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card comparison */}
          <div className="grid gap-4">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Glass Card (Default)</CardTitle>
                  <CardAction>
                    <Button variant="ghost" size="icon-sm" aria-label="More options"><HelpCircleIcon /></Button>
                  </CardAction>
                </div>
                <CardDescription>Frosted, floating panel using translucency roles.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Optimal for OS windows, dialog panels, and elements layered on top of backdrops.
              </CardContent>
              <CardFooter className="border-t justify-end gap-2">
                <Button variant="outline" size="sm">Secondary</Button>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="solid">
              <CardHeader>
                <CardTitle>Solid Card</CardTitle>
                <CardDescription>Opaque background for dense or high-contrast content.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Optimal for inline content blocks, lists, and forms sitting inside dialogs.
              </CardContent>
              <CardFooter className="border-t justify-between text-xs text-muted-foreground">
                <span>Last updated 2 mins ago</span>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>

          {/* Floating Surface role utility */}
          <Card>
            <CardHeader>
              <CardTitle>Surface Primitives</CardTitle>
              <CardDescription>Translucent floating surfaces with dedicated layout roles.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <GlassSurface variant="bar" className="flex items-center justify-between px-4 py-2 text-xs">
                <span>Topbar / dock rail role (<code>.glass-bar</code>)</span>
                <span className="font-semibold text-primary">Active</span>
              </GlassSurface>
              <GlassSurface variant="panel" className="p-4 text-xs space-y-1">
                <div className="font-semibold text-foreground">Dialog / popover panel role (<code>.glass-panel</code>)</div>
                <div className="text-muted-foreground">Maximum readability over gradients.</div>
              </GlassSurface>
              <div className="rounded-xl overflow-hidden border">
                <GlassSurface variant="titlebar" className="flex items-center justify-between px-3 py-2 text-xs border-b">
                  <span>Window Titlebar (<code>.glass-titlebar</code>)</span>
                  <div className="flex gap-1">
                    <span className="size-2.5 rounded-full bg-destructive" />
                    <span className="size-2.5 rounded-full bg-warning" />
                    <span className="size-2.5 rounded-full bg-success" />
                  </div>
                </GlassSurface>
                <GlassSurface variant="window" className="p-4 text-xs min-h-20">
                  Window container body role (<code>.glass-window</code>)
                </GlassSurface>
              </div>
            </CardContent>
          </Card>

          {/* Window primitive */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Window title="Active Window" active={true} className="min-h-52">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">Foreground Active</p>
                <p className="text-xs text-muted-foreground">
                  Full backdrop-blur filters enabled. Traffic controls highlighted.
                </p>
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Window>

            <Window title="Inactive Window" active={false} className="min-h-52">
              <div className="space-y-2 text-sm opacity-90">
                <p className="font-medium text-muted-foreground">Background Inactive</p>
                <p className="text-xs text-muted-foreground">
                  Blur falls back to semi-opaque fill to save rendering performance.
                </p>
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Window>
          </div>

          {/* Scroll Area (Vertical & Horizontal) */}
          <Card>
            <CardHeader>
              <CardTitle>Scroll Areas</CardTitle>
              <CardDescription>Custom scrollbars with vertical and horizontal layouts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-2 block text-xs font-semibold text-muted-foreground">Vertical Scroll</span>
                <ScrollArea className="h-36 rounded-md border p-3">
                  <div className="space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="rounded bg-muted p-2 text-xs">
                        Item row number {i + 1}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <span className="mb-2 block text-xs font-semibold text-muted-foreground">Horizontal Scroll</span>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border p-3">
                  <div className="flex gap-3 pb-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="inline-block rounded bg-muted p-4 text-xs min-w-36 text-center">
                        Column item {i + 1}
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      {/* 4. OVERLAYS AND MENUS */}
      <ShowcaseSection
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
              <Button onClick={() => setDialogOpen(true)}>Trigger Dialog</Button>
              <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                <PanelRightIcon />
                Trigger Sheet
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
                  <Button variant="outline" className="w-full justify-between">
                    Open Dropdown
                    <ExternalLinkIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Account Preferences</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toast.info("Profile menu selected.")}>
                    <UserIcon />
                    User Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Appearance settings opened.")}>
                    <SettingsIcon />
                    Appearance
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => toast.error("Account delete clicked.")}>
                    <TrashIcon />
                    Delete Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div className="flex h-20 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground cursor-context-menu hover:bg-muted/30 transition-colors">
                    Right-Click Area
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuLabel>Desktop Actions</ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => toast.info("Created folder.")}>
                    <PlusIcon />
                    New Folder
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => toast.success("Refreshed workspace.")}>
                    Refresh
                    <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive" onSelect={() => toast.error("Cleaned workspace.")}>
                    <TrashIcon />
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
                  <Button variant="outline">Open Popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">System Notification</p>
                    <p className="text-xs text-muted-foreground">
                      This popover container is bound to the trigger using semantic overlay constraints.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      {/* 5. FEEDBACK */}
      <ShowcaseSection
        title="Feedback"
        description="Visual signals: skeletons, toast notifications, separators, and status chips."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Skeleton Loaders */}
          <Card>
            <CardHeader>
              <CardTitle>Skeleton Loaders</CardTitle>
              <CardDescription>Loading states designed for content transitions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2 grow">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardContent>
          </Card>

          {/* Toasts */}
          <Card>
            <CardHeader>
              <CardTitle>Toast Alerts</CardTitle>
              <CardDescription>Global notifications spawned from app processes.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => toast.info("Workspace sync initiated.")}>
                Info
              </Button>
              <Button variant="outline" onClick={() => toast.success("Changes saved successfully.")}>
                Success
              </Button>
              <Button variant="outline" onClick={() => toast.warning("Low memory warning.")}>
                Warning
              </Button>
              <Button variant="destructive" onClick={() => toast.error("Database connection failed.")}>
                Error
              </Button>
            </CardContent>
          </Card>

          {/* Separator & Status badging */}
          <Card>
            <CardHeader>
              <CardTitle>Status Badges</CardTitle>
              <CardDescription>Inline indicators representing active states.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  Online
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                  <span className="size-1.5 rounded-full bg-warning" />
                  Syncing
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  <span className="size-1.5 rounded-full bg-destructive" />
                  Alert
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-muted-foreground" />
                  Offline
                </span>
              </div>
              <Separator />
              <div className="flex h-8 items-center gap-2.5 text-sm">
                <span>Left Element</span>
                <Separator orientation="vertical" />
                <span>Middle Element</span>
                <Separator orientation="vertical" />
                <span>Right Element</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      {/* 6. IDENTITY AND PERSONALIZATION */}
      <ShowcaseSection
        title="Identity & Personalization"
        description="Profile branding and personalization settings: user avatars, accent triggers, and surface intensity levels."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Avatars */}
          <Card>
            <CardHeader>
              <CardTitle>Avatars</CardTitle>
              <CardDescription>User profile assets and badge combinations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-12">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="Jane" />
                  <AvatarFallback>JN</AvatarFallback>
                  <AvatarBadge className="bg-success border-2 border-background size-3" />
                </Avatar>
                <Avatar className="size-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </div>
              <Separator />
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-muted-foreground">Avatar Group</span>
                <AvatarGroup>
                  <Avatar>
                    <AvatarFallback>AL</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="Jane" />
                    <AvatarFallback>JN</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>PN</AvatarFallback>
                  </Avatar>
                  <AvatarGroupCount>+3</AvatarGroupCount>
                </AvatarGroup>
              </div>
            </CardContent>
          </Card>

          {/* Accent personalization */}
          <Card>
            <CardHeader>
              <CardTitle>Accent personalizations</CardTitle>
              <CardDescription>Brand color overrides across actions and outlines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {ACCENTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    data-accent={value}
                    aria-label={value}
                    aria-pressed={accent === value}
                    onClick={() => setAccent(value)}
                    className={cn(
                      "size-8 rounded-full border-2 bg-primary capitalize transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer",
                      accent === value ? "border-foreground scale-105" : "border-transparent",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Applies <code>data-accent</code> attribute to scope color mixes. Accent is currently:{" "}
                <span className="font-mono font-semibold capitalize text-foreground">{accent || "indigo (default)"}</span>.
              </p>
            </CardContent>
          </Card>

          {/* Surface intensity personalization */}
          <Card>
            <CardHeader>
              <CardTitle>Surface Intensity</CardTitle>
              <CardDescription>Adjust transparency fallbacks and blur weights.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="inline-flex rounded-md border bg-card p-1">
                {GLASS_LEVELS.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={glass === value ? "secondary" : "ghost"}
                    aria-pressed={glass === value}
                    onClick={() => setGlass(value)}
                    className="capitalize"
                  >
                    {value}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Current intensity: <span className="font-mono font-semibold capitalize text-foreground">{glass || "default"}</span>.
                Applies <code>data-glass</code> parameter to override global variables.
              </p>
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      {/* 7. MOTION */}
      <ShowcaseSection
        title="Motion"
        description="Feedback curves: CSS micro-animations, JS framer-motion orchestration, and conditional window mount transitions."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* JS Recipes */}
          <Card>
            <CardHeader>
              <CardTitle>JS Recipes</CardTitle>
              <CardDescription>Common motion animations exported from @pumni/ui.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.div
                {...(shouldReduceMotion ? {} : recipes.hoverLift)}
                className="cursor-default rounded-xl border bg-card p-4 text-xs hover:border-primary/50 transition-colors"
              >
                <p className="font-semibold text-foreground">hoverLift Recipe</p>
                <p className="mt-1 text-muted-foreground">
                  Hover to float up, click to compress. Snappy curve for cards.
                </p>
              </motion.div>

              <motion.button
                type="button"
                {...(shouldReduceMotion ? {} : recipes.pressScale)}
                onClick={() => toast.info("pressScale gesture tapped.")}
                className="w-full text-left rounded-xl bg-primary p-4 text-xs text-primary-foreground cursor-pointer"
              >
                <p className="font-semibold">pressScale Recipe</p>
                <p className="mt-1 text-primary-foreground/80">
                  Touch interaction trigger for buttons and icon options.
                </p>
              </motion.button>
            </CardContent>
          </Card>

          {/* Stagger Sequence */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Stagger Entrances</CardTitle>
                <Button variant="outline" size="xs" onClick={() => setStaggerKey((key) => key + 1)}>
                  Replay Sequence
                </Button>
              </div>
              <CardDescription>Sequence delays via staggerContainer/staggerItem recipes.</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.ul
                key={staggerKey}
                {...(shouldReduceMotion ? {} : recipes.staggerContainer)}
                className="grid gap-2"
              >
                {["Initial viewport mount", "Synchronized step 1", "Completed step 2"].map((word, i) => (
                  <motion.li
                    key={word}
                    {...(shouldReduceMotion ? {} : recipes.staggerItem)}
                    className="rounded bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center justify-between"
                  >
                    <span>{word}</span>
                    <span className="font-mono text-[10px] opacity-75">Index {i}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </CardContent>
          </Card>

          {/* CSS Micro-feedback */}
          <Card>
            <CardHeader>
              <CardTitle>CSS Micro-Feedback</CardTitle>
              <CardDescription>CSS transitions (no motion dependencies) gated by motion-safe query.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card interactive>
                <CardContent className="pt-6">
                  <p className="font-semibold text-card-foreground">Interactive CSS Card</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hover lift & active press down scaling driven by CSS using the <code>--press-scale</code> token.
                  </p>
                </CardContent>
              </Card>
              <div className="flex justify-center">
                <Button className="w-full transition-transform active:scale-[var(--press-scale)]">
                  CSS Press Scaling
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Window Enter/Exit Dialog and AnimatePresence */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Window Mounting Transition</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setMotionWindowOpen((open) => !open)}>
                  {motionWindowOpen ? "Unmount Window" : "Mount Window"}
                </Button>
              </div>
              <CardDescription>Framer Motion AnimatePresence transition hooks.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-52 flex items-center justify-center bg-muted/20 rounded-xl border border-dashed">
              <AnimatePresence>
                {motionWindowOpen && (
                  <Window key="motion-demo" title="Motion-tracked window" className="w-full max-w-lg shadow-lg">
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-foreground">Smooth Entrance Spring</p>
                      <p className="text-xs text-muted-foreground">
                        Mount and unmount this container to test performance and entrance scaling.
                      </p>
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </Window>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      {/* Dock Nav layout */}
      <section className="flex justify-center pt-8 border-t">
        <Dock>
          <DockItem label="Light View" active={previewContrast === "standard"} onClick={() => setPreviewContrast("standard")}>
            <SunIcon className="size-5" />
          </DockItem>
          <DockItem label="Dark View" active={previewContrast === "more"} onClick={() => setPreviewContrast("more")}>
            <MoonIcon className="size-5" />
          </DockItem>
          <DockItem label="Settings Actions" onClick={() => toast.info("Dock settings tapped.")}>
            <SettingsIcon className="size-5" />
          </DockItem>
        </Dock>
      </section>

      {/* A11Y Contrast Preview Grid */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              A11Y Surface Contrast Preview
            </h2>
            <p className="text-sm text-muted-foreground">
              Simulated surface opacity and high contrast modes layered on top of wallpaper gradients.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-md border bg-card p-1">
              <Button
                type="button"
                size="sm"
                variant={previewTransparency === "standard" ? "secondary" : "ghost"}
                aria-pressed={previewTransparency === "standard"}
                onClick={() => setPreviewTransparency("standard")}
              >
                Standard
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewTransparency === "reduced" ? "secondary" : "ghost"}
                aria-pressed={previewTransparency === "reduced"}
                onClick={() => setPreviewTransparency("reduced")}
              >
                Opaque Solid
              </Button>
            </div>
            <div className="inline-flex rounded-md border bg-card p-1">
              <Button
                type="button"
                size="sm"
                variant={previewContrast === "standard" ? "secondary" : "ghost"}
                aria-pressed={previewContrast === "standard"}
                onClick={() => setPreviewContrast("standard")}
              >
                Normal Contrast
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewContrast === "more" ? "secondary" : "ghost"}
                aria-pressed={previewContrast === "more"}
                onClick={() => setPreviewContrast("more")}
              >
                High Contrast
              </Button>
            </div>
          </div>
        </div>

        <div
          className="relative min-h-96 overflow-hidden rounded-xl border bg-background p-6"
          data-transparency={previewTransparency}
          data-contrast={previewContrast}
        >
          {/* Animated decorative blobs in background */}
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-24 size-96 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-(--desktop-blob-secondary) opacity-55 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 size-96 rounded-full bg-(--desktop-blob-accent) opacity-50 blur-3xl" />
            <div className="absolute inset-0 bg-background/30" />
          </div>

          <div className="relative grid gap-4 md:grid-cols-2">
            <GlassSurface variant="panel" className="p-5 flex flex-col justify-between min-h-64">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-primary uppercase">Readability Grid</span>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  AA/AAA Accessibility
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Contrast ratio complies with WCAG guidelines on both light and dark backgrounds.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="rounded bg-success/20 px-2 py-0.5 text-xs text-success font-medium">Text Pass</span>
                <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent font-medium">Icon Pass</span>
              </div>
            </GlassSurface>

            <Window title="A11y Window Monitor" className="min-h-64">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Render State</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      previewContrast === "more"
                        ? "bg-warning text-warning-foreground"
                        : "bg-success/15 text-success",
                    )}
                  >
                    {previewContrast === "more" ? "Contrast Boosted" : "Verified"}
                  </span>
                </div>
                <Input aria-label="Quick focus text" placeholder="Focus outline validation" />
                <div className="flex gap-2">
                  <Button className="grow">Primary Action</Button>
                  <Button variant="outline">Dismiss</Button>
                </div>
              </div>
            </Window>
          </div>
        </div>
      </section>

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
          <div className="px-6 py-5 space-y-3 text-sm text-muted-foreground">
            <p>
              This dialog overlay uses a translucent panel with built-in close action hooks.
            </p>
            <Skeleton className="h-4 w-4/5" />
          </div>
          <DialogFooter className="border-t bg-card/40 px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => { toast.success("Action confirmed."); setDialogOpen(false); }}>
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OVERLAY SHEET PORTAL */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col justify-between">
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
            <div className="py-6 space-y-4">
              <span className="block text-xs font-semibold text-muted-foreground">Scope Settings</span>
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
              <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
            </SheetClose>
            <Button className="w-full sm:w-auto" onClick={() => { toast.success("Settings applied."); setSheetOpen(false); }}>
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

function ShowcaseSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className={cn("flex h-12 flex-col justify-between rounded-md p-2 text-[11px] leading-none font-medium", className)}>
      <span>{label}</span>
      <span className="text-[10px] opacity-75 self-end">Aa</span>
    </div>
  );
}

function RadiusDemo({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-2 rounded-md border bg-muted/20">
      <div className={cn("size-12 border-2 border-primary bg-background shadow-xs", className)} />
      <span className="text-[10px] font-mono text-muted-foreground text-center truncate w-full">{label}</span>
    </div>
  );
}
