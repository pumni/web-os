import * as React from 'react';
import { toast } from 'sonner';
import { HelpCircleIcon, SunIcon, SettingsIcon } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardFooter,
  CardWell,
  Dock,
  DockItem,
  GlassSurface,
  IconBadge,
  ScrollArea,
  ScrollBar,
  Skeleton,
  Window,
} from '@pumni/ui';
import { ShowcaseSection } from './showcase-section';

export function SurfacesSection() {
  return (
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
            <div className="absolute inset-0 bg-muted/30" />
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
                  fill with a luminous light border and a volumetric rim pair. Float it over a
                  backdrop.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Optimal for OS windows, dialog panels, and elements layered on top of backdrops.
              </CardContent>
              <CardFooter className="justify-end gap-2 border-t pt-4">
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
              <CardFooter className="justify-between border-t pt-4 text-xs text-muted-foreground">
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
              Frosted translucent floating surfaces with dedicated layout roles — float them over a
              backdrop.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Glass only reads as glass over a backdrop — float these roles
                over the desktop blob gradient, not on a flat opaque card. */}
            <div className="relative overflow-hidden rounded-xl border bg-background p-4">
              <div aria-hidden className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -left-16 size-72 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
                <div className="absolute -right-12 -bottom-24 size-72 rounded-full bg-(--desktop-blob-secondary) opacity-50 blur-3xl" />
                <div className="absolute inset-0 bg-muted/30" />
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
                  <div className="text-muted-foreground">Maximum readability over gradients.</div>
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

        {/* Card composition primitives — IconBadge / CardWell.
            Badge tones live in the Feedback section (single source of truth);
            this card owns the surface-role primitives that have no other home. */}
        <Card>
          <CardHeader>
            <CardTitle>Card Composition Primitives</CardTitle>
            <CardDescription>
              Icon chips and inset wells — compose these instead of writing{' '}
              <code>border bg-muted</code> by hand.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
              Floating macOS-style dock with dynamic magnification. The <code>active</code> prop
              marks the focused app; the others are launchers.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <DockDemo />
          </CardContent>
        </Card>
      </div>
    </ShowcaseSection>
  );
}

/**
 * Self-contained dock launcher demo. The active app is local state (the dock's
 * real semantic — which running app is focused), decoupled from the
 * personalization state the rest of the showcase drives.
 */
const DOCK_APPS = ['home', 'library', 'settings'] as const;
type DockApp = (typeof DOCK_APPS)[number];
const DOCK_APP_LABELS: Record<DockApp, string> = {
  home: 'Home',
  library: 'Library',
  settings: 'Settings',
};

function DockDemo() {
  const [activeApp, setActiveApp] = React.useState<DockApp>('home');
  return (
    <Dock>
      {DOCK_APPS.map((app) => (
        <DockItem
          key={app}
          label={DOCK_APP_LABELS[app]}
          active={activeApp === app}
          onClick={() => {
            setActiveApp(app);
            toast.info(`${DOCK_APP_LABELS[app]} launched.`);
          }}
        >
          {app === 'home' && <SunIcon className="size-5" />}
          {app === 'library' && <HelpCircleIcon className="size-5" />}
          {app === 'settings' && <SettingsIcon className="size-5" />}
        </DockItem>
      ))}
    </Dock>
  );
}
