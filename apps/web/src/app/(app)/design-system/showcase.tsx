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
} from "lucide-react";
import {
  AnimatePresence,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
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
} from "@pumni/ui";

type DemoFormValues = {
  workspace: string;
  email: string;
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
  const [previewTransparency, setPreviewTransparency] = React.useState<"standard" | "reduced">(
    "standard",
  );
  const [previewContrast, setPreviewContrast] = React.useState<"standard" | "more">("standard");
  const form = useForm<DemoFormValues>({
    defaultValues: {
      workspace: "Pumni OS",
      email: "",
    },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Design System</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Token, component, surface, and interaction states rendered from @pumni/ui.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => toast.success("Success toast rendered.")}>
            <BellIcon />
            Toast
          </Button>
          <Button variant="outline" onClick={() => setCommandOpen(true)}>
            <CommandIcon />
            Command
          </Button>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <GlassSurface className="min-h-72 overflow-hidden p-6">
          <div className="grid h-full gap-6 lg:grid-cols-[1fr_18rem]">
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Liquid Glass</p>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight">
                Floating layers over the OS wallpaper.
              </h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Glass panels, bars, windows, and titlebars share tokens but keep distinct roles.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
                <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                  <PanelRightIcon />
                  Open sheet
                </Button>
              </div>
            </div>
            <Window title="Preview" className="h-56">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Surface stack</span>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
                    Active
                  </span>
                </div>
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
                <Separator />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="size-4 text-success" />
                  Reduced transparency fallback is CSS-driven.
                </div>
              </div>
            </Window>
          </div>
        </GlassSurface>

        <Card>
          <CardHeader>
            <CardTitle>Palette</CardTitle>
            <CardDescription>Semantic roles consumed by components.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Swatch label="Primary" className="bg-primary text-primary-foreground" />
            <Swatch label="Accent" className="bg-accent text-accent-foreground" />
            <Swatch label="Muted" className="bg-muted text-muted-foreground" />
            <Swatch label="Success" className="bg-success text-success-foreground" />
            <Swatch label="Warning" className="bg-warning text-warning-foreground" />
            <Swatch label="Destructive" className="bg-destructive text-destructive-foreground" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Glass Accessibility Preview
            </h2>
            <p className="text-sm text-muted-foreground">
              Surface roles layered over the desktop wallpaper with system preference states.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-md border border-border bg-card p-1">
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
                Solid
              </Button>
            </div>
            <div className="inline-flex rounded-md border border-border bg-card p-1">
              <Button
                type="button"
                size="sm"
                variant={previewContrast === "standard" ? "secondary" : "ghost"}
                aria-pressed={previewContrast === "standard"}
                onClick={() => setPreviewContrast("standard")}
              >
                Normal
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewContrast === "more" ? "secondary" : "ghost"}
                aria-pressed={previewContrast === "more"}
                onClick={() => setPreviewContrast("more")}
              >
                High
              </Button>
            </div>
          </div>
        </div>

        <div
          className="glass-a11y-preview relative min-h-120 overflow-hidden rounded-xl border border-border bg-background p-4 sm:p-6"
          data-transparency={previewTransparency}
          data-contrast={previewContrast}
        >
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-24 size-96 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-(--desktop-blob-secondary) opacity-55 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 size-96 rounded-full bg-(--desktop-blob-accent) opacity-50 blur-3xl" />
            <div className="absolute top-1/3 right-1/4 size-80 rounded-full bg-(--desktop-blob-cyan) opacity-45 blur-3xl" />
            <div className="absolute inset-0 bg-background/25" />
          </div>

          <div className="relative grid gap-4 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-4">
              <div className="glass-bar flex items-center justify-between rounded-xl border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Topbar role</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Text, icons, and borders stay legible above moving color fields.
                  </p>
                </div>
                <Button size="icon-sm" variant="ghost" aria-label="Preview settings">
                  <SettingsIcon />
                </Button>
              </div>

              <GlassSurface className="p-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Panel role</p>
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                      Contrast edge check
                    </h3>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                      The same preview can be inspected in translucent, solid, normal, and high
                      contrast states.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Swatch label="Text" className="bg-card text-card-foreground" />
                    <Swatch label="Focus" className="bg-accent text-accent-foreground" />
                  </div>
                </div>
              </GlassSurface>

              <Window title="Inactive workload" active={false} className="min-h-48">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Performance fallback</span>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Inactive
                    </span>
                  </div>
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                  <p className="text-sm text-muted-foreground">
                    Inactive windows render without backdrop blur while keeping hierarchy.
                  </p>
                </div>
              </Window>
            </div>

            <Window title="Active preview" className="min-h-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Surface state</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      previewContrast === "more"
                        ? "bg-warning text-warning-foreground"
                        : "bg-success/15 text-success",
                    )}
                  >
                    {previewContrast === "more" ? "High contrast" : "AA checked"}
                  </span>
                </div>
                <Input aria-label="Preview input" placeholder="Focus target" />
                <div className="grid grid-cols-2 gap-2">
                  <Button>Primary</Button>
                  <Button variant="outline">Outline</Button>
                </div>
                <Separator />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="size-4 text-success" />
                    Glass fill uses semantic tokens.
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="size-4 text-success" />
                    Forced-colors keeps outline focus visible.
                  </div>
                </div>
              </div>
            </Window>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Buttons, inputs, labels, and validation states.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) =>
                  toast.success(`${values.workspace} saved.`),
                )}
              >
                <FormField
                  control={form.control}
                  name="workspace"
                  rules={{ required: "Workspace is required." }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Shared form primitives use react-hook-form.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label htmlFor="qa-email">Email</Label>
                  <Input id="qa-email" placeholder="name@example.com" aria-invalid />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="outline">
                    Outline
                  </Button>
                  <Button type="button" variant="ghost">
                    Ghost
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Menus</CardTitle>
            <CardDescription>Dropdown and command palette surfaces.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Menu
                  <ExternalLinkIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info("Profile selected.")}>
                  <UserIcon />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Appearance selected.")}>
                  <SunIcon />
                  Appearance
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => toast.error("Destructive state.")}
                >
                  Reset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="secondary" className="w-full" onClick={() => setCommandOpen(true)}>
              <CommandIcon />
              Open command palette
            </Button>
            <div className="rounded-md border border-border p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Avatars</span>
                <span className="text-xs text-muted-foreground">Group</span>
              </div>
              <AvatarGroup>
                <Avatar>
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>PN</AvatarFallback>
                </Avatar>
                <AvatarGroupCount>+4</AvatarGroupCount>
              </AvatarGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>Loading and notification states.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => toast.info("Informational toast.")}>
                Info
              </Button>
              <Button variant="outline" onClick={() => toast.warning("Warning toast.")}>
                Warning
              </Button>
              <Button variant="outline" onClick={() => toast.success("Success toast.")}>
                Success
              </Button>
              <Button variant="destructive" onClick={() => toast.error("Error toast.")}>
                Error
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overlays</CardTitle>
            <CardDescription>Tooltip, popover, and right-click context menu.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-start gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Solid tooltip surface</TooltipContent>
            </Tooltip>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Quick settings</p>
                  <p className="text-sm text-muted-foreground">
                    Glass popover anchored to its trigger.
                  </p>
                </div>
              </PopoverContent>
            </Popover>

            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="flex h-20 w-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                  Right-click area
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel>Desktop</ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => toast.info("New folder.")}>
                  New folder
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => toast.info("Refresh.")}>
                  Refresh
                  <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" onSelect={() => toast.error("Removed.")}>
                  Remove
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Scroll area</CardTitle>
            <CardDescription>Custom scrollbar for dense OS window content.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 rounded-md border border-border">
              <div className="space-y-2 p-3">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                  >
                    Row {index + 1}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Selection</CardTitle>
            <CardDescription>Switch, checkbox, and select inputs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="qa-switch">Reduce motion</Label>
              <Switch id="qa-switch" defaultChecked />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="qa-check" defaultChecked />
              <Label htmlFor="qa-check">Enable notifications</Label>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select defaultValue="system">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardDescription>Content switching for settings panels.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="pt-3 text-sm text-muted-foreground">
                General workspace preferences.
              </TabsContent>
              <TabsContent value="appearance" className="pt-3 text-sm text-muted-foreground">
                Theme, accent, and glass intensity.
              </TabsContent>
              <TabsContent value="advanced" className="pt-3 text-sm text-muted-foreground">
                Developer and experimental options.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Window motion</CardTitle>
            <CardDescription>
              Spring enter/exit via motion + AnimatePresence. Timing reads from the motion tokens
              and honours reduced-motion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMotionWindowOpen((open) => !open)}
            >
              {motionWindowOpen ? "Hide window" : "Show window"}
            </Button>
            <div className="min-h-44">
              <AnimatePresence>
                {motionWindowOpen && (
                  <Window key="motion-demo" title="Motion window" className="h-40">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Mount and unmount this window to see the spring transition. The same primitive
                      powers OS windows on the desktop.
                    </p>
                  </Window>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex justify-center pb-4">
        <Dock>
          <DockItem label="Light preview">
            <SunIcon />
          </DockItem>
          <DockItem label="Dark preview" active>
            <MoonIcon />
          </DockItem>
          <DockItem label="Settings">
            <SettingsIcon />
          </DockItem>
        </Dock>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CheckCircle2Icon className="size-5" />
            </div>
            <DialogTitle className="text-xl">Dialog Surface</DialogTitle>
            <DialogDescription className="max-w-md leading-6">
              Glass panel, overlay, close affordance, focus trap, and semantic text colors.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-card/70 p-3">
              <p className="text-sm font-medium text-card-foreground">Readable content</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Dialog copy stays above the wallpaper and glass overlay.
              </p>
            </div>
            <div className="rounded-md border border-border bg-card/70 p-3">
              <p className="text-sm font-medium text-card-foreground">Keyboard path</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Close button and footer actions keep visible focus states.
              </p>
            </div>
          </div>
          <DialogFooter className="border-t border-border bg-card/40 px-6 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 pt-5 pb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <PanelRightIcon className="size-5" />
            </div>
            <SheetTitle className="text-lg">Sheet Surface</SheetTitle>
            <SheetDescription className="leading-6">
              Side panel state with glass panel styling and solid fallback behavior.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 px-5">
            <Swatch label="Popover" className="bg-popover text-popover-foreground" />
            <Swatch label="Card" className="bg-card text-card-foreground" />
            <Swatch label="Secondary" className="bg-secondary text-secondary-foreground" />
          </div>
          <SheetFooter className="border-t border-border bg-card/40 px-5 py-4">
            <Button onClick={() => setSheetOpen(false)}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={commandItems} />
    </div>
  );
}

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className={`flex h-12 items-center justify-between rounded-md px-3 text-sm ${className}`}>
      <span className="font-medium">{label}</span>
      <span className="text-xs opacity-80">Aa</span>
    </div>
  );
}
