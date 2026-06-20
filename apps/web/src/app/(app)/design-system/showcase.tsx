'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useActiveSection } from '@/hooks/use-active-section';
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
} from 'lucide-react';
import {
  AnimatePresence,
  apcaContrast,
  apcaLuminance,
  AuthField,
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  Badge,
  BentoGrid,
  BentoGridItem,
  Button,
  Card,
  CardWell,
  IconBadge,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardFooter,
  CardSpotlight,
  Checkbox,
  CommandPalette,
  type CommandItem,
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
  SubmitButton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Window,
  withViewTransition,
  cn,
  motion,
  recipes,
  useReducedMotion,
  ACCENTS,
  usePersonalization,
  SegmentedPicker,
  DENSITIES,
  GLASS_LEVELS,
} from '@pumni/ui';

type DemoFormValues = {
  workspaceName: string;
  adminEmail: string;
};

const commandItems: CommandItem[] = [
  {
    id: 'open-dashboard',
    label: 'Open dashboard',
    keywords: 'home overview',
    icon: <CommandIcon />,
    shortcut: 'D',
    onSelect: () => toast.info('Dashboard command selected.'),
  },
  {
    id: 'invite-member',
    label: 'Invite member',
    keywords: 'team email',
    icon: <UserIcon />,
    shortcut: 'I',
    onSelect: () => toast.success('Invite command selected.'),
  },
  {
    id: 'system-settings',
    label: 'System settings',
    keywords: 'preferences controls',
    icon: <SettingsIcon />,
    shortcut: 'S',
    onSelect: () => toast.info('Settings command selected.'),
  },
];

function hexToRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16) / 255,
    Number.parseInt(hex.slice(3, 5), 16) / 255,
    Number.parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

const SHOWCASE_SECTIONS = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'controls', label: 'Controls' },
  { id: 'surfaces-layout', label: 'Surfaces & Layout' },
  { id: 'overlays-menus', label: 'Overlays & Menus' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'identity-personalization', label: 'Identity & Personalization' },
  { id: 'motion', label: 'Motion' },
  { id: 'bento-grid', label: 'Bento Grid' },
  { id: 'card-states', label: 'Card States & Spotlight' },
] as const;

const SHOWCASE_SECTION_IDS = SHOWCASE_SECTIONS.map((s) => s.id);

export function DesignSystemShowcase() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [motionWindowOpen, setMotionWindowOpen] = React.useState(true);
  const [staggerKey, setStaggerKey] = React.useState(0);
  const [fadeRiseVisible, setFadeRiseVisible] = React.useState(true);
  const [sliderValue, setSliderValue] = React.useState([45]);
  const shouldReduceMotion = useReducedMotion();

  const { accent, glass, density, setAccent, setGlass, setDensity } = usePersonalization();

  const [previewTransparency, setPreviewTransparency] = React.useState<'standard' | 'reduced'>(
    'standard',
  );
  const [previewContrast, setPreviewContrast] = React.useState<'standard' | 'more'>('standard');
  const [dropdownCheckState, setDropdownCheckState] = React.useState({
    notifications: true,
    compact: false,
  });
  const [dropdownRadio, setDropdownRadio] = React.useState('comfortable');
  const [contextCheckState, setContextCheckState] = React.useState({
    showHidden: false,
    readOnly: true,
  });
  const [apcaFg, setApcaFg] = React.useState('#0a0a0a');
  const [apcaBg, setApcaBg] = React.useState('#fafafa');

  const form = useForm<DemoFormValues>({
    defaultValues: {
      workspaceName: 'Pumni OS Catalog',
      adminEmail: '',
    },
  });

  const activeSection = useActiveSection(SHOWCASE_SECTION_IDS);

  return (
    <div className="flex gap-10 pb-16">
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav className="sticky top-24 space-y-0.5 pt-1">
          {SHOWCASE_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                'block rounded-md px-3 py-1.5 text-sm transition-colors',
                activeSection === section.id
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-12">
        {/* HEADER */}
        <header className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Design System</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Token foundations, shared primitives, surfaces, motion, and personalization from{' '}
              <code className="text-foreground">@pumni/ui</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => toast.success('Notification toast triggered.')}
            >
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
          id="foundations"
          title="Foundations"
          description="Core design tokens: semantic colors, typography scale, radius knobs, elevation, and z-index layers."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Semantic Palette</CardTitle>
                <CardDescription>
                  Theme-aware color roles consumed by UI components.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Swatch
                  label="Background"
                  className="border border-border bg-background text-foreground"
                />
                <Swatch label="Foreground" className="bg-foreground text-background" />
                <Swatch
                  label="Card"
                  className="border border-border bg-card text-card-foreground"
                />
                <Swatch
                  label="Popover"
                  className="border border-border bg-popover text-popover-foreground"
                />
                <Swatch label="Primary" className="bg-primary text-primary-foreground" />
                <Swatch label="Secondary" className="bg-secondary text-secondary-foreground" />
                <Swatch label="Muted" className="bg-muted text-muted-foreground" />
                <Swatch label="Accent" className="bg-accent text-accent-foreground" />
                <Swatch label="Success" className="bg-success text-success-foreground" />
                <Swatch label="Warning" className="bg-warning text-warning-foreground" />
                <Swatch
                  label="Destructive"
                  className="bg-destructive text-destructive-foreground"
                />
                <Swatch
                  label="Border"
                  className="flex items-center justify-center bg-border text-xs text-foreground"
                />
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
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-muted-foreground">text-4xl</span>
                  <span className="text-4xl font-bold tracking-tight">OS Title</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-muted-foreground">text-3xl</span>
                  <span className="text-3xl font-semibold">Section Header</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-muted-foreground">text-2xl</span>
                  <span className="text-2xl font-semibold">Sub-heading</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-muted-foreground">text-xl</span>
                  <span className="text-xl font-medium">Card Header</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-muted-foreground">text-lg</span>
                  <span className="text-lg font-medium">Lead text</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-muted-foreground">text-base</span>
                  <span className="text-base text-foreground">Body default</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-muted-foreground">text-sm</span>
                  <span className="text-sm text-muted-foreground">Subdued detail</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-muted-foreground">text-xs</span>
                  <span className="text-xs text-muted-foreground">Captions & labels</span>
                </div>
              </CardContent>
            </Card>

            {/* Radius Scale */}
            <Card>
              <CardHeader>
                <CardTitle>Radius Scale</CardTitle>
                <CardDescription>
                  Scale calculated dynamically off a single base knob.
                </CardDescription>
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
                <CardDescription>
                  The global layering order for overlap coordination.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between border-b pb-1 text-xs font-medium text-muted-foreground">
                  <span>Layer Role</span>
                  <span>Utility Name / Value</span>
                </div>
                {[
                  { role: 'Toasts (always frontmost)', token: 'z-toast (1200)' },
                  { role: 'Command Palette', token: 'z-command (1100)' },
                  { role: 'Overlay Scrim', token: 'z-overlay (900)' },
                  { role: 'Floating Dock', token: 'z-dock (800)' },
                  { role: 'Top App Bar', token: 'z-topbar (850)' },
                  { role: 'OS Windows', token: 'z-window (100)' },
                ].map(({ role, token }) => (
                  <div key={token} className="flex justify-between">
                    <span>{role}</span>
                    <span className="font-mono text-xs">{token}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* APCA Contrast Verification */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  APCA Contrast Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  Perceptual contrast (APCA Lc) across surface opacities, accent layers, and
                  high-contrast mode. This is the single contrast source of truth — APCA, not WCAG
                  2.x.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex rounded-md border bg-card p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={previewTransparency === 'standard' ? 'secondary' : 'ghost'}
                    aria-pressed={previewTransparency === 'standard'}
                    onClick={() => setPreviewTransparency('standard')}
                  >
                    Standard
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={previewTransparency === 'reduced' ? 'secondary' : 'ghost'}
                    aria-pressed={previewTransparency === 'reduced'}
                    onClick={() => setPreviewTransparency('reduced')}
                  >
                    Opaque Solid
                  </Button>
                </div>
                <div className="inline-flex rounded-md border bg-card p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={previewContrast === 'standard' ? 'secondary' : 'ghost'}
                    aria-pressed={previewContrast === 'standard'}
                    onClick={() => setPreviewContrast('standard')}
                  >
                    Normal Contrast
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={previewContrast === 'more' ? 'secondary' : 'ghost'}
                    aria-pressed={previewContrast === 'more'}
                    onClick={() => setPreviewContrast('more')}
                  >
                    High Contrast
                  </Button>
                </div>
              </div>
            </div>

            <div
              className="glass-a11y-preview relative min-h-80 overflow-hidden rounded-xl border bg-background p-6"
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
                <GlassSurface
                  variant="panel"
                  className="flex min-h-64 flex-col justify-between p-5"
                >
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-primary uppercase">
                      APCA Contrast Gate
                    </span>
                    <h4 className="text-2xl font-bold tracking-tight text-foreground">
                      Lc 60 / Lc 25
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      All semantic color pairs are gated: body text ≥ Lc 60, UI elements ≥ Lc 25.
                      APCA is perceptually accurate across both light and dark backgrounds.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                      Lc 60+ Text
                    </span>
                    <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                      Lc 25+ UI
                    </span>
                  </div>
                </GlassSurface>

                <Window title="Surface Contrast Monitor" className="min-h-64">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">APCA Gate Status</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          previewContrast === 'more'
                            ? 'bg-warning text-warning-foreground'
                            : 'bg-success/15 text-success',
                        )}
                      >
                        {previewContrast === 'more' ? 'Contrast Boosted' : 'Verified'}
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

              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">APCA Contrast Utility</h4>
                <p className="text-xs text-muted-foreground">
                  <code>apcaContrast</code> and <code>apcaLuminance</code> from{' '}
                  <code>@pumni/ui</code> compute perceptual contrast (Lc) using the APCA algorithm.
                  Drag the color pickers to see live values.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="apca-fg" className="text-xs">
                      Foreground
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="apca-fg"
                        type="color"
                        value={apcaFg}
                        onChange={(e) => setApcaFg(e.target.value)}
                        className="size-8 cursor-pointer rounded border bg-transparent"
                      />
                      <span className="font-mono text-xs text-muted-foreground">{apcaFg}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="apca-bg" className="text-xs">
                      Background
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="apca-bg"
                        type="color"
                        value={apcaBg}
                        onChange={(e) => setApcaBg(e.target.value)}
                        className="size-8 cursor-pointer rounded border bg-transparent"
                      />
                      <span className="font-mono text-xs text-muted-foreground">{apcaBg}</span>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 rounded-lg border p-3"
                  style={{ backgroundColor: apcaBg }}
                >
                  <span className="text-lg font-bold" style={{ color: apcaFg }}>
                    Aa
                  </span>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold" style={{ color: apcaFg }}>
                        {(() => {
                          const fgRgb = hexToRgb(apcaFg);
                          const bgRgb = hexToRgb(apcaBg);
                          const val = apcaContrast(fgRgb, bgRgb);
                          const absVal = Math.abs(val);
                          const polarity = val > 0 ? 'BoW' : val < 0 ? 'WoB' : '';
                          return `Lc ${absVal.toFixed(1)} ${polarity}`.trim();
                        })()}
                      </span>
                      {(() => {
                        const val = Math.abs(apcaContrast(hexToRgb(apcaFg), hexToRgb(apcaBg)));
                        if (val >= 60)
                          return (
                            <span className="rounded bg-success/15 px-1.5 py-px text-[10px] font-medium text-success">
                              Pass — Text
                            </span>
                          );
                        if (val >= 25)
                          return (
                            <span className="rounded bg-warning/15 px-1.5 py-px text-[10px] font-medium text-warning">
                              Pass — UI
                            </span>
                          );
                        return (
                          <span className="rounded bg-destructive/15 px-1.5 py-px text-[10px] font-medium text-destructive">
                            Fail
                          </span>
                        );
                      })()}
                    </div>
                    <span className="block" style={{ color: apcaFg, opacity: 0.7 }}>
                      Project gate: Lc 60+ = Text, Lc 25+ = UI elements
                    </span>
                    <span className="font-mono text-[10px] opacity-50" style={{ color: apcaFg }}>
                      {(() => {
                        const fgLum = apcaLuminance(...hexToRgb(apcaFg));
                        const bgLum = apcaLuminance(...hexToRgb(apcaBg));
                        return `Lum fg=${fgLum.toFixed(3)} bg=${bgLum.toFixed(3)}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ShowcaseSection>

        {/* 2. ACTIONS AND INPUTS */}
        <ShowcaseSection
          id="controls"
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
                  <Button size="icon" aria-label="Icon option">
                    <SettingsIcon className="size-4" />
                  </Button>
                  <Button size="icon-sm" aria-label="Small icon option">
                    <SettingsIcon className="size-3.5" />
                  </Button>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Loading State (CLS-safe)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button loading>Saving…</Button>
                    <Button variant="outline" loading>
                      Processing
                    </Button>
                    <Button variant="destructive" loading>
                      Deleting
                    </Button>
                  </div>
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
                      rules={{ required: 'Workspace name is required.' }}
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
                    <div className="flex justify-end gap-2">
                      <SubmitButton size="sm">Submit Form</SubmitButton>
                    </div>
                  </form>
                </Form>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    AuthField (Server Action form field)
                  </p>
                  <AuthField
                    id="demo-auth-field"
                    label="API Token Name"
                    placeholder="e.g. Production Read-only"
                    error={['Token name must be at least 3 characters.']}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    SubmitButton (Server Action ready)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Reads <code>useFormStatus</code> for auto-pending state. Falls back to manual{' '}
                    <code>loading</code> prop.
                  </p>
                  <div className="flex gap-2">
                    <SubmitButton size="sm">Save</SubmitButton>
                    <SubmitButton size="sm" loading>
                      Saving…
                    </SubmitButton>
                  </div>
                </div>
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
                  <Label htmlFor="input-normal">Active Input (outline)</Label>
                  <Input id="input-normal" defaultValue="Editable content" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="input-filled">Filled Variant</Label>
                  <Input id="input-filled" variant="filled" placeholder="Filled input style…" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="input-invalid" className="text-destructive">
                    Invalid Input
                  </Label>
                  <Input
                    id="input-invalid"
                    placeholder="Invalid data entered"
                    aria-invalid="true"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="input-disabled" className="opacity-50">
                    Disabled Input
                  </Label>
                  <Input id="input-disabled" defaultValue="Locked value" disabled />
                </div>
              </CardContent>
            </Card>

            {/* Selection & Slider */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Selection & Slider</CardTitle>
                <CardDescription>
                  Checkbox, switches, select fields, and numeric sliders.
                </CardDescription>
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
                        <SelectItem value="delete" className="text-destructive">
                          Delete Account
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <Label htmlFor="slider-showcase">Volume Adjustment</Label>
                    <span className="font-mono text-xs font-semibold text-primary">
                      {sliderValue[0]}%
                    </span>
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
                    Manage primary workspace credentials, regional defaults, and collaboration
                    schedules.
                  </TabsContent>
                  <TabsContent
                    value="tab-appearance"
                    className="pt-4 text-sm text-muted-foreground"
                  >
                    Personalize the background canvas, accent color palettes, and surface
                    transparency levels.
                  </TabsContent>
                  <TabsContent value="tab-advanced" className="pt-4 text-sm text-muted-foreground">
                    Configure hotkeys, hardware acceleration override, and view runtime diagnostic
                    statistics.
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </ShowcaseSection>

        {/* 3. SURFACES AND LAYOUT */}
        <ShowcaseSection
          id="surfaces-layout"
          title="Surfaces & Layout"
          description="Layout structures: glassmorphism glass cards, raised solid cards, floating surface primitives, windows, and scrolling views."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Card comparison — over a backdrop so the glass card reads as
                glassmorphism (it refracts the blobs); the solid card stays opaque. */}
            <div className="relative overflow-hidden rounded-2xl border bg-background p-4">
              <div aria-hidden className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-16 size-80 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
                <div className="absolute -right-12 -bottom-24 size-80 rounded-full bg-(--desktop-blob-secondary) opacity-50 blur-3xl" />
                <div className="absolute inset-0 bg-background/30" />
              </div>
              <div className="relative grid gap-4">
                <Card variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Glass Card</CardTitle>
                    <CardAction>
                      <Button variant="ghost" size="icon-sm" aria-label="More options">
                        <HelpCircleIcon />
                      </Button>
                    </CardAction>
                  </div>
                  <CardDescription>
                    Glassmorphism (opt-in, <code>variant=&quot;glass&quot;</code>): frosted vibrant
                    fill, a luminous light border, and an inner sheen. Float it over a backdrop.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Optimal for OS windows, dialog panels, and elements layered on top of backdrops.
                </CardContent>
                <CardFooter className="justify-end gap-2 border-t">
                  <Button variant="outline" size="sm">
                    Secondary
                  </Button>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>

              <Card variant="solid">
                <CardHeader>
                  <CardTitle>Solid Card</CardTitle>
                  <CardDescription>
                    Opaque background for dense or high-contrast content.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Optimal for inline content blocks, lists, and forms sitting inside dialogs.
                </CardContent>
                <CardFooter className="justify-between border-t text-xs text-muted-foreground">
                  <span>Last updated 2 mins ago</span>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>
              </div>
            </div>

            {/* Floating Surface role utility */}
            <Card>
              <CardHeader>
                <CardTitle>Glassmorphism Surfaces</CardTitle>
                <CardDescription>
                  Frosted translucent floating surfaces with dedicated layout roles — float them
                  over a backdrop.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Glass only reads as glass over a backdrop — float these roles
                    over the desktop blob gradient, not on a flat opaque card. */}
                <div className="relative overflow-hidden rounded-xl border bg-background p-4">
                  <div aria-hidden className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-16 size-72 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
                    <div className="absolute -right-12 -bottom-24 size-72 rounded-full bg-(--desktop-blob-secondary) opacity-50 blur-3xl" />
                    <div className="absolute inset-0 bg-background/30" />
                  </div>

                  <div className="relative grid gap-4">
                    <GlassSurface
                      variant="bar"
                      className="flex items-center justify-between rounded-lg px-4 py-2 text-xs"
                    >
                      <span>
                        Topbar / dock rail role (<code>.glass-bar</code>)
                      </span>
                      <span className="font-semibold text-primary">Active</span>
                    </GlassSurface>
                    <GlassSurface variant="panel" className="space-y-1 p-4 text-xs">
                      <div className="font-semibold text-foreground">
                        Dialog / popover panel role (<code>.glass-panel</code>)
                      </div>
                      <div className="text-muted-foreground">
                        Maximum readability over gradients.
                      </div>
                    </GlassSurface>
                    <GlassSurface variant="window" className="overflow-hidden rounded-xl p-0">
                      <GlassSurface
                        variant="titlebar"
                        className="flex items-center justify-between border-b px-3 py-2 text-xs"
                      >
                        <span>
                          Window Titlebar (<code>.glass-titlebar</code>)
                        </span>
                        {/* Neutral monochrome controls (de-Appled per ADR-0012) */}
                        <div className="flex gap-1.5 text-muted-foreground">
                          <span className="size-2 rounded-full bg-current opacity-40" />
                          <span className="size-2 rounded-full bg-current opacity-40" />
                          <span className="size-2 rounded-full bg-current opacity-40" />
                        </div>
                      </GlassSurface>
                      <div className="min-h-20 p-4 text-xs">
                        Window container body role (<code>.glass-window</code>)
                      </div>
                    </GlassSurface>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card composition primitives — Badge / IconBadge / CardWell */}
            <Card>
              <CardHeader>
                <CardTitle>Card Composition Primitives</CardTitle>
                <CardDescription>
                  The closed set that replaces hand-rolled status pills, icon chips, and inset
                  wells. Compose these instead of writing <code>border bg-muted</code> by hand.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {/* Badge tones */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success" pulse>
                    Live
                  </Badge>
                  <Badge tone="primary">In library</Badge>
                  <Badge tone="warning">Syncing</Badge>
                  <Badge tone="destructive">Error</Badge>
                  <Badge tone="neutral">Idle</Badge>
                </div>

                {/* IconBadge tones + sizes */}
                <div className="flex flex-wrap items-center gap-3">
                  <IconBadge tone="primary-soft" size="sm" aria-hidden>
                    <HelpCircleIcon />
                  </IconBadge>
                  <IconBadge tone="muted" size="md" aria-hidden>
                    <HelpCircleIcon />
                  </IconBadge>
                  <IconBadge tone="raised" size="lg" radius="xl" aria-hidden>
                    <HelpCircleIcon />
                  </IconBadge>
                </div>

                {/* CardWell inset surface */}
                <CardWell className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Inset well (<code>CardWell</code>)
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    Recessed nested surface for media rows and stats.
                  </p>
                </CardWell>
              </CardContent>
            </Card>

            {/* Window primitive */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Window title="Active Window" active={true} className="min-h-52">
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">Foreground Active</p>
                  <p className="text-xs text-muted-foreground">
                    Clear backdrop-blur + neutral window controls. Close goes destructive on hover.
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
                <CardDescription>
                  Custom scrollbars with vertical and horizontal layouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Vertical Scroll
                  </span>
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
                  <span className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Horizontal Scroll
                  </span>
                  <ScrollArea className="w-full rounded-md border p-3 whitespace-nowrap">
                    <div className="flex gap-3 pb-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="inline-block min-w-36 rounded bg-muted p-4 text-center text-xs"
                        >
                          Column item {i + 1}
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            {/* Dock Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Dock Navigation</CardTitle>
                <CardDescription>
                  Floating macOS-style dock with dynamic magnification.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <Dock>
                  <DockItem
                    label="Light View"
                    active={previewContrast === 'standard'}
                    onClick={() => setPreviewContrast('standard')}
                  >
                    <SunIcon className="size-5" />
                  </DockItem>
                  <DockItem
                    label="Dark View"
                    active={previewContrast === 'more'}
                    onClick={() => setPreviewContrast('more')}
                  >
                    <MoonIcon className="size-5" />
                  </DockItem>
                  <DockItem
                    label="Settings Actions"
                    onClick={() => toast.info('Dock settings tapped.')}
                  >
                    <SettingsIcon className="size-5" />
                  </DockItem>
                </Dock>
              </CardContent>
            </Card>
          </div>
        </ShowcaseSection>

        {/* 4. OVERLAYS AND MENUS */}
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
                    <Button variant="outline" pressable={false} className="w-full justify-between">
                      Open Dropdown
                      <ExternalLinkIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Account Preferences</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toast.info('Profile menu selected.')}>
                      <UserIcon />
                      User Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info('Appearance settings opened.')}>
                      <SettingsIcon />
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
                        <PanelRightIcon />
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
                      <TrashIcon />
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
                      <PlusIcon />
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
                        <ContextMenuRadioGroup
                          value={dropdownRadio}
                          onValueChange={setDropdownRadio}
                        >
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

        {/* 5. FEEDBACK */}
        <ShowcaseSection
          id="feedback"
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
                  <div className="grow space-y-2">
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
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground">Shimmer Variant</p>
                <div className="flex items-center gap-3">
                  <Skeleton variant="shimmer" className="size-10 rounded-full" />
                  <div className="grow space-y-2">
                    <Skeleton variant="shimmer" className="h-4 w-3/5" />
                    <Skeleton variant="shimmer" className="h-3 w-4/5" />
                  </div>
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
                <Button variant="outline" onClick={() => toast.info('Workspace sync initiated.')}>
                  Info
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.success('Changes saved successfully.')}
                >
                  Success
                </Button>
                <Button variant="outline" onClick={() => toast.warning('Low memory warning.')}>
                  Warning
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => toast.error('Database connection failed.')}
                >
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
          id="identity-personalization"
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
                    <AvatarImage
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                      alt="Jane"
                    />
                    <AvatarFallback>JN</AvatarFallback>
                    <AvatarBadge className="size-3 border-2 border-background bg-success" />
                  </Avatar>
                  <Avatar className="size-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </div>
                <Separator />
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-muted-foreground">
                    Avatar Group
                  </span>
                  <AvatarGroup>
                    <Avatar>
                      <AvatarFallback>AL</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarImage
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                        alt="Jane"
                      />
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
                <CardDescription>
                  Brand color overrides across actions and outlines.
                </CardDescription>
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
                        'size-8 cursor-pointer rounded-full border-2 bg-primary capitalize transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        accent === value ? 'scale-105 border-foreground' : 'border-transparent',
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Applies <code>data-accent</code> attribute to scope color mixes. Accent is
                  currently:{' '}
                  <span className="font-mono font-semibold text-foreground capitalize">
                    {accent || 'cyan (default)'}
                  </span>
                  .
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
                <SegmentedPicker
                  aria-label="Glass level"
                  options={GLASS_LEVELS}
                  value={glass}
                  onChange={setGlass}
                />
                <p className="text-xs text-muted-foreground">
                  Current intensity:{' '}
                  <span className="font-mono font-semibold text-foreground capitalize">
                    {glass || 'default'}
                  </span>
                  . Applies <code>data-glass</code> parameter to override global variables.
                </p>
              </CardContent>
            </Card>

            {/* Data Density personalization */}
            <Card>
              <CardHeader>
                <CardTitle>Data Density</CardTitle>
                <CardDescription>
                  Adjust control spacing and height for high-density layouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SegmentedPicker
                  aria-label="Density"
                  options={DENSITIES}
                  value={density}
                  onChange={setDensity}
                />
                <p className="text-xs text-muted-foreground">
                  Current density:{' '}
                  <span className="font-mono font-semibold text-foreground capitalize">
                    {density || 'comfortable'}
                  </span>
                  . Applies <code>data-density</code> parameter to override control height
                  (h-control: 36px ↔ 32px) and paddings.
                </p>
              </CardContent>
            </Card>
          </div>
        </ShowcaseSection>

        {/* 7. MOTION */}
        <ShowcaseSection
          id="motion"
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
                  className="cursor-default rounded-xl border bg-card p-4 text-xs transition-colors hover:border-primary/50"
                >
                  <p className="font-semibold text-foreground">hoverLift Recipe</p>
                  <p className="mt-1 text-muted-foreground">
                    Hover to float up, click to compress. Snappy curve for cards.
                  </p>
                </motion.div>

                <motion.button
                  type="button"
                  {...(shouldReduceMotion ? {} : recipes.pressScale)}
                  onClick={() => toast.info('pressScale gesture tapped.')}
                  className="w-full cursor-pointer rounded-xl bg-primary p-4 text-left text-xs text-primary-foreground"
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
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setStaggerKey((key) => key + 1)}
                  >
                    Replay Sequence
                  </Button>
                </div>
                <CardDescription>
                  Sequence delays via staggerContainer/staggerItem recipes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.ul
                  key={staggerKey}
                  {...(shouldReduceMotion ? {} : recipes.staggerContainer)}
                  className="grid gap-2"
                >
                  {['Initial viewport mount', 'Synchronized step 1', 'Completed step 2'].map(
                    (word, i) => (
                      <motion.li
                        key={word}
                        {...(shouldReduceMotion ? {} : recipes.staggerItem)}
                        className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs text-muted-foreground"
                      >
                        <span>{word}</span>
                        <span className="font-mono text-[10px] opacity-75">Index {i}</span>
                      </motion.li>
                    ),
                  )}
                </motion.ul>
              </CardContent>
            </Card>

            {/* CSS Micro-feedback */}
            <Card>
              <CardHeader>
                <CardTitle>CSS Micro-Feedback</CardTitle>
                <CardDescription>
                  CSS transitions (no motion dependencies) gated by motion-safe query.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card interactive>
                  <CardContent className="pt-6">
                    <p className="font-semibold text-card-foreground">Interactive CSS Card</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hover lift & active press down scaling driven by CSS using the{' '}
                      <code>--press-scale</code> token.
                    </p>
                  </CardContent>
                </Card>
                <div className="flex justify-center">
                  <Button className="w-full transition-transform active:scale-(--press-scale)">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMotionWindowOpen((open) => !open)}
                  >
                    {motionWindowOpen ? 'Unmount Window' : 'Mount Window'}
                  </Button>
                </div>
                <CardDescription>Framer Motion AnimatePresence transition hooks.</CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-52 items-center justify-center rounded-xl border border-dashed bg-muted/20">
                <AnimatePresence>
                  {motionWindowOpen && (
                    <Window
                      key="motion-demo"
                      title="Motion-tracked window"
                      className="w-full max-w-lg shadow-lg"
                    >
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

            {/* fadeRise Recipe */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>fadeRise Recipe</CardTitle>
                  <Button variant="outline" size="xs" onClick={() => setFadeRiseVisible((v) => !v)}>
                    {fadeRiseVisible ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <CardDescription>Content enter/exit for use with AnimatePresence.</CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-32 items-center justify-center">
                <AnimatePresence>
                  {fadeRiseVisible && (
                    <motion.div
                      key="fade-rise-demo"
                      {...(shouldReduceMotion ? {} : recipes.fadeRise)}
                      className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm"
                    >
                      <p className="font-semibold text-primary">Fade + Rise</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Exit animation triggers when unmounted inside AnimatePresence.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* View Transitions */}
            <Card>
              <CardHeader>
                <CardTitle>View Transitions</CardTitle>
                <CardDescription>
                  Native View Transitions API with progressive enhancement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    withViewTransition(() => toast.success('View transition callback executed.'))
                  }
                >
                  Trigger withViewTransition
                </Button>
                <p className="text-xs text-muted-foreground">
                  <code>withViewTransition</code> wraps callbacks in{' '}
                  <code>document.startViewTransition()</code>. Falls back to immediate execution
                  when unsupported or reduced-motion is preferred.
                </p>
              </CardContent>
            </Card>
          </div>
        </ShowcaseSection>

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
              {/* Z-index regression scenario (§1 of layering-interaction-2026-upgrade):
                Select content must render at --z-popover (1050) — above this modal at
                --z-modal (1000). If z-index is wrong, the dropdown is hidden behind the dialog. */}
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
            <DialogFooter className="border-t bg-card/40 px-6 py-4">
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

        {/* 9. BENTO GRID — 12-col visual contract for Playwright snapshots */}
        <ShowcaseSection
          title="Bento Grid (12-col)"
          id="bento-grid"
          description="Mathematical 12-column grid with tier-based spans (hero/feature/metric/accent/full). Visual contract: Playwright snapshots this section."
        >
          <BentoGrid id="bento-showcase">
            {/* HERO tier: col-span-6 row-span-2 (desktop), col-span-6 (tablet) */}
            <BentoGridItem
              tier="hero"
              ariaLabel="142k active users this month"
              icon={<UserIcon className="size-4" />}
              title="142k"
              description="Active users this month — hero KPI tile"
              minHeight={220}
            >
              <div className="flex flex-1 items-end">
                <div className="flex h-16 w-full items-end gap-1">
                  {[40, 55, 38, 72, 60, 85, 78].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-primary/20"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </BentoGridItem>

            {/* FEATURE tier: col-span-4 row-span-2 (desktop), col-span-6 (tablet) */}
            <BentoGridItem
              tier="feature"
              icon={<SettingsIcon className="size-4" />}
              title="System Health"
              description="Feature tile — chart / sparkline / donut"
              minHeight={220}
            >
              <div className="flex flex-1 items-center justify-center">
                <div className="relative size-20">
                  <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-muted"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="72 28"
                      className="text-primary"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    72%
                  </span>
                </div>
              </div>
            </BentoGridItem>

            {/* METRIC tier: col-span-3 (desktop), col-span-3 (tablet) */}
            <BentoGridItem
              tier="metric"
              ariaLabel="98.7% uptime SLA"
              icon={<CheckCircle2Icon className="size-4" />}
              title="98.7%"
              description="Uptime SLA"
            />

            {/* METRIC tile: another KPI */}
            <BentoGridItem
              tier="metric"
              ariaLabel="3.4ms average API response time"
              icon={<BellIcon className="size-4" />}
              title="3.4ms"
              description="Avg. API response"
            />

            {/* METRIC tile: another KPI */}
            <BentoGridItem
              tier="metric"
              ariaLabel="24 active sessions"
              icon={<MoonIcon className="size-4" />}
              title="24"
              description="Active sessions"
            />

            {/* METRIC tile: another KPI */}
            <BentoGridItem
              tier="metric"
              ariaLabel="1.2GB memory used"
              icon={<SunIcon className="size-4" />}
              title="1.2GB"
              description="Memory used"
            />

            {/* ACCENT tier: col-span-2 (desktop), col-span-2 (tablet) */}
            <BentoGridItem
              tier="accent"
              icon={<PlusIcon className="size-4" />}
              title="Quick Add"
              description="CTA tile"
            />

            <BentoGridItem
              tier="accent"
              icon={<ExternalLinkIcon className="size-4" />}
              title="Export"
              description="Accent shortcut"
            />

            {/* FULL tier: col-span-12 (desktop), col-span-6 (tablet) */}
            <BentoGridItem
              tier="full"
              title="Activity Feed"
              description="Full-width tile — activity feed, data tables, high-density content"
            >
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded-md" />
                ))}
              </div>
            </BentoGridItem>
          </BentoGrid>
        </ShowcaseSection>

        {/* 10. CARD STATES & SPOTLIGHT */}
        <ShowcaseSection
          id="card-states"
          title="Card States & Spotlight"
          description="State machine (idle/loading/error/success) and pointer-tracked spotlight variant."
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Idle — default */}
            <Card state="idle" className="p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm">Idle State</CardTitle>
                <CardDescription>Default — no feedback</CardDescription>
              </CardHeader>
              <CardContent className="px-0 text-xs text-muted-foreground">
                Passive surface, no animation.
              </CardContent>
            </Card>

            {/* Loading */}
            <Card state="loading" className="p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm">Loading State</CardTitle>
                <CardDescription>Breathing pulse + aria-busy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-0">
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </CardContent>
            </Card>

            {/* Error */}
            <Card state="error" className="p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm text-destructive">Error State</CardTitle>
                <CardDescription>Shake + destructive border</CardDescription>
              </CardHeader>
              <CardContent className="px-0 text-xs text-muted-foreground">
                Lateral shake runs once. Border tint: destructive/20.
              </CardContent>
            </Card>

            {/* Success */}
            <Card state="success" className="p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm text-success">Success State</CardTitle>
                <CardDescription>Spring border + success tint</CardDescription>
              </CardHeader>
              <CardContent className="px-0 text-xs text-muted-foreground">
                Border tint: success/20 with --ease-spring transition.
              </CardContent>
            </Card>
          </div>

          {/* Spotlight */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <CardSpotlight interactive className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Spotlight Variant</CardTitle>
                <CardDescription>
                  Hover to see the pointer-tracked radial highlight.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 text-sm text-muted-foreground">
                The highlight uses <code>color-mix(oklch, --primary 12%)</code> — a semantic token
                expression, not a raw color. Reduced-motion hides it entirely.
              </CardContent>
            </CardSpotlight>

            <CardSpotlight interactive className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Spotlight + Content</CardTitle>
                <CardDescription>
                  Highlight passes through clicks (pointer-events: none).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-0">
                <Button size="sm">Action Button</Button>
                <p className="text-xs text-muted-foreground">
                  Interactive content works normally inside a spotlight card.
                </p>
              </CardContent>
            </CardSpotlight>
          </div>
        </ShowcaseSection>
      </div>
    </div>
  );
}

function ShowcaseSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
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
    <div
      className={cn(
        'flex h-12 flex-col justify-between rounded-md p-2 text-[11px] leading-none font-medium',
        className,
      )}
    >
      <span>{label}</span>
      <span className="self-end text-[10px] opacity-75">Aa</span>
    </div>
  );
}

function RadiusDemo({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-md border bg-muted/20 p-2">
      <div className={cn('size-12 border-2 border-primary bg-background shadow-xs', className)} />
      <span className="w-full truncate text-center font-mono text-[10px] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
